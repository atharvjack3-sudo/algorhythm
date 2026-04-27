// cron.js
import cron from "node-cron";
import { db } from "./config/db.js";
import { finalizeContest } from "./jobs/contestFinalize.job.js";

let isRunning = false;

cron.schedule("*/20 * * * *", async () => {
  if (isRunning) {
    console.log("Skipping cron run: previous execution still in progress");
    return;
  }

  isRunning = true;

  try {
    const { rows: contests } = await db.query(
      `
      SELECT id
      FROM contests
      WHERE end_time < NOW() - INTERVAL '2 minutes' -- 2 min buffer
        AND id NOT IN (SELECT DISTINCT contest_id FROM contest_results)
      LIMIT 10 -- Process in small batches
      `
    );

    for (const c of contests) {
      try {
        await finalizeContest(c.id);
      } catch (err) {
        console.error(`Failed to finalize contest ${c.id}`, err);
      }
    }
  } catch (err) {
    console.error("Cron job failed", err);
  } finally {
    isRunning = false;
  }
});
