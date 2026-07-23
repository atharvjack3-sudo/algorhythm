import dotenv from "dotenv";
dotenv.config();
import app from "./app.js";
import http from "http";
import { WebSocketServer } from "ws";
import potdData from "./cache/potdCache.js";
import { db } from "./config/db.js";
import { setupWSConnection } from "y-websocket/bin/utils"; 
import url from "url";
import { startWorker, addToQueue } from "./workers/submissionQueue.js";
import { initializeSubmissionWS } from "./websocket.js"; 

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// 1. Create two DETACHED WebSocket servers
const wssCollab = new WebSocketServer({ noServer: true });
const wssSubmission = new WebSocketServer({ noServer: true });

// 2. Setup y-websocket on the Collab instance
wssCollab.on("connection", (conn, req) => {
  setupWSConnection(conn, req);
});

// 3. Setup Submission tracking on the Submission instance
initializeSubmissionWS(wssSubmission);

// 4. Route traffic based on the URL path
server.on("upgrade", (request, socket, head) => {
  const pathname = url.parse(request.url).pathname;

  // If the URL path is for submissions (e.g., ws://localhost:5000/submission?submissionId=123)
  if (pathname.startsWith("/submission")) {
    wssSubmission.handleUpgrade(request, socket, head, (ws) => {
      wssSubmission.emit("connection", ws, request);
    });
  } 
  // Otherwise, route everything else to y-websocket (e.g., ws://localhost:5000/room-id)
  else {
    wssCollab.handleUpgrade(request, socket, head, (ws) => {
      wssCollab.emit("connection", ws, request);
    });
  }
});

// ==========================================
// Startup Recovery Routine
// ==========================================
async function recoverPendingSubmissions() {
  const conn = await db.connect();
  try {
    await conn.query('BEGIN');

    // Fetch submissions that were interrupted by a server restart/crash
    const { rows: stuckSubs } = await conn.query(`
      SELECT s.id as "submissionId", s.user_id as "userId", s.problem_id as "problemId", 
             s.language, s.code, p.difficulty 
      FROM submissions s
      JOIN problems p ON s.problem_id = p.id
      WHERE s.status IN ('PENDING', 'PROCESSING')
    `);

    if (stuckSubs.length > 0) {
      console.log(`[Recovery] Found ${stuckSubs.length} interrupted submissions. Resetting and requeuing...`);

      const stuckIds = stuckSubs.map(s => s.submissionId);

      // Reset main submission table stats to 0/PENDING
      await conn.query(`
        UPDATE submissions 
        SET status = 'PENDING', verdict = 'PENDING', runtime_ms = 0, memory_kb = 0
        WHERE id = ANY($1::int[])
      `, [stuckIds]);

      // Reset execution tracking table to 0 cases completed
      await conn.query(`
        UPDATE submission_execution_state 
        SET completed_cases = 0, failed_index = NULL
        WHERE submission_id = ANY($1::int[])
      `, [stuckIds]);

      // Requeue the extracted payload format exactly as expected by your worker
      for (const sub of stuckSubs) {
        addToQueue(sub);
      }
    } else {
      console.log("[Recovery] System clean. No stuck submissions found.");
    }

    await conn.query('COMMIT');
  } catch (err) {
    await conn.query('ROLLBACK');
    console.error("[Recovery Error] Failed to recover submissions:", err);
  } finally {
    conn.release();
  }
}

async function startServer() {
  // 1. Fetch POTD
  try {
    const potd = await db.query("SELECT id, problem_id FROM potd WHERE date = CURRENT_DATE");
    if (potd.rows.length > 0) {
      potdData.set(potd.rows[0]);
    }
  } catch (err) {
    console.error("Failed to fetch POTD on startup:", err.message);
  }

  // 2. Recover interrupted submissions before starting the worker
  await recoverPendingSubmissions();

  // 3. Start Background Worker Loop
  startWorker();
  
  // 4. Start HTTP & WS Server
  server.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
  });
}

startServer();