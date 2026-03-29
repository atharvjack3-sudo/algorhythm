import { db } from "../config/db.js";

function calculateRating({ rating, avgRating, rank, participants, K = 800 }) {
  if (participants <= 10) return rating; // unrated contest

  const expectedRank =
    1 +
    (participants - 1) /
      (1 + Math.pow(10, (rating - avgRating) / 400));

  let delta = (K * (expectedRank - rank)) / participants;

  delta = Math.max(-150, Math.min(150, Math.round(delta)));

  return Math.max(800, rating + delta);
}

export async function finalizeContest(contestId) {
  // pg uses .connect() instead of .getConnection()
  const conn = await db.connect();

  try {
    // pg syntax for transactions
    await conn.query('BEGIN');

    /* Prevent double finalization */
    const { rows: existing } = await conn.query(
      `SELECT 1 FROM contest_results WHERE contest_id = $1 LIMIT 1`,
      [contestId]
    );

    if (existing.length > 0) {
      await conn.query('ROLLBACK');
      return;
    }

    /* Aggregate submissions → contest_scores */
    // Postgres uses UPDATE ... FROM instead of UPDATE ... JOIN
    await conn.query(
      `
      UPDATE contest_scores cs
      SET
        total_submissions = agg.total_submissions,
        successful_submissions = agg.successful_submissions
      FROM (
        SELECT
          contest_id,
          user_id,
          COUNT(*) AS total_submissions,
          SUM(CASE WHEN verdict = 'AC' THEN 1 ELSE 0 END) AS successful_submissions
        FROM contest_submissions
        WHERE contest_id = $1
        GROUP BY contest_id, user_id
      ) agg
      WHERE agg.contest_id = cs.contest_id
        AND agg.user_id = cs.user_id
      `,
      [contestId]
    );

    /* Freeze final leaderboard */
    await conn.query(
      `
      INSERT INTO contest_results
        (contest_id, user_id, final_rank, solved_count, penalty)
      SELECT
        contest_id,
        user_id,
        DENSE_RANK() OVER (ORDER BY solved_count DESC, penalty ASC),
        solved_count,
        penalty
      FROM contest_scores
      WHERE contest_id = $1
      `,
      [contestId]
    );

    /* Fetch finalized contest stats */
    const { rows: scores } = await conn.query(
      `
      SELECT
        cs.user_id,
        cs.solved_count,
        cs.total_submissions,
        cs.successful_submissions,
        cr.final_rank
      FROM contest_scores cs
      JOIN contest_results cr
        ON cr.contest_id = cs.contest_id
       AND cr.user_id = cs.user_id
      WHERE cs.contest_id = $1
      `,
      [contestId]
    );

    const participants = scores.length;

    /* Aggregate lifetime contest stats */
    for (const row of scores) {
      const {
        user_id,
        solved_count,
        total_submissions,
        successful_submissions
      } = row;

      // Postgres uses ON CONFLICT DO UPDATE SET instead of ON DUPLICATE KEY UPDATE
      // and EXCLUDED instead of VALUES()
      await conn.query(
        `
        INSERT INTO user_contest_stats (
          user_id,
          contests_participated,
          contests_solved,
          contest_total_submissions,
          contest_successful_submissions,
          contest_acceptance_rate,
          last_contest_date
        )
        VALUES ($1, 1, $2, $3, $4, $5, CURRENT_DATE)
        ON CONFLICT (user_id) DO UPDATE SET
          contests_participated = user_contest_stats.contests_participated + 1,
          contests_solved = user_contest_stats.contests_solved + EXCLUDED.contests_solved,
          contest_total_submissions =
            user_contest_stats.contest_total_submissions + EXCLUDED.contest_total_submissions,
          contest_successful_submissions =
            user_contest_stats.contest_successful_submissions + EXCLUDED.contest_successful_submissions,
          contest_acceptance_rate =
            CASE 
              WHEN user_contest_stats.contest_total_submissions + EXCLUDED.contest_total_submissions = 0 THEN 0
              ELSE (user_contest_stats.contest_successful_submissions + EXCLUDED.contest_successful_submissions)::DECIMAL /
                   (user_contest_stats.contest_total_submissions + EXCLUDED.contest_total_submissions) * 100
            END,
          last_contest_date = CURRENT_DATE
        `,
        [
          user_id,
          solved_count,
          total_submissions,
          successful_submissions,
          total_submissions === 0
            ? 0
            : (successful_submissions / total_submissions) * 100
        ]
      );
    }

    /* Rating calculation */
    const { rows: ratings } = await conn.query(
      `
      SELECT user_id, contest_rating
      FROM user_contest_stats
      WHERE user_id IN (
        SELECT user_id FROM contest_scores WHERE contest_id = $1
      )
      `,
      [contestId]
    );

    const ratingMap = new Map(
      ratings.map(r => [r.user_id, r.contest_rating])
    );

    const avgRating =
      ratings.length === 0
        ? 1200
        : ratings.reduce((s, r) => s + r.contest_rating, 0) / ratings.length;

    for (const row of scores) {
      const { user_id, final_rank, solved_count } = row;

      const ratingBefore = ratingMap.get(user_id) ?? 1200;
      const ratingAfter = calculateRating({
        rating: ratingBefore,
        avgRating,
        rank: final_rank,
        participants
      });

      await conn.query(
        `UPDATE user_contest_stats SET contest_rating = $1 WHERE user_id = $2`,
        [ratingAfter, user_id]
      );

      // Postgres uses ON CONFLICT DO NOTHING instead of INSERT IGNORE
      await conn.query(
        `
        INSERT INTO contest_rating_history
          (user_id, contest_id, rating_before, rating_after, rating_change, final_rank, solved_count)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (user_id, contest_id) DO NOTHING
        `,
        [
          user_id,
          contestId,
          ratingBefore,
          ratingAfter,
          ratingAfter - ratingBefore,
          final_rank,
          solved_count
        ]
      );
    }

    /* Recompute global contest ranks (rating → AC rate → user_id) */
    // Postgres UPDATE ... FROM syntax for join updates
    await conn.query(
      `
      UPDATE user_contest_stats u
      SET contest_global_rank = r.new_rank
      FROM (
        SELECT
          user_id,
          DENSE_RANK() OVER (
            ORDER BY
              contest_rating DESC,
              contest_acceptance_rate DESC,
              user_id ASC
          ) AS new_rank
        FROM user_contest_stats
      ) r 
      WHERE r.user_id = u.user_id
      `
    );

    await conn.query('COMMIT');
    console.log(`Contest ${contestId} finalized`);
  } catch (err) {
    await conn.query('ROLLBACK');
    console.error("Finalize contest failed:", err);
  } finally {
    conn.release();
  }
}