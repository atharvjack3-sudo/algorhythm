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

const BASE_TIME_LIMIT_SEC = 2.0; 
const BASE_MEMORY_LIMIT_KB = 128 * 1024; // 128 MB

// Language-specific scaling factors
const LIMIT_MULTIPLIERS = {
  cpp:        { time: 1.0, memory: 1.0 },
  java:       { time: 2.0, memory: 4.0 }, 
  python:     { time: 5.0, memory: 2.0 }, 
  javascript: { time: 2.0, memory: 2.0 }, 
};

function mapVerdict(description) {
  if (!description) return "WA";
  if (description.includes("Time Limit")) return "TLE";
  if (description.includes("Memory Limit")) return "MLE";
  
  // The OS OOM Killer uses SIGKILL (Exit code 137) when a container breaches memory limits
  if (description.includes("SIGKILL") || description.includes("137")) return "MLE";
  
  if (description.includes("Compilation Error")) return "CE";
  if (description.includes("Runtime Error")) return "RE";
  
  return "WA"; // Default to Wrong Answer for other failures
}

/**
 * POST /api/submissions
 */
// router.post("/submissions", authMiddleware, async (req, res) => {
//   const userId = req.user.id;
//   const { problemId, language, code } = req.body;

//   if (!LANGUAGE_MAP[language] || !code || !problemId) {
//     return res.status(400).json({ error: "Invalid submission data" });
//   }

//   const conn = await db.connect();

//   try {
//     /* =======================
//        Problem & Validation
//     ======================= */
//     const { rows: problemRows } = await conn.query(
//       `SELECT is_hidden FROM problems WHERE id = $1`,
//       [problemId]
//     );

//     if (problemRows.length === 0 || problemRows[0].is_hidden) {
//       return res.status(404).json({ error: "Problem not found" });
//     }

//     const { rows: testcases } = await conn.query(
//       `SELECT * FROM problem_testcases WHERE problem_id = $1 ORDER BY id`,
//       [problemId]
//     );

//     if (testcases.length === 0) {
//       return res.status(400).json({ error: "No testcases found" });
//     }

//     /* =======================
//        Judge0 Execution
//     ======================= */
//     let finalVerdict = "AC";
//     let hiddenFailedIndex = null;
//     const sampleResults = [];
//     let hiddenCount = 0;
    
//     let finalCO = null;
//     let finalErr = null;
//     let maxRuntimeMs = 0;
//     let maxMemoryKb = 0;
    
//     const codeBase64 = Buffer.from(code).toString("base64");

//     // Calculate dynamic limits
//     const multipliers = LIMIT_MULTIPLIERS[language] || { time: 2.0, memory: 2.0 };
//     const timeLimit = BASE_TIME_LIMIT_SEC * multipliers.time;
//     const memoryLimit = BASE_MEMORY_LIMIT_KB * multipliers.memory;

//     for (let i = 0; i < testcases.length; i++) {
//       const tc = testcases[i];

//       const input = await fs.readFile(path.join(process.cwd(), tc.input_path), "utf-8");
//       const expectedOutput = await fs.readFile(path.join(process.cwd(), tc.output_path), "utf-8");

//       const judgeRes = await axios.post(
//         JUDGE0_URL, 
//         {
//           source_code: codeBase64,
//           language_id: LANGUAGE_MAP[language],
//           stdin: Buffer.from(input).toString("base64"),
//           expected_output: Buffer.from(expectedOutput).toString("base64"), // Let Judge0 compare
//           cpu_time_limit: timeLimit,
//           memory_limit: memoryLimit
//         },
//         {
//           headers: {
//             "X-RapidAPI-Key": process.env.JUDGE0_API_KEY,
//             "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
//           }
//         }
//       );

//       const judgeStatus = judgeRes.data.status;
//       const runtimeMs = Math.round(parseFloat(judgeRes.data.time || "0") * 1000);
//       const memoryKb = judgeRes.data.memory || 0;

//       maxRuntimeMs = Math.max(maxRuntimeMs, runtimeMs);
//       maxMemoryKb = Math.max(maxMemoryKb, memoryKb);

//       const isAccepted = judgeStatus.id === 3;
//       const currentVerdict = isAccepted ? "AC" : mapVerdict(judgeStatus.description);

//       if (tc.is_sample) {
//         sampleResults.push({
//           index: sampleResults.length + 1,
//           verdict: currentVerdict,
//         });
//       } else {
//         hiddenCount++;
//       }

//       if (!isAccepted) {
//         finalVerdict = currentVerdict;
        
//         // Extract CE and RE data for the frontend debugger
//         if (judgeRes.data.compile_output) {
//           finalCO = Buffer.from(judgeRes.data.compile_output, "base64").toString("utf-8");
//         }
//         if (judgeRes.data.stderr) {
//           finalErr = Buffer.from(judgeRes.data.stderr, "base64").toString("utf-8");
//         }

//         if (!tc.is_sample) {
//           hiddenFailedIndex = hiddenCount;
//           break; // Stop on first hidden failure
//         }
//       }
//     }

//     /* =======================
//        DB TRANSACTION
//     ======================= */
//     await conn.query('BEGIN');

//     await conn.query(
//       `INSERT INTO submissions (user_id, problem_id, language, verdict, runtime_ms, memory_kb, code) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
//       [userId, problemId, language, finalVerdict, maxRuntimeMs, maxMemoryKb, code]
//     );

//     await conn.query(
//       `UPDATE user_stats SET total_submissions = total_submissions + 1 WHERE user_id = $1`,
//       [userId]
//     );

//     if (finalVerdict === "AC") {
//       await conn.query(
//         `UPDATE user_stats SET successful_submissions = successful_submissions + 1 WHERE user_id = $1`,
//         [userId]
//       );
//     }

//     await conn.query(
//       `
//       UPDATE user_stats
//       SET acceptance_rate = CASE WHEN total_submissions = 0 THEN NULL ELSE (successful_submissions::DECIMAL / total_submissions) * 100 END
//       WHERE user_id = $1
//       `,
//       [userId]
//     );

//     await conn.query(
//       `
//       UPDATE problem_stats
//       SET total_submissions = total_submissions + 1, total_accepted = total_accepted + $1
//       WHERE problem_id = $2
//       `,
//       [finalVerdict === "AC" ? 1 : 0, problemId]
//     );

//     await conn.query(
//       `
//       UPDATE problem_stats
//       SET acceptance_rate = CASE WHEN total_submissions = 0 THEN NULL ELSE (total_accepted::DECIMAL / total_submissions) * 100 END
//       WHERE problem_id = $1
//       `,
//       [problemId]
//     );

//     const { rows: statusRows } = await conn.query(
//       `SELECT status FROM user_problem_status WHERE user_id = $1 AND problem_id = $2`,
//       [userId, problemId]
//     );
//     const statusRow = statusRows[0];

//     if (finalVerdict === "AC" && (!statusRow || statusRow.status !== "solved")) {
//       const { rows: probRows } = await conn.query(
//         `SELECT difficulty FROM problems WHERE id = $1`,
//         [problemId]
//       );
//       const problem = probRows[0];
//       const diffCol = `${problem.difficulty}_solved`;

//       await conn.query(
//         `UPDATE user_stats SET total_solved = total_solved + 1, ${diffCol} = ${diffCol} + 1 WHERE user_id = $1`,
//         [userId]
//       );

//       await conn.query(
//         `
//         INSERT INTO user_problem_status (user_id, problem_id, status, solved_at)
//         VALUES ($1, $2, 'solved', NOW())
//         ON CONFLICT (user_id, problem_id) DO UPDATE SET status = 'solved', solved_at = NOW()
//         `,
//         [userId, problemId]
//       );
//     }

//     // Streak Calculation
//     if (finalVerdict === "AC") {
//       await conn.query(
//         `
//         UPDATE user_stats
//         SET
//           current_streak = CASE WHEN last_active_date = CURRENT_DATE THEN current_streak WHEN last_active_date = CURRENT_DATE - INTERVAL '1 day' THEN current_streak + 1 ELSE 1 END,
//           longest_streak = GREATEST(longest_streak, CASE WHEN last_active_date = CURRENT_DATE THEN current_streak WHEN last_active_date = CURRENT_DATE - INTERVAL '1 day' THEN current_streak + 1 ELSE 1 END),
//           last_active_date = CURRENT_DATE
//         WHERE user_id = $1
//         `,
//         [userId]
//       );
//     }

//     // Topic Ratings Update
//     const { rows: topicRows } = await conn.query(
//       `SELECT topic_id FROM problem_topics WHERE problem_id = $1`,
//       [problemId]
//     );

//     const numTopics = topicRows.length;
//     const solved = finalVerdict === "AC";

//     for (const row of topicRows) {
//       const topicId = row.topic_id;

//       await conn.query(
//         `INSERT INTO user_topic_rating (user_id, topic_id) VALUES ($1, $2) ON CONFLICT (user_id, topic_id) DO NOTHING`,
//         [userId, topicId]
//       );

//       const { rows: utrRows } = await conn.query(
//         `SELECT rating, attempts FROM user_topic_rating WHERE user_id = $1 AND topic_id = $2`,
//         [userId, topicId]
//       );
//       const utr = utrRows[0];

//       const { rows: pRows } = await conn.query(
//         `SELECT difficulty FROM problems WHERE id = $1`,
//         [problemId]
//       );
//       const probData = pRows[0];

//       const newRating = updateRating(
//         utr.rating, difficultyToRating(probData.difficulty), utr.attempts, solved, numTopics
//       );

//       await conn.query(
//         `
//         UPDATE user_topic_rating
//         SET rating = $1, attempts = attempts + 1, solves = solves + $2
//         WHERE user_id = $3 AND topic_id = $4
//         `,
//         [newRating, solved ? 1 : 0, userId, topicId]
//       );
//     }

//     await conn.query('COMMIT');

//     res.json({
//       verdict: finalVerdict,
//       samples: sampleResults,
//       hidden_failed: hiddenFailedIndex !== null ? `Hidden testcase #${hiddenFailedIndex}` : null,
//       error: finalCO || finalErr || null
//     });

//   } catch (err) {
//     await conn.query('ROLLBACK');
//     console.error("Judge0/DB Error:", err.message);
//     res.status(500).json({ error: "Submission failed" });
//   } finally {
//     conn.release();
//   }
// });

router.post("/submissions", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { problemId, language, code } = req.body;

  if (!LANGUAGE_MAP[language] || !code || !problemId) {
    return res.status(400).json({ error: "Invalid submission data" });
  }

  let problemDifficulty;
  let testcases = [];

  /* =======================
      DB Read
  ======================= */
  const readConn = await db.connect();
  try {
    const { rows: problemRows } = await readConn.query(
      `SELECT is_hidden, difficulty FROM problems WHERE id = $1`,
      [problemId]
    );

    if (problemRows.length === 0 || problemRows[0].is_hidden) {
      return res.status(404).json({ error: "Problem not found" });
    }

    problemDifficulty = problemRows[0].difficulty;

    const { rows: tcRows } = await readConn.query(
      `SELECT * FROM problem_testcases WHERE problem_id = $1 ORDER BY id`,
      [problemId]
    );

    if (tcRows.length === 0) {
      return res.status(400).json({ error: "No testcases found" });
    }

    testcases = tcRows;
  } catch (err) {
    console.error("DB Read Error:", err.message);
    return res.status(500).json({ error: "Database error during validation" });
  } finally {
    readConn.release(); 
  }

  /* =======================
     Judge0 Execution
  ======================= */
  const codeBase64 = Buffer.from(code).toString("base64");
  const multipliers = LIMIT_MULTIPLIERS[language] || { time: 2.0, memory: 2.0 };
  const timeLimit = BASE_TIME_LIMIT_SEC * multipliers.time;
  const memoryLimit = BASE_MEMORY_LIMIT_KB * multipliers.memory;

  let finalVerdict = "AC";
  let hiddenFailedIndex = null;
  const sampleResults = [];
  
  let finalCO = null;
  let finalErr = null;
  let maxRuntimeMs = 0;
  let maxMemoryKb = 0;

  try {
    
    const fileReadPromises = testcases.map(async (tc) => {
      const [input, expectedOutput] = await Promise.all([
        fs.readFile(path.join(process.cwd(), tc.input_path), "utf-8"),
        fs.readFile(path.join(process.cwd(), tc.output_path), "utf-8")
      ]);
      return { tc, input, expectedOutput };
    });
    
    const loadedTestcases = await Promise.all(fileReadPromises);

    const sampleTestcases = loadedTestcases.filter(item => item.tc.is_sample);
    const hiddenTestcases = loadedTestcases.filter(item => !item.tc.is_sample);

    for (const { tc, input, expectedOutput } of sampleTestcases) {
      const judgeRes = await axios.post(
        JUDGE0_URL,
        {
          source_code: codeBase64,
          language_id: LANGUAGE_MAP[language],
          stdin: Buffer.from(input).toString("base64"),
          expected_output: Buffer.from(expectedOutput).toString("base64"),
          cpu_time_limit: timeLimit,
          memory_limit: memoryLimit
        },
        { headers: { "X-RapidAPI-Key": process.env.JUDGE0_API_KEY, "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com" } }
      );

      const data = judgeRes.data;
      const runtimeMs = Math.round(parseFloat(data.time || "0") * 1000);
      const memoryKb = data.memory || 0;

      maxRuntimeMs = Math.max(maxRuntimeMs, runtimeMs);
      maxMemoryKb = Math.max(maxMemoryKb, memoryKb);

      const isAccepted = data.status.id === 3;
      const currentVerdict = isAccepted ? "AC" : mapVerdict(data.status.description);

      sampleResults.push({ index: sampleResults.length + 1, verdict: currentVerdict });

      // Track the first failure
      if (!isAccepted && finalVerdict === "AC") {
        finalVerdict = currentVerdict;
        hiddenFailedIndex = -(sampleResults.length); 
        
        if (data.compile_output) finalCO = Buffer.from(data.compile_output, "base64").toString("utf-8");
        if (data.stderr) finalErr = Buffer.from(data.stderr, "base64").toString("utf-8");
      }
    }

    // 2. Sequentially execute hidden cases 
    if (finalVerdict === "AC") {
      let hiddenCount = 0;
      for (const { tc, input, expectedOutput } of hiddenTestcases) {
        hiddenCount++;
        const judgeRes = await axios.post(
          JUDGE0_URL,
          {
            source_code: codeBase64,
            language_id: LANGUAGE_MAP[language],
            stdin: Buffer.from(input).toString("base64"),
            expected_output: Buffer.from(expectedOutput).toString("base64"),
            cpu_time_limit: timeLimit,
            memory_limit: memoryLimit
          },
          { headers: { "X-RapidAPI-Key": process.env.JUDGE0_API_KEY, "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com" } }
        );

        const data = judgeRes.data;
        const runtimeMs = Math.round(parseFloat(data.time || "0") * 1000);
        const memoryKb = data.memory || 0;

        maxRuntimeMs = Math.max(maxRuntimeMs, runtimeMs);
        maxMemoryKb = Math.max(maxMemoryKb, memoryKb);

        if (data.status.id !== 3) {
          finalVerdict = mapVerdict(data.status.description);
          hiddenFailedIndex = hiddenCount; 
          
          if (data.compile_output) finalCO = Buffer.from(data.compile_output, "base64").toString("utf-8");
          if (data.stderr) finalErr = Buffer.from(data.stderr, "base64").toString("utf-8");
          break; // Stop execution on first hidden failure
        }
      }
    }

    /* =======================
       DB Job
    ======================= */
    const isAC = finalVerdict === "AC";
    const acInt = isAC ? 1 : 0;
    
    const writeConn = await db.connect();
    try {
      await writeConn.query('BEGIN');

      // Insert Submission
      await writeConn.query(
        `INSERT INTO submissions (user_id, problem_id, language, verdict, runtime_ms, memory_kb, code) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, problemId, language, finalVerdict, maxRuntimeMs, maxMemoryKb, code]
      );

      // User Stats Update
      await writeConn.query(
        `
        UPDATE user_stats 
        SET 
          total_submissions = total_submissions + 1,
          successful_submissions = successful_submissions + $1,
          acceptance_rate = CASE WHEN total_submissions + 1 = 0 THEN NULL ELSE ((successful_submissions + $1)::DECIMAL / (total_submissions + 1)) * 100 END,
          current_streak = CASE WHEN $1 = 1 THEN (CASE WHEN last_active_date = CURRENT_DATE THEN current_streak WHEN last_active_date = CURRENT_DATE - INTERVAL '1 day' THEN current_streak + 1 ELSE 1 END) ELSE current_streak END,
          longest_streak = CASE WHEN $1 = 1 THEN GREATEST(longest_streak, CASE WHEN last_active_date = CURRENT_DATE THEN current_streak WHEN last_active_date = CURRENT_DATE - INTERVAL '1 day' THEN current_streak + 1 ELSE 1 END) ELSE longest_streak END,
          last_active_date = CASE WHEN $1 = 1 THEN CURRENT_DATE ELSE last_active_date END
        WHERE user_id = $2
        `,
        [acInt, userId]
      );

      // Problem Stats Update
      await writeConn.query(
        `
        UPDATE problem_stats
        SET 
          total_submissions = total_submissions + 1, 
          total_accepted = total_accepted + $1,
          acceptance_rate = CASE WHEN total_submissions + 1 = 0 THEN NULL ELSE ((total_accepted + $1)::DECIMAL / (total_submissions + 1)) * 100 END
        WHERE problem_id = $2
        `,
        [acInt, problemId]
      );

      if (isAC) {
        const { rows: statusRows } = await writeConn.query(
          `SELECT status FROM user_problem_status WHERE user_id = $1 AND problem_id = $2`,
          [userId, problemId]
        );
        
        if (!statusRows[0] || statusRows[0].status !== "solved") {
          const diffCol = `${problemDifficulty}_solved`; 
          await writeConn.query(`UPDATE user_stats SET total_solved = total_solved + 1, ${diffCol} = ${diffCol} + 1 WHERE user_id = $1`, [userId]);
          await writeConn.query(
            `INSERT INTO user_problem_status (user_id, problem_id, status, solved_at) VALUES ($1, $2, 'solved', NOW()) ON CONFLICT (user_id, problem_id) DO UPDATE SET status = 'solved', solved_at = NOW()`,
            [userId, problemId]
          );
        }
      }

      // Topic Updates
      const { rows: topicRows } = await writeConn.query(
        `SELECT topic_id FROM problem_topics WHERE problem_id = $1`,
        [problemId]
      );

      if (topicRows.length > 0) {
        const topicIds = topicRows.map(r => r.topic_id);
        const numTopics = topicIds.length;

        // Insert new topics to ensure they exist
        await writeConn.query(
          `INSERT INTO user_topic_rating (user_id, topic_id) 
           SELECT $1, unnest($2::int[]) 
           ON CONFLICT (user_id, topic_id) DO NOTHING`,
          [userId, topicIds]
        );

        // Fetch current ratings
        const { rows: utrRows } = await writeConn.query(
          `SELECT topic_id, rating, attempts FROM user_topic_rating WHERE user_id = $1 AND topic_id = ANY($2::int[])`,
          [userId, topicIds]
        );

        // Compute new ratings
        const updates = utrRows.map(utr => {
          const newRating = updateRating(utr.rating, difficultyToRating(problemDifficulty), utr.attempts, isAC, numTopics);
          return `(${userId}, ${utr.topic_id}, ${newRating}, 1, ${acInt})`;
        });

        // Update all topics
        if (updates.length > 0) {
          const valuesStr = updates.join(', ');
          await writeConn.query(`
            UPDATE user_topic_rating as t
            SET rating = v.rating, attempts = t.attempts + v.attempts_inc, solves = t.solves + v.solves_inc
            FROM (VALUES ${valuesStr}) AS v(user_id, topic_id, rating, attempts_inc, solves_inc)
            WHERE t.user_id = v.user_id AND t.topic_id = v.topic_id
          `);
        }
      }

      await writeConn.query('COMMIT');
    } catch (dbErr) {
      await writeConn.query('ROLLBACK');
      console.error("DB Sync Error:", dbErr.message);
      if (!res.headersSent) {
        return res.status(500).json({ error: "Failed to record submission statistics." });
      }
    } finally {
      writeConn.release();
    }

    /* =======================
       Client Response
    ======================= */
    if (!res.headersSent) {
      let hiddenFailedMessage = null;
      if (finalVerdict !== "AC" && hiddenFailedIndex !== null) {
        hiddenFailedMessage = hiddenFailedIndex < 0 
          ? `Failed on Pretest #${Math.abs(hiddenFailedIndex)}` 
          : `Hidden testcase #${hiddenFailedIndex}`;
      }

      res.json({
        verdict: finalVerdict,
        samples: sampleResults,
        hidden_failed: hiddenFailedMessage,
        error: finalCO || finalErr || null
      });
    }

  } catch (err) {
    console.error("Judge0 Execution Error:", err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: "Execution environment failed" });
    }
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

    const conn = await db.connect();

  const { rows: problemRows } = await conn.query(
  `SELECT is_hidden FROM problems WHERE id = $1`,
  [problemId]
);

if (problemRows.length === 0) {
  conn.release();
  return res.status(404).json({ error: "Problem not found" });
}

const problem = problemRows[0];

if (problem.is_hidden) {
  conn.release();
  return res.status(404).json({ error: "Problem not found" });
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
  } finally {
    conn.release();
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
