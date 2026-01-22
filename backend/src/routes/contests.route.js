import express from "express";
import axios from "axios";
import fs from "fs/promises";
import path from "path";
import { db } from "../config/db.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();


async function assertContestRunning(conn, contestId) {
  const [[contest]] = await conn.execute(
    `SELECT start_time, end_time FROM contests WHERE id = ?`,
    [contestId]
  );

  if (!contest) {
    const err = new Error("Contest not found");
    err.status = 404;
    throw err;
  }

  const now = new Date();
  if (now < contest.start_time) {
    const err = new Error("Contest not started");
    err.status = 403;
    throw err;
  }

  if (now > contest.end_time) {
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

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    /* ---------- create contest ---------- */
    const [contestResult] = await conn.execute(
      `
      INSERT INTO contests
        (name, start_time, end_time, duration_minutes)
      VALUES (?, ?, ?, ?)
      `,
      [name, start, end, duration_minutes]
    );

    const contestId = contestResult.insertId;

    /* ---------- attach problems ---------- */
    for (let i = 0; i < problems.length; i++) {
      await conn.execute(
        `
        INSERT INTO contest_problems
          (contest_id, problem_id, problem_index)
        VALUES (?, ?, ?)
        `,
        [
          contestId,
          problems[i],
          String.fromCharCode(65 + i), // A, B, C...
        ]
      );
    }

    await conn.commit();

    res.json({
      success: true,
      contest_id: contestId,
    });
  } catch (err) {
    await conn.rollback();
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
    const [rows] = await db.execute(
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
    const [[contest]] = await db.execute(
      `SELECT * FROM contests WHERE id = ?`,
      [contestId]
    );

    if (!contest) {
      return res.status(404).json({ error: "Contest not found" });
    }

    const [problems] = await db.execute(
      `
      SELECT problem_id, problem_index, difficulty
      FROM contest_problems
      WHERE contest_id = ?
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
  "/contests/:contestId/submissions",
  authMiddleware,
  async (req, res) => {
    const userId = req.user.id;
    const { contestId } = req.params;

    try {
      const [rows] = await db.execute(
        `
        SELECT
          problem_id,
          verdict,
          submitted_at,
          execution_time
        FROM contest_submissions
        WHERE contest_id = ? AND user_id = ?
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
   // console.log("hi");
    const userId = req.user.id;
    const { contestId } = req.params;

    try {
      //  Contest check
      const [[contest]] = await db.execute(
        `SELECT start_time, end_time FROM contests WHERE id = ?`,
        [contestId]
      );

      if (!contest) {
        return res.status(404).json({ error: "Contest not found" });
      }

      const now = new Date();
      const start = new Date(contest.start_time);
      const end   = new Date(contest.end_time);
      
        
      if (now < start || now > end) {
        
        return res.status(403).json({ error: "Contest not active" });
      }

      const [[registered]] = await db.execute(
        `
        SELECT 1
        FROM contest_scores
        WHERE contest_id = ? AND user_id = ?
        `,
        [contestId, userId]
      );

      if (!registered) {
        return res.status(403).json({ error: "Not registered" });
      }

      //  Fetch problems
      const [rows] = await db.execute(
        `
        SELECT problem_id, problem_index, difficulty
        FROM contest_problems
        WHERE contest_id = ?
        ORDER BY problem_index
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


router.get(
  "/contests/:contestId/results",
  async (req, res) => {
    const { contestId } = req.params;

    try {
      //  Contest existence
      const [[contest]] = await db.execute(
        `SELECT start_time, end_time FROM contests WHERE id = ?`,
        [contestId]
      );

      if (!contest) {
        return res.status(404).json({ error: "Contest not found" });
      }

      const now = new Date();
      const end = new Date(contest.end_time);

      //  only AFTER contest ends
      if (now <= end) {
        return res.status(403).json({
          error: "Results not available yet",
        });
      }

      //  Fetch problems (public after end)
      const [problems] = await db.execute(
  `
  SELECT
    p.id        AS problem_id,
    cp.problem_index,
    p.title,
    p.difficulty
  FROM contest_problems cp
  JOIN problems p ON p.id = cp.problem_id
  WHERE cp.contest_id = ?
  ORDER BY cp.problem_index
  `,
  [contestId]
);


      //  Fetch final leaderboard ONLY from contest_results
      const [leaderboard] = await db.execute(
        `
        SELECT
  u.id AS user_id,
  u.username,
  cr.solved_count,
  cr.penalty
FROM contest_results cr
JOIN users u ON u.id = cr.user_id
WHERE cr.contest_id = ?
ORDER BY cr.solved_count DESC, cr.penalty ASC

        `,
        [contestId]
      );

      res.json({
        contestId,
        problems,
        leaderboard,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch contest results" });
    }
  }
);




/* ============================================================
   POST /api/contests/:contestId/register
============================================================ */
router.post(
  "/contests/:contestId/register",
  authMiddleware,
  async (req, res) => {
    const userId = req.user.id;
    const { contestId } = req.params;

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      await conn.execute(
        `
        INSERT IGNORE INTO contest_scores (contest_id, user_id)
        VALUES (?, ?)
        `,
        [contestId, userId]
      );

      await conn.execute(
        `
        INSERT IGNORE INTO contest_problem_status
        (contest_id, user_id, problem_id)
        SELECT ?, ?, problem_id
        FROM contest_problems
        WHERE contest_id = ?
        `,
        [contestId, userId, contestId]
      );

      await conn.commit();
      res.json({ success: true });
    } catch (err) {
      await conn.rollback();
      console.error(err);
      res.status(500).json({ error: "Contest registration failed" });
    } finally {
      conn.release();
    }
  }
);

/* ============================================================
   GET /api/contests/:contestId/leaderboard
============================================================ */
router.get("/contests/:contestId/leaderboard", async (req, res) => {
  const { contestId } = req.params;

  const [[contest]] = await db.execute(
    `SELECT end_time FROM contests WHERE id = ?`,
    [contestId]
  );

  const now = new Date();

  const table =
    contest && now > contest.end_time
      ? "contest_results"
      : "contest_scores";

  const [rows] = await db.execute(
    `
    SELECT user_id, solved_count, penalty
    FROM ${table}
    WHERE contest_id = ?
    ORDER BY solved_count DESC, penalty ASC
    `,
    [contestId]
  );

  res.json(rows);
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

    const conn = await db.getConnection();

    try {
      /* =======================
          Contest validation
      ======================= */
      const [[contest]] = await conn.execute(
        `SELECT start_time, end_time FROM contests WHERE id = ?`,
        [contestId]
      );

      if (!contest) {
        return res.status(404).json({ error: "Contest not found" });
      }

      const now = new Date();
      const start = new Date(contest.start_time);
      const end   = new Date(contest.end_time);
      if (now < start || now > end) {
        return res.status(403).json({ error: "Contest not active" });
      }

      /* =======================
          Registration check
      ======================= */
      const [[registered]] = await conn.execute(
        `SELECT 1 FROM contest_scores WHERE contest_id = ? AND user_id = ?`,
        [contestId, userId]
      );

      if (!registered) {
        return res.status(403).json({ error: "Not registered for contest" });
      }

      /* =======================
          Problem check
      ======================= */
      const [[belongs]] = await conn.execute(
        `SELECT 1 FROM contest_problems WHERE contest_id = ? AND problem_id = ?`,
        [contestId, problemId]
      );

      if (!belongs) {
        return res.status(400).json({ error: "Problem not part of contest" });
      }

      /* =======================
          Fetch testcases
      ======================= */
      const [testcases] = await conn.execute(
        `SELECT * FROM problem_testcases WHERE problem_id = ? ORDER BY id`,
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

      for (let i = 0; i < testcases.length; i++) {
        const tc = testcases[i];

        const input = await fs.readFile(
          path.join(process.cwd(), tc.input_path),
          "utf-8"
        );

        const expectedOutput = await fs.readFile(
          path.join(process.cwd(), tc.output_path),
          "utf-8"
        );

        const judgeRes = await axios.post(
          JUDGE0_URL,
          {
            source_code: code,
            language_id: LANGUAGE_MAP[language],
            stdin: input,
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

        let verdict = mapVerdict(judgeStatus);
        let passed = false;

        if (judgeStatus === "Accepted") {
          const actual = (judgeRes.data.stdout || "").trim();
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
      await conn.beginTransaction();

      await conn.execute(
        `
        INSERT INTO contest_submissions
          (contest_id, user_id, problem_id, verdict, submitted_at, execution_time)
        VALUES (?, ?, ?, ?, NOW(), ?)
        `,
        [contestId, userId, problemId, finalVerdict, maxRuntimeMs]
      );

      const [[state]] = await conn.execute(
        `
        SELECT solved, wrong_attempts
        FROM contest_problem_status
        WHERE contest_id = ? AND user_id = ? AND problem_id = ?
        FOR UPDATE
        `,
        [contestId, userId, problemId]
      );

      if (!state) {
        throw new Error("Contest problem state missing");
      }

      if (!state.solved) {
        if (finalVerdict === "AC") {
          const startMs = new Date(contest.start_time).getTime();
          const minutes = Math.max(
            0,
            Math.floor((Date.now() - startMs) / 60000)
          );

          await conn.execute(
            `
            UPDATE contest_problem_status
            SET solved = 1,
                first_ac_time_minutes = ?
            WHERE contest_id = ? AND user_id = ? AND problem_id = ?
            `,
            [minutes, contestId, userId, problemId]
          );

          await conn.execute(
            `
            UPDATE contest_scores
            SET solved_count = solved_count + 1,
                penalty = penalty + ? + 5 * ?
            WHERE contest_id = ? AND user_id = ?
            `,
            [minutes, state.wrong_attempts, contestId, userId]
          );
        } else {
          await conn.execute(
            `
            UPDATE contest_problem_status
            SET wrong_attempts = wrong_attempts + 1
            WHERE contest_id = ? AND user_id = ? AND problem_id = ?
            `,
            [contestId, userId, problemId]
          );
        }
      }

      await conn.commit();

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
      await conn.rollback();
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
      const [[row]] = await db.execute(
        `
        SELECT 1
        FROM contest_scores
        WHERE contest_id = ? AND user_id = ?
        `,
        [contestId, userId]
      );

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
      const [[contest]] = await db.execute(
        `SELECT end_time FROM contests WHERE id = ?`,
        [contestId]
      );

      if (!contest) {
        return res.status(404).json({ error: "Contest not found" });
      }

      if (new Date() <= new Date(contest.end_time)) {
        return res.status(403).json({ error: "Results not available yet" });
      }

      //  User must be in final results
      const [[ranked]] = await db.execute(
        `
        SELECT 1
        FROM contest_results
        WHERE contest_id = ? AND user_id = ?
        `,
        [contestId, userId]
      );

      if (!ranked) {
        return res.status(404).json({ error: "User not ranked" });
      }

      //  Problem-wise breakdown
      const [rows] = await db.execute(
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
        WHERE cps.contest_id = ?
          AND cps.user_id = ?
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
    const [rows] = await db.execute(
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
      WHERE user_id = ?
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
    const [rows] = await db.execute(
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
      WHERE crh.user_id = ?
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



export default router;
