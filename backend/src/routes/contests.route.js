import express from "express";
import axios from "axios";
import fs from "fs/promises";
import path from "path";
import { db } from "../config/db.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Helper to safely parse Postgres timestamps as UTC
const toUTC = (dbDate) => {
  if (!dbDate) return new Date();
  if (dbDate instanceof Date) return dbDate;
  let d = dbDate;
  if (typeof d === "string" && !d.includes("Z") && !d.includes("+")) {
    d = d.replace(" ", "T") + "Z";
  }
  return new Date(d);
};

async function assertContestRunning(conn, contestId) {
  const { rows } = await conn.query(
    `SELECT start_time, end_time FROM contests WHERE id = $1`,
    [contestId]
  );
  const contest = rows[0];

  if (!contest) {
    const err = new Error("Contest not found");
    err.status = 404;
    throw err;
  }

  const now = new Date();
  const stime = toUTC(contest.start_time);
  const etime = toUTC(contest.end_time);
  if (now < stime) {
    const err = new Error("Contest not started");
    err.status = 403;
    throw err;
  }

  if (now > etime) {
    const err = new Error("Contest ended");
    err.status = 403;
    throw err;
  }

  return contest;
}
/* =======================
   Judge0 Config
======================= */
//""
const JUDGE0_URL = process.env.JUDGE0_URL;
  ;

const LANGUAGE_MAP = {
  cpp: 54,
  java: 62,
  python: 71,
  javascript: 63,
};

function mapVerdict(description) {
  if (!description) return "WA";
  if (description.includes("Time Limit")) return "TLE";
  if (description.includes("Memory Limit")) return "MLE";
  if (description.includes("Compilation Error")) return "CE";
  if (description.includes("Runtime Error")) return "RE";
  return "WA";
}

const BASE_TIME_LIMIT_SEC = 2.0;
const BASE_MEMORY_LIMIT_KB = 128 * 1024; // 128 MB

const LIMIT_MULTIPLIERS = {
  cpp:        { time: 1.0, memory: 1.0 },
  java:       { time: 2.0, memory: 4.0 }, 
  python:     { time: 5.0, memory: 2.0 }, 
  javascript: { time: 2.0, memory: 2.0 }, 
};

/* ============================================================
   GET /api/contests?status=upcoming|running|past
============================================================ */

// POST /api/contests
router.post("/contests", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const {
    name,
    start_time,
    end_time,
    problems, // array of problem_ids
    writers,  // array of usernames (e.g., ["tourist", "atharv"])
    token     // required only for moderators
  } = req.body;

  // ---------- Basic Validation ----------
  if (
    !name ||
    !start_time ||
    !end_time ||
    !Array.isArray(problems) ||
    problems.length === 0 ||
    !Array.isArray(writers) ||
    writers.length === 0
  ) {
    return res.status(400).json({ error: "Invalid contest data" });
  }

  const start = new Date(start_time);
  const end = new Date(end_time);

  if (start >= end) {
    return res.status(400).json({ error: "End time must be after start time" });
  }

  // Automatically calculate duration in minutes
  const duration_minutes = Math.round((end.getTime() - start.getTime()) / 60000);

  const conn = await db.connect();

  try {
    /* ---------- Role Authorization ---------- */
    // Fetch the freshest role status directly from the DB
    const { rows: userRows } = await conn.query(
      `SELECT role FROM users WHERE id = $1`,
      [userId]
    );
    const role = userRows[0]?.role;

    if (!role || role === "user") {
      return res.status(403).json({ error: "Users do not have permission to create contests" });
    }

    if (role === "moderator" && !token) {
      return res.status(403).json({ error: "A valid token is required for moderators to create a contest" });
    }

    await conn.query('BEGIN');

    /* ---------- Token Consumption (Atomic Lock) ---------- */
    if (role === "moderator") {
      // Deleting the token and checking rowCount in the same step prevents 
      // a race condition where two moderators use the same token at the exact same millisecond.
      const { rowCount } = await conn.query(
        `DELETE FROM contest_creation_tokens WHERE token = $1`,
        [token]
      );

      if (rowCount === 0) {
        throw new Error("INVALID_TOKEN");
      }
    }

    /* ---------- Resolve Writer Usernames to IDs ---------- */
    // Use an optimized bulk query instead of querying in a loop
    const { rows: writerRows } = await conn.query(
      `SELECT id, username FROM users WHERE username = ANY($1::text[])`,
      [writers]
    );

    if (writerRows.length !== writers.length) {
      // Find exactly which usernames were invalid for a better error message
      const foundUsernames = writerRows.map(w => w.username);
      const missingUsernames = writers.filter(w => !foundUsernames.includes(w));
      throw new Error(`Usernames not found: ${missingUsernames.join(", ")}`);
    }

    /* ---------- Create Contest ---------- */
    const { rows: contestResult } = await conn.query(
      `
      INSERT INTO contests
        (name, start_time, end_time, duration_minutes)
      VALUES ($1, $2, $3, $4)
      RETURNING id
      `,
      [name, start, end, duration_minutes]
    );

    const contestId = contestResult[0].id;

    /* ---------- Attach Problems ---------- */
    for (let i = 0; i < problems.length; i++) {
      const { rows } = await conn.query(
        `SELECT difficulty FROM problems WHERE id = $1`,
        [problems[i]]
      );

      const difficulty = rows[0]?.difficulty;

      await conn.query(
        `
        INSERT INTO contest_problems
          (contest_id, problem_id, problem_index, difficulty)
        VALUES ($1, $2, $3, $4)
        `,
        [
          contestId,
          problems[i],
          String.fromCharCode(65 + i), // A, B, C, etc.
          difficulty,
        ]
      );
    }

    /* ---------- Attach Writers ---------- */
    for (const writer of writerRows) {
      await conn.query(
        `
        INSERT INTO contest_writers (contest_id, user_id)
        VALUES ($1, $2)
        `,
        [contestId, writer.id]
      );
    }

    await conn.query('COMMIT');

    res.json({
      success: true,
      contest_id: contestId,
      duration_minutes: duration_minutes
    });

  } catch (err) {
    await conn.query('ROLLBACK');
    
    // Handle specific custom errors thrown during the transaction
    if (err.message === "INVALID_TOKEN") {
      return res.status(403).json({ error: "Invalid, expired, or already used creation token" });
    }
    if (err.message.startsWith("Usernames not found")) {
      return res.status(400).json({ error: err.message });
    }

    console.error("Contest creation error:", err);
    res.status(500).json({ error: "Failed to create contest" });
  } finally {
    conn.release();
  }
});

router.get("/contests", async (req, res) => {
  const { status } = req.query;

  let condition = "";
  if (status === "upcoming") condition = "start_time > NOW()";
  else if (status === "past") condition = "end_time < NOW()";
  else condition = "start_time <= NOW() AND end_time >= NOW()";

  try {
    const { rows } = await db.query(
      `
      SELECT
        c.id,
        c.name,
        c.start_time,
        c.end_time,
        c.duration_minutes,
        COUNT(cs.user_id) AS participants
      FROM contests c
      LEFT JOIN contest_scores cs ON cs.contest_id = c.id
      WHERE ${condition}
      GROUP BY c.id
      ORDER BY c.start_time
      `
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch contests" });
  }
});

/* ============================================================
   GET /api/contests/:contestId
============================================================ */
router.get("/contests/:contestId", async (req, res) => {
  const { contestId } = req.params;

  try {
    const { rows: contestRows } = await db.query(
      `SELECT * FROM contests WHERE id = $1`,
      [contestId]
    );
    const contest = contestRows[0];

    if (!contest) {
      return res.status(404).json({ error: "Contest not found" });
    }

    const { rows: problems } = await db.query(
      `
      SELECT problem_id, problem_index, difficulty
      FROM contest_problems
      WHERE contest_id = $1
      ORDER BY problem_index
      `,
      [contestId]
    );

    res.json({ contest, problems });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch contest" });
  }
});

// GET /api/contests/:contestId/problems/:problemId
router.get(
  "/contests/:contestId/problems/:problemId",
  authMiddleware,
  async (req, res) => {
    const { contestId, problemId } = req.params;

    if (!problemId || isNaN(problemId)) {
      return res.status(400).json({ error: "Invalid problem ID" });
    }

    try {
      // 1. Fetch contest bounds to enforce access rules
      const { rows: contestRows } = await db.query(
        `SELECT start_time, end_time FROM contests WHERE id = $1`,
        [contestId]
      );
      const contest = contestRows[0];

      if (!contest) {
        return res.status(404).json({ error: "Contest not found" });
      }

      // Safe UTC parsing
      let st = contest.start_time;
      if (typeof st === "string" && !st.includes("Z") && !st.includes("+")) st += "Z";
      let et = contest.end_time;
      if (typeof et === "string" && !et.includes("Z") && !et.includes("+")) et += "Z";
      
      const now = new Date();
      const start = new Date(st);
      
      // Prevent early access (before start time)
      if (now < start) {
        return res.status(403).json({ error: "Contest has not started", code: "NOT_STARTED" });
      }

      // 2. Fetch problem core + content + stats + contest index (A, B, C)
      const { rows: problemRows } = await db.query(
        `
        SELECT
          p.id,
          p.title,
          p.difficulty,
          p.created_at,

          pc.statement,
          pc.constraints,
          pc.input_format,
          pc.output_format,
          pc.editorial,

          ps.total_submissions,
          ps.acceptance_rate,

          cp.problem_index
        FROM problems p
        JOIN problem_content pc ON pc.problem_id = p.id
        JOIN problem_stats ps ON ps.problem_id = p.id
        JOIN contest_problems cp ON cp.problem_id = p.id
        WHERE p.id = $1 AND cp.contest_id = $2
        `,
        [problemId, contestId]
      );

      const problem = problemRows[0];

      if (!problem) {
        return res.status(404).json({ error: "Problem not found in this contest" });
      }

      // 3. Fetch sample testcases (paths)
      const { rows: sampleRows } = await db.query(
        `
        SELECT input_path, output_path
        FROM problem_testcases
        WHERE problem_id = $1 AND is_sample = 1
        `,
        [problemId]
      );

      // 4. Read testcase files from disk
      const samples = [];
      for (const tc of sampleRows) {
        const inputPath = path.join(process.cwd(), tc.input_path);
        const outputPath = path.join(process.cwd(), tc.output_path);

        const input = await fs.readFile(inputPath, "utf-8");
        const output = await fs.readFile(outputPath, "utf-8");

        samples.push({ input, output });
      }

      // 5. Send unified response
      res.json({
        contest: { end_time: et }, // Pass end_time so frontend can dynamically disable submit
        problem: {
          id: problem.id,
          index: problem.problem_index,
          title: problem.title,
          difficulty: problem.difficulty,
        },
        content: {
          statement: problem.statement,
          constraints: problem.constraints,
          input_format: problem.input_format,
          output_format: problem.output_format,
        },
        stats: {
          total_submissions: problem.total_submissions,
          acceptance_rate: problem.acceptance_rate,
        },
        samples,
      });
    } catch (err) {
      console.error("Failed to fetch problem:", err);
      res.status(500).json({ error: "Failed to fetch problem details" });
    }
  }
);

router.get(
  "/contests/:contestId/submissions",
  authMiddleware,
  async (req, res) => {
    const userId = req.user.id;
    const { contestId } = req.params;

    try {
      const { rows } = await db.query(
        `
        SELECT
          problem_id,
          verdict,
          submitted_at,
          execution_time
        FROM contest_submissions
        WHERE contest_id = $1 AND user_id = $2
        ORDER BY submitted_at DESC
        `,
        [contestId, userId]
      );

      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  }
);


router.get(
  "/contests/:contestId/problems",
  authMiddleware,
  async (req, res) => {
    const userId = req.user.id;
    const { contestId } = req.params;

    try {
      //  Contest check
      const { rows: contestRows } = await db.query(
        `SELECT start_time, end_time FROM contests WHERE id = $1`,
        [contestId]
      );
      const contest = contestRows[0];

      if (!contest) {
        return res.status(404).json({ error: "Contest not found" });
      }

      const now = new Date();
      const start = toUTC(contest.start_time);
      const end   = toUTC(contest.end_time);
      
        
      if (now < start || now > end) {
        
        return res.status(403).json({ error: "Contest not active" });
      }

      const { rows: registeredRows } = await db.query(
        `
        SELECT 1
        FROM contest_scores
        WHERE contest_id = $1 AND user_id = $2
        `,
        [contestId, userId]
      );
      const registered = registeredRows[0];

      if (!registered) {
        return res.status(403).json({ error: "Not registered" });
      }

      //  Fetch problems
      // const { rows } = await db.query(
      //   `
      //   SELECT problem_id, problem_index, difficulty
      //   FROM contest_problems
      //   WHERE contest_id = $1
      //   ORDER BY problem_index
      //   `,
      //   [contestId]
      // );
      const { rows } = await db.query(
        `
        SELECT 
          cp.problem_id, 
          cp.problem_index, 
          cp.difficulty,
          p.title,
          (
            SELECT COUNT(DISTINCT cps.user_id)
            FROM contest_problem_status cps
            WHERE cps.contest_id = cp.contest_id 
              AND cps.problem_id = cp.problem_id 
              AND cps.solved = 1
          ) AS solved_count
        FROM contest_problems cp
        JOIN problems p ON p.id = cp.problem_id
        WHERE cp.contest_id = $1
        ORDER BY cp.problem_index
        `,
        [contestId]
      );

      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch problems" });
    }
  }
);

router.get("/contests/:contestId/my-submissions", authMiddleware, async (req, res) => {
  const { contestId } = req.params;
  const userId = req.user.id;

  try {
    const { rows } = await db.query(
      `
      SELECT 
        s.id AS submission_id,
        s.submitted_at,
        cp.problem_index,
        p.title AS problem_title,
        p.id AS problem_id,
        s.language,
        s.code,
        s.verdict,
        s.execution_time AS time_ms,
        s.memory_kb
      FROM contest_submissions s
      JOIN contest_problems cp ON cp.problem_id = s.problem_id AND cp.contest_id = s.contest_id
      JOIN problems p ON p.id = s.problem_id
      WHERE s.contest_id = $1 AND s.user_id = $2
      ORDER BY s.submitted_at DESC
      `,
      [contestId, userId]
    );

    res.json(rows);
  } catch (err) {
    console.error("Failed to fetch user contest submissions:", err);
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

// GET /api/contests/:contestId/results
router.get("/contests/:contestId/results", async (req, res) => {
  const { contestId } = req.params;

  try {
    const { rows: contestRows } = await db.query(
      `SELECT end_time FROM contests WHERE id = $1`,
      [contestId]
    );
    const contest = contestRows[0];

    // If contest doesn't exist, throw 404
    if (!contest) {
      return res.status(404).json({ error: "Contest not found" });
    }

    const now = new Date();
    let endTime = contest.end_time;
    if (typeof endTime === "string" && !endTime.includes("Z") && !endTime.includes("+")) {
      endTime = endTime.replace(" ", "T") + "Z";
    }
    const end = new Date(endTime);

    // If the contest is still running or upcoming, block access.
    if (now <= end) {
      return res.status(403).json({ error: "Results are not available yet. Contest has not ended." });
    }

    // 2. Fetch contest problems config
    const { rows: problems } = await db.query(
      `
      SELECT
        p.id AS problem_id,
        cp.problem_index,
        p.title,
        p.difficulty
      FROM contest_problems cp
      JOIN problems p ON p.id = cp.problem_id
      WHERE cp.contest_id = $1::INT
      ORDER BY cp.problem_index
      `,
      [contestId]
    );

    // 3. Fetch leaderboard rows with embedded problem status subqueries
    const { rows: leaderboard } = await db.query(
      `
      SELECT
        cr.user_id,
        u.username,
        cr.solved_count,
        cr.penalty,
        (
          -- Added COALESCE to ensure we always get an array [], never NULL
          SELECT COALESCE(json_agg(
            json_build_object(
              'problem_id', cps.problem_id,
              'solved', cps.solved,
              'wrong_attempts', cps.wrong_attempts,
              'first_ac_time_minutes', cps.first_ac_time_minutes
            )
          ), '[]'::json)
          FROM contest_problem_status cps
          WHERE cps.contest_id = cr.contest_id AND cps.user_id = cr.user_id
        ) AS problem_stats
      FROM contest_results cr
      JOIN users u ON u.id = cr.user_id
      WHERE cr.contest_id = $1::INT
      ORDER BY cr.solved_count DESC, cr.penalty ASC
      `,
      [contestId]
    );

    res.json({
      contestId,
      problems,
      leaderboard
    });
  } catch (err) {
    console.error("Failed to fetch contest results:", err);
    res.status(500).json({ error: "Failed to fetch contest results" });
  }
});


/* ============================================================
   POST /api/contests/:contestId/register
============================================================ */
router.post(
  "/contests/:contestId/register",
  authMiddleware,
  async (req, res) => {
    const userId = req.user.id;
    const { contestId } = req.params;

    const conn = await db.connect();
    
    try {
      // 1. Fetch contest end_time to validate registration window
      const { rows } = await conn.query(
        `SELECT end_time FROM contests WHERE id = $1`,
        [contestId]
      );
      const contest = rows[0];

      if (!contest) {
        return res.status(404).json({ error: "Contest not found" });
      }

      // 2. Enforce the time constraint 
      const now = new Date();
      const endTime = toUTC(contest.end_time);

      if (now > endTime) {
        return res.status(403).json({ 
          error: "Registration is closed. The contest has already ended." 
        });
      }

      // 3. Proceed with registration transaction
      await conn.query('BEGIN');

      await conn.query(
        `
        INSERT INTO contest_scores (contest_id, user_id)
        VALUES ($1, $2)
        ON CONFLICT (contest_id, user_id) DO NOTHING
        `,
        [contestId, userId]
      );

      await conn.query(
        `
        INSERT INTO contest_problem_status
        (contest_id, user_id, problem_id)
        SELECT $1, $2, problem_id
        FROM contest_problems
        WHERE contest_id = $3
        ON CONFLICT (contest_id, user_id, problem_id) DO NOTHING
        `,
        [contestId, userId, contestId]
      );

      await conn.query('COMMIT');
      res.json({ success: true });
    } catch (err) {
      await conn.query('ROLLBACK');
      console.error(err);
      res.status(500).json({ error: "Contest registration failed" });
    } finally {
      // Safely release connection regardless of success, failure, or early return
      conn.release();
    }
  }
);
// unregister
router.post(
  "/contests/:contestId/unregister",
  authMiddleware,
  async (req, res) => {
    const userId = req.user.id;
    const { contestId } = req.params;

    const conn = await db.connect();

    try {
      // 1. Fetch contest start time
      const { rows } = await conn.query(
        `SELECT start_time FROM contests WHERE id = $1`,
        [contestId]
      );
      const contest = rows[0];

      if (!contest) {
        return res.status(404).json({ error: "Contest not found" });
      }

      // 2. Enforce the time constraint
      const now = new Date();
      const startTime = toUTC(contest.start_time);

      if (now >= startTime) {
        return res.status(403).json({ 
          error: "Unregistration is only allowed before the contest starts." 
        });
      }

      // 3. Proceed with deletion transaction
      await conn.query("BEGIN");

      await conn.query(
        `
        DELETE FROM contest_problem_status
        WHERE contest_id = $1
          AND user_id = $2
        `,
        [contestId, userId]
      );

      await conn.query(
        `
        DELETE FROM contest_scores
        WHERE contest_id = $1
          AND user_id = $2
        `,
        [contestId, userId]
      );

      await conn.query("COMMIT");

      res.json({ success: true });
    } catch (err) {
      await conn.query("ROLLBACK");
      console.error(err);

      res.status(500).json({
        error: "Contest unregistration failed",
      });
    } finally {
      // Releases the connection regardless of success, failure, or early returns
      conn.release();
    }
  }
);

/* ============================================================
   GET /api/contests/:contestId/leaderboard
============================================================ */
// router.get("/contests/:contestId/leaderboard", async (req, res) => {
//   const { contestId } = req.params;

//   const { rows: contestRows } = await db.query(
//     `SELECT end_time FROM contests WHERE id = $1`,
//     [contestId]
//   );
//   const contest = contestRows[0];

//   const now = new Date();
//   const endtime = toUTC(contest.end_time);

//   const table =
//     contest && now > endtime
//       ? "contest_results"
//       : "contest_scores";

//   const { rows } = await db.query(
//     `
//     SELECT user_id, solved_count, penalty
//     FROM ${table}
//     WHERE contest_id = $1
//     ORDER BY solved_count DESC, penalty ASC
//     `,
//     [contestId]
//   );

//   res.json(rows);
// });

router.get("/contests/:contestId/leaderboard", async (req, res) => {
  const { contestId } = req.params;

  try {
    const { rows: contestRows } = await db.query(
      `SELECT end_time FROM contests WHERE id = $1`,
      [contestId]
    );
    const contest = contestRows[0];

    const now = new Date();
    // Assuming toUTC is defined in your file as previously shown
    const endtime = toUTC(contest?.end_time);

    // Determine whether to fetch from live scores or frozen final results
    const table = contest && now > endtime ? "contest_results" : "contest_scores";

    const { rows } = await db.query(
      `
      SELECT 
        t.user_id, 
        u.username,
        t.solved_count, 
        t.penalty,
        (
          SELECT json_agg(
            json_build_object(
              'problem_id', cps.problem_id,
              'solved', cps.solved,
              'wrong_attempts', cps.wrong_attempts,
              'first_ac_time_minutes', cps.first_ac_time_minutes
            )
          )
          FROM contest_problem_status cps
          WHERE cps.contest_id = t.contest_id AND cps.user_id = t.user_id
        ) AS problem_stats
      FROM ${table} t
      JOIN users u ON u.id = t.user_id
      WHERE t.contest_id = $1
      ORDER BY t.solved_count DESC, t.penalty ASC
      `,
      [contestId]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});


/* ============================================================
   POST /api/contests/:contestId/submit
============================================================ */
router.post(
  "/contests/:contestId/submit",
  authMiddleware,
  async (req, res) => {
    const userId = req.user.id;
    const { contestId } = req.params;
    const { problemId, language, code } = req.body;

    if (!LANGUAGE_MAP[language] || !problemId || !code) {
      return res.status(400).json({ error: "Invalid submission data" });
    }

    const conn = await db.connect();

    try {
      /* =======================
         Contest & Problem Validation
      ======================= */
      const { rows: contestRows } = await conn.query(
        `SELECT start_time, end_time FROM contests WHERE id = $1`,
        [contestId]
      );
      const contest = contestRows[0];

      if (!contest) return res.status(404).json({ error: "Contest not found" });

      const now = new Date();
      const start = toUTC(contest.start_time);
      const end   = toUTC(contest.end_time);
      if (now < start || now > end) return res.status(403).json({ error: "Contest not active" });

      const { rows: registeredRows } = await conn.query(
        `SELECT 1 FROM contest_scores WHERE contest_id = $1 AND user_id = $2`,
        [contestId, userId]
      );
      if (!registeredRows[0]) return res.status(403).json({ error: "Not registered for contest" });

      const { rows: belongsRows } = await conn.query(
        `SELECT 1 FROM contest_problems WHERE contest_id = $1 AND problem_id = $2`,
        [contestId, problemId]
      );
      if (!belongsRows[0]) return res.status(400).json({ error: "Problem not part of contest" });

      const { rows: testcases } = await conn.query(
        `SELECT * FROM problem_testcases WHERE problem_id = $1 ORDER BY id`,
        [problemId]
      );

      if (testcases.length === 0) return res.status(400).json({ error: "No testcases found" });

      /* =======================
         Judge0 Execution
      ======================= */
      let finalVerdict = "AC";
      let hiddenFailedIndex = null;
      let hiddenCount = 0;
      let maxRuntimeMs = 0;
      let maxMemoryKb = 0;
      const sampleResults = [];
      
      const codeBase64 = Buffer.from(code).toString("base64");

      // Calculate dynamic limits based on language selection
      const multipliers = LIMIT_MULTIPLIERS[language] || { time: 2.0, memory: 2.0 };
      const timeLimit = BASE_TIME_LIMIT_SEC * multipliers.time;
      const memoryLimit = BASE_MEMORY_LIMIT_KB * multipliers.memory;

      for (let i = 0; i < testcases.length; i++) {
        const tc = testcases[i];

        const input = await fs.readFile(path.join(process.cwd(), tc.input_path), "utf-8");
        const expectedOutput = await fs.readFile(path.join(process.cwd(), tc.output_path), "utf-8");

      
        const judgeRes = await axios.post(
          process.env.JUDGE0_URL,
          {
            source_code: codeBase64,
            language_id: LANGUAGE_MAP[language],
            stdin: Buffer.from(input).toString("base64"),
            expected_output: Buffer.from(expectedOutput).toString("base64"),
            cpu_time_limit: timeLimit,
            memory_limit: memoryLimit
          }
        );

        // Parse metrics
        const judgeStatus = judgeRes.data.status; 
        const runtimeMs = Math.round(parseFloat(judgeRes.data.time || "0") * 1000);
        const memoryKb = judgeRes.data.memory || 0; 
        
        maxRuntimeMs = Math.max(maxRuntimeMs, runtimeMs);
        maxMemoryKb = Math.max(maxMemoryKb, memoryKb);

        // Status ID 3 is "Accepted". Anything else is a failure.
        const isAccepted = judgeStatus.id === 3;
        const currentVerdict = isAccepted ? "AC" : mapVerdict(judgeStatus.description);

        // Record results for samples vs hidden cases
        if (tc.is_sample) {
          sampleResults.push({
            index: sampleResults.length + 1,
            verdict: currentVerdict,
          });
        } else {
          hiddenCount++;
        }

        // Break early if a testcase fails
        if (!isAccepted) {
          finalVerdict = currentVerdict;
          if (!tc.is_sample) {
            hiddenFailedIndex = hiddenCount;
            break; // Stop execution on first hidden failure to save AWS compute
          }
        }
      }

      /* =======================
         Contest DB Updates
      ======================= */
      await conn.query('BEGIN');

      await conn.query(
        `INSERT INTO contest_submissions
          (contest_id, user_id, problem_id, verdict, submitted_at, execution_time, language, code, memory_kb)
         VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7, $8)`,
        [contestId, userId, problemId, finalVerdict, maxRuntimeMs, language, code, maxMemoryKb]
      );

      const { rows: stateRows } = await conn.query(
        `SELECT solved, wrong_attempts FROM contest_problem_status
         WHERE contest_id = $1 AND user_id = $2 AND problem_id = $3 FOR UPDATE`,
        [contestId, userId, problemId]
      );
      
      const state = stateRows[0];
      if (!state) throw new Error("Contest problem state missing");

      if (!state.solved) {
        if (finalVerdict === "AC") {
          const startMs = toUTC(contest.start_time).getTime();
          const minutes = Math.max(0, Math.floor((Date.now() - startMs) / 60000));

          await conn.query(
            `UPDATE contest_problem_status SET solved = 1, first_ac_time_minutes = $1
             WHERE contest_id = $2 AND user_id = $3 AND problem_id = $4`,
            [minutes, contestId, userId, problemId]
          );

          await conn.query(
            `UPDATE contest_scores SET solved_count = solved_count + 1, penalty = penalty + $1 + 5 * $2
             WHERE contest_id = $3 AND user_id = $4`,
            [minutes, state.wrong_attempts, contestId, userId]
          );
        } else {
          await conn.query(
            `UPDATE contest_problem_status SET wrong_attempts = wrong_attempts + 1
             WHERE contest_id = $1 AND user_id = $2 AND problem_id = $3`,
            [contestId, userId, problemId]
          );
        }
      }

      await conn.query('COMMIT');

      res.json({
        verdict: finalVerdict,
        samples: sampleResults,
        hidden_failed: hiddenFailedIndex !== null ? `Hidden testcase #${hiddenFailedIndex}` : null,
      });

    } catch (err) {
      await conn.query('ROLLBACK');
      console.error("Submission error:", err.message || err);
      res.status(500).json({ error: "Contest submission failed" });
    } finally {
      conn.release();
    }
  }
);


router.get(
  "/contests/:contestId/registration-status",
  authMiddleware,
  async (req, res) => {
    const userId = req.user.id;
    const { contestId } = req.params;

    try {
      const { rows } = await db.query(
        `
        SELECT 1
        FROM contest_scores
        WHERE contest_id = $1 AND user_id = $2
        `,
        [contestId, userId]
      );
      const row = rows[0];

      res.json({ registered: !!row });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to check registration" });
    }
  }
);


router.get(
  "/contests/:contestId/results/:userId",
  async (req, res) => {
    const { contestId, userId } = req.params;

    try {
      //  Contest existence + ended check
      const { rows: contestRows } = await db.query(
        `SELECT end_time FROM contests WHERE id = $1`,
        [contestId]
      );
      const contest = contestRows[0];

      if (!contest) {
        return res.status(404).json({ error: "Contest not found" });
      }

      if (new Date() <= toUTC(contest.end_time)) {
        return res.status(403).json({ error: "Results not available yet" });
      }

      //  User must be in final results
      const { rows: rankedRows } = await db.query(
        `
        SELECT 1
        FROM contest_results
        WHERE contest_id = $1 AND user_id = $2
        `,
        [contestId, userId]
      );
      const ranked = rankedRows[0];

      if (!ranked) {
        return res.status(404).json({ error: "User not ranked" });
      }

      //  Problem-wise breakdown
      const { rows } = await db.query(
        `
        SELECT
          cp.problem_index,
          p.title,
          p.difficulty,
          cps.solved,
          cps.wrong_attempts,
          cps.first_ac_time_minutes
        FROM contest_problem_status cps
        JOIN contest_problems cp
          ON cp.problem_id = cps.problem_id
         AND cp.contest_id = cps.contest_id
        JOIN problems p
          ON p.id = cps.problem_id
        WHERE cps.contest_id = $1
          AND cps.user_id = $2
        ORDER BY cp.problem_index
        `,
        [contestId, userId]
      );

      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch breakdown" });
    }
  }
);


router.get("/users/:userId/contest-stats", async (req, res) => {
  const { userId } = req.params;

  try {
    const { rows } = await db.query(
      `
      SELECT
        user_id,
        contests_participated,
        contests_solved,
        contest_total_submissions,
        contest_successful_submissions,
        contest_acceptance_rate,
        contest_rating,
        contest_global_rank,
        is_banned,
        banned_reason,
        banned_at,
        last_contest_date,
        created_at,
        updated_at
      FROM user_contest_stats
      WHERE user_id = $1
      `,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Contest stats not found for user"
      });
    }

    return res.json(rows[0]);
  } catch (err) {
    console.error("Fetch user contest stats failed:", err);
    return res.status(500).json({
      message: "Failed to fetch contest stats"
    });
  }
});

/**
 * GET user contest rating history
 * GET /api/users/:userId/contest-rating-history
 */
router.get("/users/:userId/contest-rating-history", async (req, res) => {
  const { userId } = req.params;

  try {
    const { rows } = await db.query(
      `
      SELECT
        crh.contest_id,
        crh.rating_before,
        crh.rating_after,
        crh.rating_change,
        crh.final_rank,
        crh.solved_count,
        crh.created_at
      FROM contest_rating_history crh
      WHERE crh.user_id = $1
      ORDER BY crh.created_at ASC
      `,
      [userId]
    );

    return res.json({
      user_id: userId,
      history: rows
    });
  } catch (err) {
    console.error("Fetch contest rating history failed:", err);
    return res.status(500).json({
      message: "Failed to fetch contest rating history"
    });
  }
});

// GET /api/arena-dashboard
router.get("/arena-dashboard", authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const { rows } = await db.query(`
      WITH upcoming AS (
        SELECT c.id, c.name, c.start_time, c.end_time, c.duration_minutes,
               COUNT(cs.user_id) AS participants,
               EXISTS(SELECT 1 FROM contest_scores my_cs WHERE my_cs.contest_id = c.id AND my_cs.user_id = $1) AS is_registered
        FROM contests c
        LEFT JOIN contest_scores cs ON cs.contest_id = c.id
        WHERE c.start_time > NOW()
        GROUP BY c.id
        ORDER BY c.start_time ASC
      ),
      running AS (
        SELECT c.id, c.name, c.start_time, c.end_time, c.duration_minutes,
               COUNT(cs.user_id) AS participants,
               EXISTS(SELECT 1 FROM contest_scores my_cs WHERE my_cs.contest_id = c.id AND my_cs.user_id = $1) AS is_registered
        FROM contests c
        LEFT JOIN contest_scores cs ON cs.contest_id = c.id
        WHERE c.start_time <= NOW() AND c.end_time >= NOW()
        GROUP BY c.id
        ORDER BY c.start_time ASC
      ),
      past AS (
        SELECT c.id, c.name, c.start_time, c.end_time, c.duration_minutes,
               COUNT(cs.user_id) AS participants
        FROM contests c
        LEFT JOIN contest_scores cs ON cs.contest_id = c.id
        WHERE c.end_time < NOW()
        GROUP BY c.id
        ORDER BY c.start_time DESC
        LIMIT 15
      ),
      u_stats AS (
        SELECT * FROM user_contest_stats WHERE user_id = $1
      ),
      r_hist AS (
        SELECT json_agg(row_to_json(t)) AS data FROM (
          SELECT contest_id, rating_before, rating_after, rating_change, final_rank, solved_count, created_at
          FROM contest_rating_history WHERE user_id = $1 ORDER BY created_at ASC
        ) t
      )
      
      SELECT 
        COALESCE((SELECT json_agg(row_to_json(upcoming.*)) FROM upcoming), '[]'::json) AS upcoming,
        COALESCE((SELECT json_agg(row_to_json(running.*)) FROM running), '[]'::json) AS running,
        COALESCE((SELECT json_agg(row_to_json(past.*)) FROM past), '[]'::json) AS past,
        (SELECT row_to_json(u_stats.*) FROM u_stats) AS stats,
        COALESCE((SELECT data FROM r_hist), '[]'::json) AS history;
    `, [userId]);

    res.json(rows[0]);
  } catch (err) {
    console.error("Arena dashboard fetch failed:", err);
    res.status(500).json({ error: "Failed to load arena data" });
  }
});

// GET /api/contests/:contestId/arena
router.get("/contests/:contestId/arena", authMiddleware, async (req, res) => {
  const { contestId } = req.params;
  const userId = req.user.id;

  try {
    const { rows: contestRows } = await db.query(
      `SELECT id, name, start_time, end_time, duration_minutes FROM contests WHERE id = $1`,
      [contestId]
    );
    const contest = contestRows[0];
    
    if (!contest) {
      return res.status(404).json({ error: "Contest not found" });
    }

    const now = new Date();
    const start = toUTC(contest.start_time);
    const end = toUTC(contest.end_time);

    if (now < start) {
      return res.status(403).json({ 
        error: "Contest has not started", 
        code: "UPCOMING" 
      });
    }

    const isEnded = now > end;
    const table = "contest_scores";

    const [problemsRes, leaderboardRes, writersRes] = await Promise.all([
      db.query(`
        SELECT cp.problem_id, cp.problem_index, cp.difficulty, p.title,
          (SELECT COUNT(DISTINCT cps.user_id) 
           FROM contest_problem_status cps
           WHERE cps.contest_id = cp.contest_id 
             AND cps.problem_id = cp.problem_id 
             AND cps.solved = 1) AS solved_count
        FROM contest_problems cp
        JOIN problems p ON p.id = cp.problem_id
        WHERE cp.contest_id = $1
        ORDER BY cp.problem_index
      `, [contestId]),

      db.query(`
        SELECT t.user_id, u.username, t.solved_count, t.penalty,
          (SELECT COALESCE(json_agg(
            json_build_object(
              'problem_id', cps.problem_id, 
              'solved', cps.solved, 
              'wrong_attempts', cps.wrong_attempts, 
              'first_ac_time_minutes', cps.first_ac_time_minutes
            )
          ), '[]'::json)
           FROM contest_problem_status cps
           WHERE cps.contest_id = t.contest_id AND cps.user_id = t.user_id) AS problem_stats
        FROM ${table} t
        JOIN users u ON u.id = t.user_id
        WHERE t.contest_id = $1
        ORDER BY t.solved_count DESC, t.penalty ASC
      `, [contestId]),

    
      db.query(`
        SELECT cw.user_id, u.username, 
               COALESCE(ucs.contest_rating, 1200) AS contest_rating
        FROM contest_writers cw
        JOIN users u ON u.id = cw.user_id
        LEFT JOIN user_contest_stats ucs ON ucs.user_id = cw.user_id
        WHERE cw.contest_id = $1
      `, [contestId])
    ]);

    res.json({
      status: isEnded ? "ended" : "running",
      contest,
      writers: writersRes.rows,
      problems: problemsRes.rows,
      leaderboard: leaderboardRes.rows
    });

  } catch (err) {
    console.error("Arena fetch failed:", err);
    res.status(500).json({ error: "Failed to fetch arena data" });
  }
});
// GET /api/contests/:contestId/submissions/:targetUserId
router.get("/contests/:contestId/submissions/:targetUserId", async (req, res) => {
  const { contestId, targetUserId } = req.params;

  try {
    const { rows } = await db.query(`
      WITH c_info AS (
        SELECT name, end_time FROM contests WHERE id = $1
      ),
      u_info AS (
        SELECT username FROM users WHERE id = $2
      ),
      subs AS (
        SELECT 
          cs.id AS submission_id,
          cs.problem_id,
          cs.submitted_at,
          cp.problem_index,
          p.title AS problem_title,
          cs.language,
          cs.verdict,
          cs.execution_time AS time_ms,
          cs.memory_kb,
	  cs.code
        FROM contest_submissions cs
        JOIN contest_problems cp ON cp.problem_id = cs.problem_id AND cp.contest_id = cs.contest_id
        JOIN problems p ON p.id = cs.problem_id
        WHERE cs.contest_id = $1 AND cs.user_id = $2
        ORDER BY cs.submitted_at DESC
      )
      SELECT 
        (SELECT name FROM c_info) AS contest_name,
        (SELECT end_time FROM c_info) AS end_time,
        (SELECT username FROM u_info) AS username,
        COALESCE((SELECT json_agg(row_to_json(subs.*)) FROM subs), '[]'::json) AS submissions;
    `, [contestId, targetUserId]);

    const data = rows[0];

    // If the contest doesn't exist
    if (!data.contest_name) {
      return res.status(404).json({ error: "Contest or user not found" });
    }

    // Determine if the contest has ended (for frontend caching)
    const now = new Date();
    let endTimeStr = data.end_time;
    if (typeof endTimeStr === "string" && !endTimeStr.includes("Z") && !endTimeStr.includes("+")) {
      endTimeStr = endTimeStr.replace(" ", "T") + "Z";
    }
    const isEnded = now > new Date(endTimeStr);

    res.json({
      contest_name: data.contest_name,
      username: data.username,
      is_ended: isEnded,
      submissions: data.submissions
    });

  } catch (err) {
    console.error("Failed to fetch user submissions:", err);
    res.status(500).json({ error: "Failed to fetch submission history" });
  }
});

export default router;