import express from "express";
import axios from "axios";
import fs from "fs/promises";
import path from "path";
import { db } from "../config/db.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { analyzeWithAI } from "../utils/google.js";
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

  const { rows: problemRows } = await conn.query(
  `SELECT is_hidden FROM problems WHERE id = $1`,
  [problemId]
);

if (problemRows.length === 0) {
  return res.status(404).json({ error: "Problem not found" });
}

const problem = problemRows[0];

if (problem.is_hidden) {
  return res.status(404).json({ error: "Problem not found" });
}

  const conn = await db.connect();

  try {
    const { rows: testcases } = await conn.query(
      `SELECT * FROM problem_testcases WHERE problem_id = $1 ORDER BY id`,
      [problemId]
    );

    if (testcases.length === 0) {
      return res.status(400).json({ error: "No testcases found" });
    }

    let finalVerdict = "AC";
    let hiddenFailedIndex = null;
    const sampleResults = [];
    let hiddenCount = 0;
    let finalCO = null;
    let finalErr = null;

    let maxRuntimeMs = 0;
    let maxMemoryKb = 0;
    
    // ENCODE SOURCE CODE
    const codeBase64 = Buffer.from(code).toString("base64");

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
      
      // ENCODE INPUT
      const inputBase64 = Buffer.from(input).toString("base64");

      const judgeRes = await axios.post(
        JUDGE0_URL,
        {
          source_code: codeBase64,
          language_id: LANGUAGE_MAP[language],
          stdin: inputBase64,
          cpu_time_limit: 2,
          memory_limit: 128000,
        },
        {
          headers: {
            "X-RapidAPI-Key": process.env.JUDGE0_API_KEY,
            "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
          },
        }
      );

      const judgeStatus = judgeRes.data.status.description;
      const compileOutputBase64 = judgeRes.data.compile_output || "";
      const stderrBase64 = judgeRes.data.stderr || "";
      const runtimeMs = Math.round(parseFloat(judgeRes.data.time || "0") * 1000);
      const memoryKb = judgeRes.data.memory || 0;

      const compileOutput = compileOutputBase64
  ? Buffer.from(compileOutputBase64, "base64").toString("utf-8")
  : "";

        const stderr = stderrBase64
  ? Buffer.from(stderrBase64, "base64").toString("utf-8")
  : "";

      maxRuntimeMs = Math.max(maxRuntimeMs, runtimeMs);
      maxMemoryKb = Math.max(maxMemoryKb, memoryKb);

      let verdict = mapVerdict(judgeStatus);
      let passed = false;

      if (judgeStatus === "Accepted") {
        // DECODE OUTPUT
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

      if (!tc.is_sample && !passed) {
        finalVerdict = verdict;
        finalCO = compileOutput;
        finalErr = stderr;
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
    await conn.query('BEGIN');

    await conn.query(
      `INSERT INTO submissions (user_id, problem_id, language, verdict, runtime_ms, memory_kb, code) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, problemId, language, finalVerdict, maxRuntimeMs, maxMemoryKb, code]
    );

    await conn.query(
      `UPDATE user_stats SET total_submissions = total_submissions + 1 WHERE user_id = $1`,
      [userId]
    );

    if (finalVerdict === "AC") {
      await conn.query(
        `UPDATE user_stats SET successful_submissions = successful_submissions + 1 WHERE user_id = $1`,
        [userId]
      );
    }

    await conn.query(
      `
      UPDATE user_stats
      SET acceptance_rate = CASE WHEN total_submissions = 0 THEN NULL ELSE (successful_submissions::DECIMAL / total_submissions) * 100 END
      WHERE user_id = $1
      `,
      [userId]
    );

    await conn.query(
      `
      UPDATE problem_stats
      SET total_submissions = total_submissions + 1, total_accepted = total_accepted + $1
      WHERE problem_id = $2
      `,
      [finalVerdict === "AC" ? 1 : 0, problemId]
    );

    await conn.query(
      `
      UPDATE problem_stats
      SET acceptance_rate = CASE WHEN total_submissions = 0 THEN NULL ELSE (total_accepted::DECIMAL / total_submissions) * 100 END
      WHERE problem_id = $1
      `,
      [problemId]
    );

    const { rows: statusRows } = await conn.query(
      `SELECT status FROM user_problem_status WHERE user_id = $1 AND problem_id = $2`,
      [userId, problemId]
    );
    const statusRow = statusRows[0];

    if (finalVerdict === "AC" && (!statusRow || statusRow.status !== "solved")) {
      const { rows: problemRows } = await conn.query(
        `SELECT difficulty FROM problems WHERE id = $1`,
        [problemId]
      );
      const problem = problemRows[0];
      const diffCol = `${problem.difficulty}_solved`;

      await conn.query(
        `UPDATE user_stats SET total_solved = total_solved + 1, ${diffCol} = ${diffCol} + 1 WHERE user_id = $1`,
        [userId]
      );

      await conn.query(
        `
        INSERT INTO user_problem_status (user_id, problem_id, status, solved_at)
        VALUES ($1, $2, 'solved', NOW())
        ON CONFLICT (user_id, problem_id) DO UPDATE SET status = 'solved', solved_at = NOW()
        `,
        [userId, problemId]
      );
    }

    await conn.query(
      `
      UPDATE user_stats u
      SET global_rank = r.new_rank
      FROM (
        SELECT user_id, DENSE_RANK() OVER (ORDER BY total_solved DESC, acceptance_rate DESC NULLS LAST, user_id ASC) AS new_rank
        FROM user_stats
      ) r 
      WHERE r.user_id = u.user_id
      `
    );

    if (finalVerdict === "AC") {
      await conn.query(
        `
        UPDATE user_stats
        SET
          current_streak = CASE WHEN last_active_date = CURRENT_DATE THEN current_streak WHEN last_active_date = CURRENT_DATE - INTERVAL '1 day' THEN current_streak + 1 ELSE 1 END,
          longest_streak = GREATEST(longest_streak, CASE WHEN last_active_date = CURRENT_DATE THEN current_streak WHEN last_active_date = CURRENT_DATE - INTERVAL '1 day' THEN current_streak + 1 ELSE 1 END),
          last_active_date = CURRENT_DATE
        WHERE user_id = $1
        `,
        [userId]
      );
    }

    const { rows: topicRows } = await conn.query(
      `SELECT topic_id FROM problem_topics WHERE problem_id = $1`,
      [problemId]
    );

    const numTopics = topicRows.length;
    const solved = finalVerdict === "AC";

    for (const row of topicRows) {
      const topicId = row.topic_id;

      await conn.query(
        `INSERT INTO user_topic_rating (user_id, topic_id) VALUES ($1, $2) ON CONFLICT (user_id, topic_id) DO NOTHING`,
        [userId, topicId]
      );

      const { rows: utrRows } = await conn.query(
        `SELECT rating, attempts FROM user_topic_rating WHERE user_id = $1 AND topic_id = $2`,
        [userId, topicId]
      );
      const utr = utrRows[0];

      const { rows: probRows } = await conn.query(
        `SELECT difficulty FROM problems WHERE id = $1`,
        [problemId]
      );
      const problem = probRows[0];

      const newRating = updateRating(
        utr.rating, difficultyToRating(problem.difficulty), utr.attempts, solved, numTopics
      );

      await conn.query(
        `
        UPDATE user_topic_rating
        SET rating = $1, attempts = attempts + 1, solves = solves + $2
        WHERE user_id = $3 AND topic_id = $4
        `,
        [newRating, solved ? 1 : 0, userId, topicId]
      );
    }

    await conn.query('COMMIT');

    res.json({
      verdict: finalVerdict,
      samples: sampleResults,
      hidden_failed: hiddenFailedIndex !== null ? `Hidden testcase #${hiddenFailedIndex}` : null,
      error: finalCO || finalErr || null
    });
  } catch (err) {
    await conn.query('ROLLBACK');
    console.error("Judge0 Error:", err.response?.data || err.message);
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
    const { rows } = await db.query(
      `
      SELECT id, verdict, language, submitted_at, code
      FROM submissions
      WHERE user_id = $1 AND problem_id = $2
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
    const { rows: samples } = await db.query(
      `SELECT id, input_path, output_path FROM problem_testcases WHERE problem_id = $1 AND is_sample = 1 ORDER BY id`,
      [problemId]
    );

    if (samples.length === 0) {
      return res.status(400).json({ error: "No sample testcases found" });
    }

    const results = [];
    
    // ENCODE SOURCE CODE
    const codeBase64 = Buffer.from(code).toString("base64");

    for (let i = 0; i < samples.length; i++) {
      const tc = samples[i];

      const input = await fs.readFile(
        path.join(process.cwd(), tc.input_path),
        "utf-8"
      );
      
      // ENCODE INPUT
      const inputBase64 = Buffer.from(input).toString("base64");

      const expected = await fs.readFile(
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

      const status = judgeRes.data.status.description;
      
      // DECODE OUTPUT
      const stdoutBase64 = judgeRes.data.stdout || "";
      const stdout = stdoutBase64 ? Buffer.from(stdoutBase64, "base64").toString("utf-8").trim() : "";
      
      const expectedTrimmed = expected.trim();
      const passed = status === "Accepted" && stdout === expectedTrimmed;

      results.push({
        sample: i + 1,
        verdict: passed ? "AC" : mapVerdict(status),
        output: stdout,
        expected: expectedTrimmed,
      });
    }

    res.json({ samples: results });

  } catch (err) {
    console.error("Judge0 Error:", err.response?.data || err.message);
    res.status(500).json({ error: "Run failed" });
  }
});

router.get("/submissions/analyze/:subId", authMiddleware, async (req, res) => {
  const { subId } = req.params;
  const userId = req.user.id;

  try {
    const { rows: subRows } = await db.query(
      `SELECT id, code FROM submissions WHERE id = $1 AND user_id = $2 AND verdict = 'AC'`,
      [subId, userId]
    );
    const submission = subRows[0];

    if (!submission) {
      return res.status(403).json({ error: "Submission not found or not eligible" });
    }

    const { rows } = await db.query(
      `SELECT time_complexity, space_complexity FROM submission_complexity WHERE submission_id = $1`,
      [subId]
    );

    if (rows.length > 0) return res.json(rows[0]);

    const aiResult = await analyzeWithAI(submission.code);

    await db.query(
      `INSERT INTO submission_complexity (submission_id, time_complexity, space_complexity) VALUES ($1, $2, $3)`,
      [subId, aiResult.time_complexity, aiResult.space_complexity]
    );

    return res.json(aiResult);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to analyze complexity" });
  }
});

export default router;
