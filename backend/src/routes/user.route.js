import express from "express";
import { db } from "../config/db.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { analyzeUserPerformance } from "../utils/google.js";

const router = express.Router();

router.get("/me", authMiddleware, async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM users WHERE id = $1`,
    [req.user.id]
  );
  res.json(rows[0]);
});

router.get("/userdetails", authMiddleware, async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM user_stats WHERE user_id = $1`,
    [req.user.id]
  );
  res.json(rows[0]);
});

router.get("/userbadges", authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query(
      `
      SELECT 
        ub.badge_id,
        b.name,
        b.description,
        ub.earned_at
      FROM user_badges ub
      JOIN badges b ON ub.badge_id = b.id
      WHERE ub.user_id = $1
      ORDER BY ub.earned_at DESC
      `,
      [req.user.id]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user badges" });
  }
});


// GET last 10 accepted submissions for dashboard
router.get("/recent-accepted", authMiddleware,
  async (req, res) => {
    const userId = req.user.id;

    try {
      const { rows } = await db.query(
        `SELECT s.id, s.problem_id, p.title AS problem_title,
          s.language,
          s.runtime_ms,
          s.memory_kb,
          s.submitted_at
        FROM submissions s
        JOIN problems p ON p.id = s.problem_id
        WHERE 
          s.user_id = $1
          AND s.verdict = 'AC'
        ORDER BY s.submitted_at DESC
        LIMIT 10`,
        [userId]
      );

      res.json(rows);
    } catch (err) {
      console.error("Recent AC fetch error:", err);
      res.status(500).json({ error: "Failed to fetch recent submissions" });
    }
  }
);

router.get("/activity-heatmap", authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const { rows } = await db.query(
      `
      SELECT
        submitted_at::DATE AS day,
        COUNT(*)::INTEGER AS count
      FROM submissions
      WHERE
        user_id = $1
        AND submitted_at >= CURRENT_DATE - INTERVAL '3 months'
      GROUP BY submitted_at::DATE
      ORDER BY day;
      `,
      [userId]
    );

    res.json(rows);
  } catch (err) {
    console.error("Heatmap fetch error:", err);
    res.status(500).json({ error: "Failed to fetch activity heatmap" });
  }
});


router.get("/get-platform-stats", async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM platform_stats");
    res.json(rows);
  } catch (err) {
    res.status(500).json({error: "Failed to fetch stats."});
  }
})

router.get("/leaderboard", async (req, res) => {
  try {
    const { rows } = await db.query("SELECT username, global_rank, total_solved FROM users JOIN user_stats on users.id = user_stats.user_id ORDER BY user_stats.global_rank ASC LIMIT 100"); 
    res.json(rows);
  } catch (err) {
    res.status(500).json({error: err.message});
  }
})

router.get("/users/:id/performance", authMiddleware, async (req, res) => {
  const userId = req.params.id;
  const conn = await db.connect();

  try {
    const { rows } = await conn.query(
      `
      SELECT
        t.name AS topic,
        utr.rating,
        utr.attempts,
        utr.solves
      FROM user_topic_rating utr
      JOIN topics t ON t.id = utr.topic_id
      WHERE utr.user_id = $1
      `,
      [userId]
    );

    const topics = rows.map(r => ({
      topic: r.topic,
      rating: r.rating,
      attempts: r.attempts,
      solves: r.solves,
      level:
        r.rating < 1000 ? "weak" :
        r.rating > 1500 ? "strong" :
        "medium"
    }));
    
    let aiRes = "";
    try {
       aiRes = {
        "summary": "Array and hashing skills need serious work to clear interviews",
        "focus_topics": ["Array", "Hashing"],
        "practice_advice": ["try 2 pointers", "try hashing + array"]
       }
  //   aiRes = await analyzeUserPerformance({topics});
    } catch (err) {
      console.log(err);
      aiRes = "error."
    }
    
    res.json({
      user_id: userId,
      topics,
      ai_analysis: aiRes,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch performance" });
  } finally {
    conn.release();
  }
});

export default router;
