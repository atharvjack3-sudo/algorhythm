import express from "express";
import axios from "axios";
import fs from "fs/promises";
import path from "path";
import { db } from "../config/db.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { analyzeWithAI } from "../utils/google.js";
import { updateRating } from "../utils/helper.js";
import potdData from "../cache/potdCache.js";
import { addToQueue } from "../workers/submissionQueue.js";
import { sendToClient, disconnectClient } from "../websocket.js";
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



router.post("/custom-run", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { language, code, testcases } = req.body;
  if (!LANGUAGE_MAP[language] || !code) {
    return res.status(400).json({ error: "Invalid submission data" });
  }
  if (testcases.length === 0 || testcases.length > 3) {
      return res.status(400).json({ error: "Incorrect testcase count" });
  }

  for (let i = 0; i < testcases.length; i++) testcases[i] = testcases[i].trim();
  
  try {
    const codeBase64 = Buffer.from(code).toString("base64");
    const multipliers = LIMIT_MULTIPLIERS[language] || { time: 2.0, memory: 2.0 };
    const timeLimit = BASE_TIME_LIMIT_SEC * multipliers.time;
    const memoryLimit = BASE_MEMORY_LIMIT_KB * multipliers.memory;
    let result = [];

    for (let i = 0; i < testcases.length; i++) {
      let finalCO = null;
      let finalErr = null;
      const tc = Buffer.from(testcases[i]).toString("base64").trim();
      const judgeRes = await axios.post(
        JUDGE0_URL,
        {
          source_code: codeBase64,
          language_id: LANGUAGE_MAP[language],
          stdin: tc,
          cpu_time_limit: timeLimit,
          memory_limit: memoryLimit
        },
        { headers: { "X-RapidAPI-Key": process.env.JUDGE0_API_KEY, "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com" } }
      );

      const obj = judgeRes.data;
      const time = Math.round(parseFloat(obj.time || "0") * 1000);
      const mem = obj.memory || 0;
      const stdoutBase64 = judgeRes.data.stdout || "";
      const stdout = stdoutBase64 ? Buffer.from(stdoutBase64, "base64").toString("utf-8").trim() : "";
      const ran_correctly = obj.status.id === 3;
      if (!ran_correctly) {
        if (obj.compile_output) {
          finalCO = Buffer.from(judgeRes.data.compile_output, "base64").toString("utf-8");
        }
        if (obj.stderr) {
          finalErr = Buffer.from(judgeRes.data.stderr, "base64").toString("utf-8");
        }
      }
      const verdict = ran_correctly ? "AC" : mapVerdict(obj.status.description);

      result.push({
        output: stdout,
        verdict: verdict,
        time: time,
        memory: mem,
        error: finalCO || finalErr || null,
      });
    }

    res.status(200).json({ results: result });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/async-submission", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { problemId, language, code } = req.body;

  // 1. Basic Input Validation
  if (!LANGUAGE_MAP[language] || !code || !problemId) {
    return res.status(400).json({ error: "Invalid submission data" });
  }

  const conn = await db.connect(); // Renamed to 'conn' since it handles both reads and writes
  let inTransaction = false;

  try {
    // 2. Validate Problem (Read-only, no transaction needed)
    const { rows: problemRows } = await conn.query(
      `SELECT is_hidden, difficulty FROM problems WHERE id = $1`,
      [problemId]
    );

    if (problemRows.length === 0 || problemRows[0].is_hidden) {
      return res.status(404).json({ error: "Problem not found" });
    }

    // 3. Get Testcase Count (Read-only, no transaction needed)
    const { rows: tcRows } = await conn.query(
      `SELECT COUNT(*) as count FROM problem_testcases WHERE problem_id = $1`,
      [problemId]
    );
    
    const totalCases = parseInt(tcRows[0].count, 10);
    if (totalCases === 0) {
      return res.status(400).json({ error: "No testcases found for this problem" });
    }

    // ==========================================
    //  START WRITE TRANSACTION
    // ==========================================
    await conn.query('BEGIN');
    inTransaction = true;

    // 4. Create PENDING submission in the core table
    const { rows: subRows } = await conn.query(
      `INSERT INTO submissions 
        (user_id, problem_id, language, code, status, verdict, runtime_ms, memory_kb) 
       VALUES ($1, $2, $3, $4, 'PENDING', 'PENDING', 0, 0) 
       RETURNING id`,
      [userId, problemId, language, code]
    );
    
    const submissionId = subRows[0].id;

    // 5. Initialize Execution State in the separate tracking table
    await conn.query(
      `INSERT INTO submission_execution_state 
        (submission_id, total_cases, completed_cases)
       VALUES ($1, $2, 0)`,
      [submissionId, totalCases]
    );

    await conn.query('COMMIT');
    inTransaction = false;
    // ==========================================
    //  END WRITE TRANSACTION
    // ==========================================

    // 6. Add job to the in-memory queue
    addToQueue({ 
      submissionId, 
      userId, 
      problemId, 
      language, 
      code, 
      difficulty: problemRows[0].difficulty 
    });

    // 7. Respond to Client immediately
    res.status(202).json({ 
      message: "Submission queued successfully", 
      submissionId 
    });

  } catch (err) {
    if (inTransaction) {
      await conn.query('ROLLBACK');
    }
    console.error("Submit Route Error:", err.message);
    res.status(500).json({ error: "Internal server error while queueing submission" });
  } finally {
    conn.release();
  }
});

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

        if (problemId == potdData.get().problem_id) await writeConn.query("INSERT INTO user_potd_stats (user_id, potd_id) VALUES($1, $2) ON CONFLICT (user_id, potd_id) DO NOTHING", [userId, potdData.get().id]);
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

router.put("/finalize-submission", async (req, res) => {
  const { subId, index, isSample, secret } = req.query;
  const data = req.body;

  // 1. Security Check
  if (secret !== process.env.JUDGE0_WEBHOOK_SECRET) {
    return res.status(403).send("Forbidden");
  }

  // 2. Acknowledge Receipt Immediately
  res.status(200).send("OK");

  const runtimeMs = Math.round(parseFloat(data.time || "0") * 1000);
  const memoryKb = data.memory || 0;
  const isAccepted = data.status.id === 3;
  const currentVerdict = isAccepted ? "AC" : mapVerdict(data.status.description);

  let currentErrorMsg = null;
  if (!isAccepted && (data.compile_output || data.stderr || data.message)) {
    const rawError = data.compile_output || data.stderr || data.message;
    currentErrorMsg = Buffer.from(rawError, "base64").toString("utf-8");
  }

  const writeConn = await db.connect();
  try {
    await writeConn.query("BEGIN");

    // 3. Atomic Row Lock
    const { rows } = await writeConn.query(
      `SELECT s.id, s.user_id, s.problem_id, s.verdict, s.runtime_ms, s.memory_kb, s.status,
              p.difficulty,
              st.total_cases, st.completed_cases, st.failed_index
       FROM submissions s
       JOIN submission_execution_state st ON s.id = st.submission_id
       JOIN problems p ON s.problem_id = p.id
       WHERE s.id = $1 
       FOR UPDATE OF s, st`, 
      [subId]
    );

    if (rows.length === 0) {
      throw new Error(`Submission ${subId} not found.`);
    }

    const sub = rows[0];
    if (sub.status === "COMPLETED") {
      await writeConn.query("ROLLBACK");
      return; 
    }

    // 4. Aggregate Results
    let newVerdict = sub.verdict; // Starts as 'PENDING'
    let newFailedIndex = sub.failed_index;

    // Track the FIRST failure we encounter
    if (!isAccepted && sub.verdict === "PENDING") {
      newVerdict = currentVerdict;
      newFailedIndex = isSample === "true" ? -parseInt(index, 10) : parseInt(index, 10);
    }

    const newRuntime = Math.max(sub.runtime_ms || 0, runtimeMs);
    const newMemory = Math.max(sub.memory_kb || 0, memoryKb);
    const newCompleted = sub.completed_cases + 1;
    const isCompleted = newCompleted >= sub.total_cases;
    
    // If we've completed all cases and still haven't failed, it's finally AC
    if (isCompleted && newVerdict === "PENDING") {
      newVerdict = "AC";
    }

    const newStatus = isCompleted ? "COMPLETED" : sub.status;

    // 5. Update Core Submissions Table
    await writeConn.query(
      `UPDATE submissions 
       SET verdict = $1, runtime_ms = $2, memory_kb = $3, status = $4
       WHERE id = $5`,
      [newVerdict, newRuntime, newMemory, newStatus, subId]
    );

    // 6. Update Execution State Table
    await writeConn.query(
      `UPDATE submission_execution_state
       SET completed_cases = $1, failed_index = $2
       WHERE submission_id = $3`,
      [newCompleted, newFailedIndex, subId]
    );

    // 7. Finalize Statistics IF this was the last testcase
    if (isCompleted) {
      await finalizeStatistics(writeConn, sub.user_id, sub.problem_id, sub.difficulty, newVerdict);

      let hiddenFailedMessage = null;
      if (newVerdict !== "AC" && newFailedIndex !== null) {
        hiddenFailedMessage = newFailedIndex < 0
          ? `Failed on Pretest #${Math.abs(newFailedIndex)}`
          : `Failed on Hidden testcase #${newFailedIndex}`;
      }

      // 8. WebSocket Notification
      sendToClient(subId, {
        type: "SUBMISSION_RESULT",
        verdict: newVerdict,
        hidden_failed: hiddenFailedMessage,
        error: currentErrorMsg || null, 
      });

      setTimeout(() => {
        disconnectClient(subId);
      }, 500);
    }

    await writeConn.query("COMMIT");
  } catch (err) {
    await writeConn.query("ROLLBACK");
    console.error(`Webhook error for submission ${subId}:`, err.message);
  } finally {
    writeConn.release();
  }
});

// ==========================================
// Statistics Finalizer
// ==========================================
async function finalizeStatistics(writeConn, userId, problemId, difficulty, finalVerdict) {
  const isAC = finalVerdict === "AC";
  const acInt = isAC ? 1 : 0;

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
      // Safeguard: Ensure column string is perfectly lowercase (e.g., 'easy_solved')
      const diffCol = `${difficulty?.toLowerCase()}_solved`; 
      await writeConn.query(`UPDATE user_stats SET total_solved = total_solved + 1, ${diffCol} = ${diffCol} + 1 WHERE user_id = $1`, [userId]);
      
      await writeConn.query(
        `INSERT INTO user_problem_status (user_id, problem_id, status, solved_at) VALUES ($1, $2, 'solved', NOW()) ON CONFLICT (user_id, problem_id) DO UPDATE SET status = 'solved', solved_at = NOW()`,
        [userId, problemId]
      );
    }

    const currentPotd = potdData.get();
    if (currentPotd && problemId == currentPotd.problem_id) {
      await writeConn.query(
        "INSERT INTO user_potd_stats (user_id, potd_id) VALUES($1, $2) ON CONFLICT (user_id, potd_id) DO NOTHING", 
        [userId, currentPotd.id]
      );
    }
  }

  const { rows: topicRows } = await writeConn.query(
    `SELECT topic_id FROM problem_topics WHERE problem_id = $1`,
    [problemId]
  );

  if (topicRows.length > 0) {
    const topicIds = topicRows.map(r => r.topic_id);
    const numTopics = topicIds.length;

    await writeConn.query(
      `INSERT INTO user_topic_rating (user_id, topic_id) 
       SELECT $1, unnest($2::int[]) 
       ON CONFLICT (user_id, topic_id) DO NOTHING`,
      [userId, topicIds]
    );

    const { rows: utrRows } = await writeConn.query(
      `SELECT topic_id, rating, attempts FROM user_topic_rating WHERE user_id = $1 AND topic_id = ANY($2::int[])`,
      [userId, topicIds]
    );

    const updates = utrRows.map(utr => {
      // Passes utr.rating seamlessly to the null-safe inline function
      const newRating = updateRating(utr.rating, difficultyToRating(difficulty), utr.attempts, isAC, numTopics);
      return `(${userId}, ${utr.topic_id}, ${newRating}, 1, ${acInt})`;
    });

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
}
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
    
    const codeBase64 = Buffer.from(code).toString("base64");
    const multipliers = LIMIT_MULTIPLIERS[language] || { time: 2.0, memory: 2.0 };
    const timeLimit = BASE_TIME_LIMIT_SEC * multipliers.time;
    const memoryLimit = BASE_MEMORY_LIMIT_KB * multipliers.memory;

    for (let i = 0; i < samples.length; i++) {
      const tc = samples[i];

      const input = await fs.readFile(
        path.join(process.cwd(), tc.input_path),
        "utf-8"
      );
      const inputBase64 = Buffer.from(input).toString("base64");

      const expected = await fs.readFile(
        path.join(process.cwd(), tc.output_path),
        "utf-8"
      );
      const expectedBase64 = Buffer.from(expected).toString("base64");

      const judgeRes = await axios.post(
        JUDGE0_URL,
        {
          source_code: codeBase64,
          language_id: LANGUAGE_MAP[language],
          stdin: inputBase64,
          expected_output: expectedBase64,
          cpu_time_limit: timeLimit,     
          memory_limit: memoryLimit
        },
        {
          headers: {
            "X-RapidAPI-Key": process.env.JUDGE0_API_KEY,
            "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
          },
        }
      );

      const obj = judgeRes.data;
      const statusId = obj.status.id;
      const time = Math.round(parseFloat(obj.time || "0") * 1000);
      const mem = obj.memory || 0;
      const verdict = statusId === 3 ? "AC" : mapVerdict(obj.status.description);
      const stdoutBase64 = obj.stdout || "";
      const stdout = stdoutBase64 ? Buffer.from(stdoutBase64, "base64").toString("utf-8").trim() : "";
      const expectedTrimmed = expected.trim();

      let finalCO = null;
      let finalErr = null;
      if (statusId !== 3 && statusId !== 4) { 
        if (obj.compile_output) {
          finalCO = Buffer.from(obj.compile_output, "base64").toString("utf-8");
        }
        if (obj.stderr) {
          finalErr = Buffer.from(obj.stderr, "base64").toString("utf-8");
        }
      }

      results.push({
        sample: i + 1,
        verdict: verdict,
        time: time,
        memory: mem,
        output: stdout,
        expected: expectedTrimmed,
        error: finalCO || finalErr || null,
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
