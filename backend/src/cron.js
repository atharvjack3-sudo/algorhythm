// cron.js
import cron from "node-cron";
import { db } from "./config/db.js";
import { finalizeContest } from "./jobs/contestFinalize.job.js";
import potdData from "./cache/potdCache.js";
// Separate execution locks
let isContestRunning = false;
let isRankRunning = false;

// ==========================================
// 1. Contest Finalization (Runs at 12:00 AM / Midnight)
// ==========================================
cron.schedule("0 0 * * *", async () => {
  if (isContestRunning) {
    console.log("Skipping contest cron: previous execution still in progress");
    return;
  }

  isContestRunning = true;

  try {
    console.log(`[${new Date().toISOString()}] CRON: Starting daily contest finalization...`);
    
    // Removed LIMIT 10 so it processes ALL un-finalized contests for the day at once
    const { rows: contests } = await db.query(
      `
      SELECT id
      FROM contests
      WHERE end_time < NOW() - INTERVAL '2 minutes'
        AND id NOT IN (SELECT DISTINCT contest_id FROM contest_results)
      `
    );

    for (const c of contests) {
      try {
        await finalizeContest(c.id);
        console.log(`Successfully finalized contest ${c.id}`);
      } catch (err) {
        console.error(`Failed to finalize contest ${c.id}`, err);
      }
    }
    
    console.log(`[${new Date().toISOString()}] CRON: Contest finalization complete.`);
  } catch (err) {
    console.error("Contest cron job failed", err);
  } finally {
    isContestRunning = false;
  }
});

// ==========================================
// 2. Global Rank Update (Runs at 1:00 AM)
// ==========================================
cron.schedule("0 1 * * *", async () => {
  if (isRankRunning) {
    console.log("Skipping rank cron: previous execution still in progress");
    return;
  }

  isRankRunning = true;

  try {
    console.log(`[${new Date().toISOString()}] CRON: Starting global rank calculation...`);
    
    await db.query('BEGIN');

    const result = await db.query(`
      UPDATE user_stats u
      SET global_rank = r.new_rank
      FROM (
        SELECT 
          user_id, 
          DENSE_RANK() OVER (
            ORDER BY total_solved DESC, acceptance_rate DESC NULLS LAST, user_id ASC
          ) AS new_rank
        FROM user_stats
      ) r 
      WHERE r.user_id = u.user_id
    `);

    await db.query('COMMIT');
    console.log(`[${new Date().toISOString()}] CRON: Successfully updated ranks for ${result.rowCount} users.`);
    
  } catch (err) {
    await db.query('ROLLBACK');
    console.error("Rank cron job failed", err);
  } finally {
    isRankRunning = false;
  }
});

let isPotdRunning = false;

cron.schedule("0 0 * * *", async () => {
  if (isPotdRunning) {
    console.log("Skipping POTD cron: previous execution still in progress");
    return;
  }

  isPotdRunning = true;

  try {
    console.log(`[${new Date().toISOString()}] CRON: Selecting POTD...`);

    const problemId = Math.floor(Math.random() * 17) + 1;

    const { rows } = await db.query(
      `
      INSERT INTO potd (date, problem_id)
      VALUES (CURRENT_DATE, $1)
      ON CONFLICT (date)
      DO UPDATE
      SET problem_id = EXCLUDED.problem_id
      RETURNING id, problem_id;
      `,
      [problemId]
    );

    potdData.set(rows[0]);

    console.log(
      `[${new Date().toISOString()}] CRON: Today's POTD is problem ${rows[0].problem_id}`
    );
  } catch (err) {
    console.error("POTD cron failed", err);
  } finally {
    isPotdRunning = false;
  }
});

// ==========================================
// 4. Stale Submissions Cleanup (Runs every 6 hours)
// ==========================================
cron.schedule("0 */6 * * *", async () => {
  if (isCleanupRunning) {
    console.log("Skipping cleanup cron: previous execution still in progress");
    return;
  }

  isCleanupRunning = true;

  try {
    console.log(`[${new Date().toISOString()}] CRON: Starting stale submissions cleanup...`);
    
    await db.query('BEGIN');
    const result = await db.query(`
      WITH stale_subs AS (
        SELECT id 
        FROM submissions
        WHERE submitted_at < NOW() - INTERVAL '1 hour'
          AND status IN ('PENDING', 'PROCESSING')
      ),
      deleted_state AS (
        DELETE FROM submission_execution_state
        WHERE submission_id IN (SELECT id FROM stale_subs)
      )
      DELETE FROM submissions
      WHERE id IN (SELECT id FROM stale_subs)
    `);

    await db.query('COMMIT');
    console.log(`[${new Date().toISOString()}] CRON: Successfully deleted ${result.rowCount} stale submissions.`);
    
  } catch (err) {
    await db.query('ROLLBACK');
    console.error("Cleanup cron job failed", err);
  } finally {
    isCleanupRunning = false;
  }
});