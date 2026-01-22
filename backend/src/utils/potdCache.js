// cache/potdCache.js

let cachedPotdDate = null;     // YYYY-MM-DD (UTC)
let cachedProblemId = null;   // BIGINT

export async function getTodayPOTD(db) {
  // Always use UTC date
  const today = new Date().toISOString().slice(0, 10);

  // Cache hit
  if (cachedPotdDate === today && cachedProblemId !== null) {
    return cachedProblemId;
  }

  // Cache miss -->> DB fetch
  const [rows] = await db.execute(
    `
    SELECT problem_id
    FROM daily_problems
    WHERE potd_date = CURDATE()
    LIMIT 1
    `
  );

  cachedPotdDate = today;
  cachedProblemId = rows.length ? rows[0].problem_id : null;

  return cachedProblemId;
}
