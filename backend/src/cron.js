// cron.js
import cron from "node-cron";
import { db } from "./config/db.js";
import { finalizeContest } from "./jobs/contestFinalize.job.js";

cron.schedule("*/5 * * * *", async () => {
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
    await finalizeContest(c.id);
  }
});