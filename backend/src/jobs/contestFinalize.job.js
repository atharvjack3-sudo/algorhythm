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
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    /*  Prevent double finalization */
    const [existing] = await conn.execute(
      `SELECT 1 FROM contest_results WHERE contest_id = ? LIMIT 1`,
      [contestId]
    );

    if (existing.length > 0) {
      await conn.rollback();
      return;
    }

    /*  Aggregate submissions → contest_scores */
    await conn.execute(
      `
      UPDATE contest_scores cs
      JOIN (
        SELECT
          contest_id,
          user_id,
          COUNT(*) AS total_submissions,
          SUM(verdict = 'AC') AS successful_submissions
        FROM contest_submissions
        WHERE contest_id = ?
        GROUP BY contest_id, user_id
      ) agg
        ON agg.contest_id = cs.contest_id
       AND agg.user_id = cs.user_id
      SET
        cs.total_submissions = agg.total_submissions,
        cs.successful_submissions = agg.successful_submissions
      `,
      [contestId]
    );

    /*  Freeze final leaderboard */
    await conn.execute(
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
      WHERE contest_id = ?
      `,
      [contestId]
    );

    /*  Fetch finalized contest stats */
    const [scores] = await conn.execute(
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
      WHERE cs.contest_id = ?
      `,
      [contestId]
    );

    const participants = scores.length;

    /*  Aggregate lifetime contest stats */
    for (const row of scores) {
      const {
        user_id,
        solved_count,
        total_submissions,
        successful_submissions
      } = row;

      await conn.execute(
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
        VALUES (?, 1, ?, ?, ?, ?, CURRENT_DATE)
        ON DUPLICATE KEY UPDATE
          contests_participated = contests_participated + 1,
          contests_solved = contests_solved + VALUES(contests_solved),
          contest_total_submissions =
            contest_total_submissions + VALUES(contest_total_submissions),
          contest_successful_submissions =
            contest_successful_submissions + VALUES(contest_successful_submissions),
          contest_acceptance_rate =
            IF(
              contest_total_submissions + VALUES(contest_total_submissions) = 0,
              0,
              (contest_successful_submissions + VALUES(contest_successful_submissions)) /
              (contest_total_submissions + VALUES(contest_total_submissions)) * 100
            ),
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

    /*  Rating calculation */
    const [ratings] = await conn.execute(
      `
      SELECT user_id, contest_rating
      FROM user_contest_stats
      WHERE user_id IN (
        SELECT user_id FROM contest_scores WHERE contest_id = ?
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

      await conn.execute(
        `UPDATE user_contest_stats SET contest_rating = ? WHERE user_id = ?`,
        [ratingAfter, user_id]
      );

      await conn.execute(
        `
        INSERT IGNORE INTO contest_rating_history
          (user_id, contest_id, rating_before, rating_after, rating_change, final_rank, solved_count)
        VALUES (?, ?, ?, ?, ?, ?, ?)
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

    /*  Recompute global contest ranks (rating → AC rate → user_id) */
    await conn.execute(
      `
      UPDATE user_contest_stats u
      JOIN (
        SELECT
          user_id,
          DENSE_RANK() OVER (
            ORDER BY
              contest_rating DESC,
              contest_acceptance_rate DESC,
              user_id ASC
          ) AS new_rank
        FROM user_contest_stats
      ) r ON r.user_id = u.user_id
      SET u.contest_global_rank = r.new_rank
      `
    );

    await conn.commit();
    console.log(`Contest ${contestId} finalized`);
  } catch (err) {
    await conn.rollback();
    console.error("Finalize contest failed:", err);
  } finally {
    conn.release();
  }
}
