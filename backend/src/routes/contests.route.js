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

function mapVerdict(status) {
  switch (status) {
    case "Accepted":
      return "AC";
    case "Wrong Answer":
      return "WA";
    case "Time Limit Exceeded":
      return "TLE";
    case "Memory Limit Exceeded":
      return "MLE";
    case "Compilation Error":
      return "CE";
    default:
      return "RE";
  }
}

/* ============================================================
   GET /api/contests?status=upcoming|running|past
============================================================ */

// POST /api/contests
router.post("/contests", authMiddleware, async (req, res) => {
  const {
    name,
    start_time,
    end_time,
    duration_minutes,
    problems, // array of problem_ids
  } = req.body;

  // ---------- validation ----------
  if (
    !name ||
    !start_time ||
    !end_time ||
    !duration_minutes ||
    !Array.isArray(problems) ||
    problems.length === 0
  ) {
    return res.status(400).json({ error: "Invalid contest data" });
  }

  const start = new Date(start_time);
  const end = new Date(end_time);

  if (start >= end) {
    return res
      .status(400)
      .json({ error: "End time must be after start time" });
  }

  const conn = await db.connect();

  try {
    await conn.query('BEGIN');

    /* ---------- create contest ---------- */
    // Postgres requires RETURNING id to get the inserted row's ID
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

    /* ---------- attach problems ---------- */
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
      String.fromCharCode(65 + i),
      difficulty,
    ]
  );
}

    await conn.query('COMMIT');

    res.json({
      success: true,
      contest_id: contestId,
    });
  } catch (err) {
    await conn.query('ROLLBACK');
    console.error(err);
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

router.get(
  "/contests/problems/:problemId",
  authMiddleware,
  async (req, res) => {
  const { problemId } = req.params;

  if (!problemId || isNaN(problemId)) {
    return res.status(400).json({ error: "Invalid problem ID" });
  }

  try {
    //  Fetch problem core + content + stats
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
        ps.acceptance_rate
      FROM problems p
      JOIN problem_content pc ON pc.problem_id = p.id
      JOIN problem_stats ps ON ps.problem_id = p.id
      WHERE p.id = $1
      `,
      [problemId]
    );

    const problem = problemRows[0];

    if (!problem) {
      return res.status(404).json({ error: "Problem not found" });
    }

    //  Fetch topics
    const { rows: topicRows } = await db.query(
      `
      SELECT t.name
      FROM problem_topics pt
      JOIN topics t ON t.id = pt.topic_id
      WHERE pt.problem_id = $1
      `,
      [problemId]
    );

    const topics = topicRows.map((t) => t.name);

    //  Fetch sample testcases (paths)
    const { rows: sampleRows } = await db.query(
      `
      SELECT input_path, output_path
      FROM problem_testcases
      WHERE problem_id = $1 AND is_sample = 1
      `,
      [problemId]
    );

    //  Read testcase files from disk
    const samples = [];

    for (const tc of sampleRows) {
      const inputPath = path.join(process.cwd(), tc.input_path);
      const outputPath = path.join(process.cwd(), tc.output_path);

      const input = await fs.readFile(inputPath, "utf-8");
      const output = await fs.readFile(outputPath, "utf-8");

      samples.push({ input, output });
    }

    //  Send response
    res.json({
      problem: {
        id: problem.id,
        title: problem.title,
        difficulty: problem.difficulty,
        created_at: problem.created_at,
      },
      content: {
        statement: problem.statement,
        constraints: problem.constraints,
        input_format: problem.input_format,
        output_format: problem.output_format,
        editorial: problem.editorial,
      },
      stats: {
        total_submissions: problem.total_submissions,
        acceptance_rate: problem.acceptance_rate,
      },
      topics,
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

router.get("/contests/:contestId/results", async (req, res) => {
  const { contestId } = req.params;

  try {
    // 1. Fetch contest problems config
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

    // 2. Fetch leaderboard rows with embedded problem status subqueries
    const { rows: leaderboard } = await db.query(
      `
      SELECT
        cr.user_id,
        u.username,
        cr.solved_count,
        cr.penalty,
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
    console.error(err);
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
         Contest validation
      ======================= */
      const { rows: contestRows } = await conn.query(
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

      /* =======================
         Registration check
      ======================= */
      const { rows: registeredRows } = await conn.query(
        `SELECT 1 FROM contest_scores WHERE contest_id = $1 AND user_id = $2`,
        [contestId, userId]
      );
      const registered = registeredRows[0];

      if (!registered) {
        return res.status(403).json({ error: "Not registered for contest" });
      }

      /* =======================
         Problem check
      ======================= */
      const { rows: belongsRows } = await conn.query(
        `SELECT 1 FROM contest_problems WHERE contest_id = $1 AND problem_id = $2`,
        [contestId, problemId]
      );
      const belongs = belongsRows[0];

      if (!belongs) {
        return res.status(400).json({ error: "Problem not part of contest" });
      }

      /* =======================
         Fetch testcases
      ======================= */
      const { rows: testcases } = await conn.query(
        `SELECT * FROM problem_testcases WHERE problem_id = $1 ORDER BY id`,
        [problemId]
      );

      if (testcases.length === 0) {
        return res.status(400).json({ error: "No testcases found" });
      }

      /* =======================
         Judge execution
      ======================= */
      let finalVerdict = "AC";
      let allPassed = true;
      let hiddenFailedIndex = null;
      const sampleResults = [];
      let hiddenCount = 0;
      let maxRuntimeMs = 0;
      let maxMemoryKb = 0;
      const codeBase64 = Buffer.from(code).toString("base64");

      for (let i = 0; i < testcases.length; i++) {
        const tc = testcases[i];

        const input = await fs.readFile(
          path.join(process.cwd(), tc.input_path),
          "utf-8"
        );
        const inputBase64 = Buffer.from(input).toString("base64");

        const expectedOutput = await fs.readFile(
          path.join(process.cwd(), tc.output_path),
          "utf-8"
        );

        const judgeRes = await axios.post(
          JUDGE0_URL,
          {
            source_code: codeBase64,
            language_id: LANGUAGE_MAP[language],
            stdin: inputBase64,
          },
          {
            headers: {
              "X-RapidAPI-Key": process.env.JUDGE0_API_KEY,
              "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
            },
          }
        );

        const judgeStatus = judgeRes.data.status.description;

        const runtimeMs = Math.round(
          parseFloat(judgeRes.data.time || "0") * 1000
        );
        maxRuntimeMs = Math.max(maxRuntimeMs, runtimeMs);
        const memoryKb = judgeRes.data.memory || 0; 
        maxMemoryKb = Math.max(maxMemoryKb, memoryKb);

        let verdict = mapVerdict(judgeStatus);
        let passed = false;

        if (judgeStatus === "Accepted") {
          const stdoutBase64 = judgeRes.data.stdout || "";
          const actual = stdoutBase64 ? Buffer.from(stdoutBase64, "base64").toString("utf-8").trim() : "";
          const expected = expectedOutput.trim();
          passed = actual === expected;
          verdict = passed ? "AC" : "WA";
        }

        if (tc.is_sample) {
          sampleResults.push({
            index: sampleResults.length + 1,
            verdict: passed ? "AC" : verdict,
          });
        } else {
          hiddenCount++;
        }

        if (!passed) {
          allPassed = false;
          finalVerdict = verdict;

          if (!tc.is_sample) {
            hiddenFailedIndex = hiddenCount;
            break; // stop on first hidden failure
          }
        }
      }

      if (allPassed) {
        finalVerdict = "AC";
      }

      /* =======================
         Contest DB updates
      ======================= */
      await conn.query('BEGIN');

      await conn.query(
        `
        INSERT INTO contest_submissions
          (contest_id, user_id, problem_id, verdict, submitted_at, execution_time, language, code, memory_kb)
        VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7, $8)
        `,
        [contestId, userId, problemId, finalVerdict, maxRuntimeMs, language, code, maxMemoryKb]
      );

      const { rows: stateRows } = await conn.query(
        `
        SELECT solved, wrong_attempts
        FROM contest_problem_status
        WHERE contest_id = $1 AND user_id = $2 AND problem_id = $3
        FOR UPDATE
        `,
        [contestId, userId, problemId]
      );
      const state = stateRows[0];

      if (!state) {
        throw new Error("Contest problem state missing");
      }

      if (!state.solved) {
        if (finalVerdict === "AC") {
          const startMs = toUTC(contest.start_time).getTime();
          const minutes = Math.max(
            0,
            Math.floor((Date.now() - startMs) / 60000)
          );

          await conn.query(
            `
            UPDATE contest_problem_status
            SET solved = 1,
                first_ac_time_minutes = $1
            WHERE contest_id = $2 AND user_id = $3 AND problem_id = $4
            `,
            [minutes, contestId, userId, problemId]
          );

          await conn.query(
            `
            UPDATE contest_scores
            SET solved_count = solved_count + 1,
                penalty = penalty + $1 + 5 * $2
            WHERE contest_id = $3 AND user_id = $4
            `,
            [minutes, state.wrong_attempts, contestId, userId]
          );
        } else {
          await conn.query(
            `
            UPDATE contest_problem_status
            SET wrong_attempts = wrong_attempts + 1
            WHERE contest_id = $1 AND user_id = $2 AND problem_id = $3
            `,
            [contestId, userId, problemId]
          );
        }
      }

      await conn.query('COMMIT');

      /* =======================
         Response
      ======================= */
      res.json({
        verdict: finalVerdict,
        samples: sampleResults,
        hidden_failed:
          hiddenFailedIndex !== null
            ? `Hidden testcase #${hiddenFailedIndex}`
            : null,
      });
    } catch (err) {
      await conn.query('ROLLBACK');
      console.error(err);
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

    const [problemsRes, leaderboardRes] = await Promise.all([
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
      `, [contestId])
    ]);

    res.json({
      status: isEnded ? "ended" : "running",
      contest,
      problems: problemsRes.rows,
      leaderboard: leaderboardRes.rows
    });

  } catch (err) {
    console.error("Arena fetch failed:", err);
    res.status(500).json({ error: "Failed to fetch arena data" });
  }
});

export default router;
