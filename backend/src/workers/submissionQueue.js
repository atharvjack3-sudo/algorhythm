import fs from "fs/promises";
import path from "path";
import axios from "axios";
import { db } from "../config/db.js";
import { sendToClient } from "../websocket.js";

const LANGUAGE_MAP = {
  cpp: 54,
  java: 62,
  python: 71,
  javascript: 63,
};
const BASE_TIME_LIMIT_SEC = 2.0; 
const BASE_MEMORY_LIMIT_KB = 128 * 1024; // 128 MB

const LIMIT_MULTIPLIERS = {
  cpp:        { time: 1.0, memory: 1.0 },
  java:       { time: 2.0, memory: 4.0 }, 
  python:     { time: 5.0, memory: 2.0 }, 
  javascript: { time: 2.0, memory: 2.0 }, 
};

const queue = [];
let isWorkerRunning = false;

// 20 requests/sec = 1 request every 50ms
const RATE_LIMIT_MS = 50; 
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Core worker function that handles a single submission job
 */
async function processSubmissionJob(job) {
  const { submissionId, problemId, language, code } = job;
  const readConn = await db.connect();
  
  try {
    // 1. Mark as PROCESSING in DB
    await readConn.query(
      `UPDATE submissions SET status = 'PROCESSING' WHERE id = $1`, 
      [submissionId]
    );
    // 3. Fetch test cases
    const { rows: tcRows } = await readConn.query(
      `SELECT * FROM problem_testcases WHERE problem_id = $1 ORDER BY id`,
      [problemId]
    );

    const multipliers = LIMIT_MULTIPLIERS[language] || { time: 2.0, memory: 2.0 };
    const codeBase64 = Buffer.from(code).toString("base64");

    // 4. Read files and build the Judge0 Batch Payload
    const batchSubmissions = await Promise.all(tcRows.map(async (tc, index) => {
      const input = await fs.readFile(path.join(process.cwd(), tc.input_path), "utf-8");
      const expectedOutput = await fs.readFile(path.join(process.cwd(), tc.output_path), "utf-8");
      
      // Append state to the callback URL.
      const callbackUrl = `${process.env.BACKEND_URL}/api/finalize-submission?subId=${submissionId}&index=${index + 1}&isSample=${tc.is_sample}&secret=${process.env.JUDGE0_WEBHOOK_SECRET}`;
      // 2. Notify the frontend via WebSocket
      sendToClient(submissionId, { 
        type: "SUBMISSION_UPDATE", 
        status: "PROCESSING", 
        message: "Running your code on testcases..." 
      });
      return {
        source_code: codeBase64,
        language_id: LANGUAGE_MAP[language],
        stdin: Buffer.from(input).toString("base64"),
        expected_output: Buffer.from(expectedOutput).toString("base64"),
        cpu_time_limit: BASE_TIME_LIMIT_SEC * multipliers.time,
        memory_limit: BASE_MEMORY_LIMIT_KB * multipliers.memory,
        callback_url: callbackUrl
      };
    }));

    // 5. Send Batch to Judge0
    await axios.post(
      `${process.env.JUDGE0_URL_ASYNC}/submissions/batch?base64_encoded=true`,
      { submissions: batchSubmissions },
      { 
        headers: { 
          "X-RapidAPI-Key": process.env.JUDGE0_API_KEY, 
          "X-RapidAPI-Host": process.env.JUDGE0_HOST || "judge0-ce.p.rapidapi.com",
          "Content-Type": "application/json"
        } 
      }
    );

  } catch (err) {
    console.error(`Worker failed for submission ${submissionId}:`, err.message);
    
    // Fallback: If Judge0 API is down or file reading fails, fail gracefully
    await readConn.query(
      `UPDATE submissions SET status = 'COMPLETED', verdict = 'System Error' WHERE id = $1`, 
      [submissionId]
    );
    
    sendToClient(submissionId, { 
      type: "SUBMISSION_RESULT", 
      status: "COMPLETED", 
      verdict: "System Error",
      error: "Our execution environment encountered an issue. Please try again later."
    });
  } finally {
    readConn.release();
  }
}

/**
 * Worker Loop: Continuously polls the in-memory array
 */
export async function startWorker() {
  if (isWorkerRunning) return;
  isWorkerRunning = true;
  console.log("Submission worker loop started...");

  while (true) {
    if (queue.length > 0) {
      const job = queue.shift();
      processSubmissionJob(job).catch((err) => console.error(`Job execution failed for submission ${job.submissionId}:`, err));
      await delay(RATE_LIMIT_MS); // 20 req/sec limit
    } else {
      await delay(500); // Sleep briefly when idle to prevent CPU thrashing
    }
  }
}

/**
 * Expose method to add jobs to the queue from your HTTP route
 */
export function addToQueue(job) {
  queue.push(job);
}