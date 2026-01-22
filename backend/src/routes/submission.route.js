import express from "express";
import axios from "axios";
import fs from "fs/promises";
import path from "path";
import { db } from "../config/db.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { analyzeWithAI } from "../utils/google.js";
// import { getTodayPOTD } from "../utils/potdCache.js";
import { updateRating } from "../utils/helper.js";

const router = express.Router();
const JUDGE0_URL = process.env.JUDGE0_URL;

const LANGUAGE_MAP = {
  cpp: 54,
  java: 62,
  python: 71,
  javascript: 63,
};

function difficultyToRating(difficulty) {
  switch (difficulty) {
    case "easy":
      return 800;
    case "medium":
      return 1000;
    case "hard":
      return 1200;
    default:
      return 1000; // safe fallback
  }
}


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

/**
 * POST /api/submissions
 */
router.post("/submissions", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { problemId, language, code } = req.body;

  if (!LANGUAGE_MAP[language] || !code || !problemId) {
    return res.status(400).json({ error: "Invalid submission data" });
  }

  const conn = await db.getConnection();

  try {
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

    let finalVerdict = "AC";
    let hiddenFailedIndex = null;
    const sampleResults = [];
    let hiddenCount = 0;

    /* =======================
        Judge execution
    ======================= */
    let maxRuntimeMs = 0;
    let maxMemoryKb = 0;

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
          cpu_time_limit: 2,
          memory_limit: 128000,
        },
        // {
        //   headers: {
        //     "Content-Type": "application/json",
        //   }
        // },
        {
          headers: {
            "X-RapidAPI-Key": process.env.JUDGE0_API_KEY,
            "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
          },
        }
      );

      const judgeStatus = judgeRes.data.status.description;
      // Runtime (seconds → ms)
      const runtimeMs = Math.round(
        parseFloat(judgeRes.data.time || "0") * 1000
      );

      // Memory (already in KB)
      const memoryKb = judgeRes.data.memory || 0;

      // Track worst case
      maxRuntimeMs = Math.max(maxRuntimeMs, runtimeMs);
      maxMemoryKb = Math.max(maxMemoryKb, memoryKb);

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

      if (!tc.is_sample && !passed) {
        finalVerdict = verdict;
        hiddenFailedIndex = hiddenCount;
        break;
      }

      if (tc.is_sample && !passed) {
        finalVerdict = verdict;
      }
    }

    /* =======================
        DB TRANSACTION
    ======================= */
    await conn.beginTransaction();

    /* ---- submissions table ---- */
    await conn.execute(
      `INSERT INTO submissions (user_id, problem_id, language, verdict, runtime_ms, memory_kb, code) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        problemId,
        language,
        finalVerdict,
        maxRuntimeMs,
        maxMemoryKb,
        code
      ]
    );


    /* ---- user_stats: total submissions (ALWAYS) ---- */
    await conn.execute(
      `
      UPDATE user_stats
      SET total_submissions = total_submissions + 1
      WHERE user_id = ?
      `,
      [userId]
    );

    /* ---- user_stats: successful submissions (ONLY AC) ---- */
    if (finalVerdict === "AC") {
      await conn.execute(
        `
        UPDATE user_stats
        SET successful_submissions = successful_submissions + 1
        WHERE user_id = ?
        `,
        [userId]
      );
    }

    /* ---- user_stats: acceptance rate ---- */
    await conn.execute(
      `
      UPDATE user_stats
      SET acceptance_rate =
        CASE
          WHEN total_submissions = 0 THEN NULL
          ELSE (successful_submissions / total_submissions) * 100
        END
      WHERE user_id = ?
      `,
      [userId]
    );

    /* ---- problem_stats ---- */
    await conn.execute(
      `
      UPDATE problem_stats
      SET total_submissions = total_submissions + 1,
          total_accepted = total_accepted + ?
      WHERE problem_id = ?
      `,
      [finalVerdict === "AC" ? 1 : 0, problemId]
    );

    await conn.execute(
      `
      UPDATE problem_stats
      SET acceptance_rate =
        CASE
          WHEN total_submissions = 0 THEN NULL
          ELSE (total_accepted / total_submissions) * 100
        END
      WHERE problem_id = ?
      `,
      [problemId]
    );

    /* ---- unique solve logic ---- */
    const [[statusRow]] = await conn.execute(
      `
      SELECT status FROM user_problem_status
      WHERE user_id = ? AND problem_id = ?
      `,
      [userId, problemId]
    );

    if (finalVerdict === "AC" && (!statusRow || statusRow.status !== "solved")) {
      const [[problem]] = await conn.execute(
        `SELECT difficulty FROM problems WHERE id = ?`,
        [problemId]
      );

      const diffCol = `${problem.difficulty}_solved`;

      await conn.execute(
        `
        UPDATE user_stats
        SET total_solved = total_solved + 1,
            ${diffCol} = ${diffCol} + 1
        WHERE user_id = ?
        `,
        [userId]
      );

      await conn.execute(
        `
        INSERT INTO user_problem_status
        (user_id, problem_id, status, solved_at)
        VALUES (?, ?, 'solved', NOW())
        ON DUPLICATE KEY UPDATE status = 'solved', solved_at = NOW()
        `,
        [userId, problemId]
      );
    }
    await conn.query(`CALL recompute_global_ranks()`);
//  Streak update: any AC maintains streak
if (finalVerdict === "AC") {
 // console.log("adding details");
  await conn.execute(
    `
    UPDATE user_stats
    SET
      current_streak =
        CASE
          WHEN last_active_date = CURDATE() THEN current_streak
          WHEN last_active_date = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
            THEN current_streak + 1
          ELSE 1
        END,
      longest_streak =
        GREATEST(
          longest_streak,
          CASE
            WHEN last_active_date = CURDATE() THEN current_streak
            WHEN last_active_date = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
              THEN current_streak + 1
            ELSE 1
          END
        ),
      last_active_date = CURDATE()
    WHERE user_id = ?
    `,
    [userId]
  );
}

/* =======================
   TOPIC ELO UPDATE
======================= */

const [topicRows] = await conn.execute(
  `SELECT topic_id FROM problem_topics WHERE problem_id = ?`,
  [problemId]
);

const numTopics = topicRows.length;
const solved = finalVerdict === "AC";

for (const row of topicRows) {
  const topicId = row.topic_id;

  // Lazy insert
  await conn.execute(
    `
    INSERT INTO user_topic_rating (user_id, topic_id)
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE user_id = user_id
    `,
    [userId, topicId]
  );

  // Fetch current state
  const [[utr]] = await conn.execute(
    `
    SELECT rating, attempts
    FROM user_topic_rating
    WHERE user_id = ? AND topic_id = ?
    `,
    [userId, topicId]
  );
  const [[problem]] = await conn.execute(
        `SELECT difficulty FROM problems WHERE id = ?`,
        [problemId]
      );
  const newRating = updateRating(
    utr.rating,
    difficultyToRating(problem.difficulty),
    utr.attempts,
    solved,
    numTopics
  );

  // Persist update
  await conn.execute(
    `
    UPDATE user_topic_rating
    SET
      rating = ?,
      attempts = attempts + 1,
      solves = solves + ?
    WHERE user_id = ? AND topic_id = ?
    `,
    [newRating, solved ? 1 : 0, userId, topicId]
  );
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
    res.status(500).json({ error: "Submission failed" });
  } finally {
    conn.release();
  }
});


/**
 * GET /api/submissions/:problemId
 */
router.get("/submissions/:problemId", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { problemId } = req.params;

  try {
    const [rows] = await db.execute(
      `
      SELECT id, verdict, language, submitted_at, code
      FROM submissions
      WHERE user_id = ? AND problem_id = ?
      ORDER BY submitted_at DESC
      `,
      [userId, problemId]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

router.post("/run", authMiddleware, async (req, res) => {
  const { problemId, language, code } = req.body;

  if (!LANGUAGE_MAP[language] || !code || !problemId) {
    return res.status(400).json({ error: "Invalid run data" });
  }

  try {
    //  Fetch sample testcases ONLY
    const [samples] = await db.execute(
      `
      SELECT id, input_path, output_path
      FROM problem_testcases
      WHERE problem_id = ? AND is_sample = 1
      ORDER BY id
      `,
      [problemId]
    );

    if (samples.length === 0) {
      return res.status(400).json({ error: "No sample testcases found" });
    }

    const results = [];

    //  Run each sample testcase
    for (let i = 0; i < samples.length; i++) {
      const tc = samples[i];

      const input = await fs.readFile(
        path.join(process.cwd(), tc.input_path),
        "utf-8"
      );

      const expected = await fs.readFile(
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

      const status = judgeRes.data.status.description;
      const stdout = (judgeRes.data.stdout || "").trim();
      const expectedTrimmed = expected.trim();

      const passed =
        status === "Accepted" && stdout === expectedTrimmed;

      results.push({
        sample: i + 1,
        verdict: passed ? "AC" : mapVerdict(status),
        output: stdout,
        expected: expectedTrimmed,
      });
    }

    //  Send results (NO DB WRITE)
    res.json({ samples: results });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Run failed" });
  }
});

router.get("/submissions/analyze/:subId", authMiddleware, async (req, res) => {
  const { subId } = req.params;
  const userId = req.user.id;

  try {
    //  Validate submission
    const [[submission]] = await db.execute(
      `
      SELECT id, code
      FROM submissions
      WHERE id = ? AND user_id = ? AND verdict = 'AC'
      `,
      [subId, userId]
    );

    if (!submission) {
      return res.status(403).json({
        error: "Submission not found or not eligible"
      });
    }

    //  Check cache
    const [rows] = await db.execute(
      `
      SELECT time_complexity, space_complexity
      FROM submission_complexity
      WHERE submission_id = ?
      `,
      [subId]
    );

    if (rows.length > 0) {
      return res.json(rows[0]);
    }

    //  Call Gemini
    const aiResult = await analyzeWithAI(submission.code);

    //  Cache result
    await db.execute(
      `
      INSERT INTO submission_complexity
        (submission_id, time_complexity, space_complexity)
      VALUES (?, ?, ?)
      `,
      [
        subId,
        aiResult.time_complexity,
        aiResult.space_complexity
      ]
    );

    return res.json(aiResult);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to analyze complexity" });
  }
});



export default router;
