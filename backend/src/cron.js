// cron.js
import cron from "node-cron";
import { db } from "./config/db.js";
import { finalizeContest } from "./jobs/contestFinalize.job.js";

cron.schedule("*/5 * * * *", async () => {
  const [contests] = await db.execute(
    `
    SELECT id
    FROM contests
    WHERE end_time < DATE_SUB(NOW(), INTERVAL 2 MINUTE) -- 2 min buffer
      AND id NOT IN (SELECT DISTINCT contest_id FROM contest_results)
    LIMIT 10 -- Process in small batches
    `
  );

  for (const c of contests) {
    await finalizeContest(c.id);
  }
});
