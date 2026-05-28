import express from "express";
import { db } from "../config/db.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { analyzeUserPerformance } from "../utils/google.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const router = express.Router();
const upload = multer();

router.get("/me", authMiddleware, async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM users WHERE id = $1`,
    [req.user.id]
  );
  res.json(rows[0]);
});

router.post(
  "/upload-profile-picture",
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided." });
      }

      const streamUpload = (fileBuffer) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "algorhythm_profiles", 
              transformation: [{ width: 500, height: 500, crop: "fill" }] 
            },
            (error, result) => {
              if (result) {
                resolve(result);
              } else {
                reject(error);
              }
            }
          );
          streamifier.createReadStream(fileBuffer).pipe(stream);
        });
      };
      const result = await streamUpload(req.file.buffer);

      const { rows } = await db.query(
        `
        UPDATE users 
        SET profile = $1
        WHERE id = $2 
        RETURNING profile
        `,
        [result.secure_url, req.user.id]
      );

      res.json({
        message: "Profile picture updated successfully",
        profile_url: rows[0].profile,
      });

    } catch (err) {
      console.error("Profile picture upload error:", err);
      res.status(500).json({ error: "Failed to upload profile picture. Please try again." });
    }
  }
);

router.get("/ping", async (req, res) => {
    await db.query("SELECT 1");
    res.send("ok");
});

router.get("/userdetails", authMiddleware, async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM user_stats WHERE user_id = $1`,
    [req.user.id]
  );
  res.json(rows[0]);
});
router.get("/user-information/:username", authMiddleware, async (req, res) => {
  try {
    // Check if requester is owner
    const roleResult = await db.query(
      `SELECT role FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (roleResult.rows.length === 0 || roleResult.rows[0].role !== "owner") {
      return res.status(403).json({
        message: "Unauthorized"
      });
    }

    const { rows } = await db.query(
      `
      SELECT 
        u.id,
        u.username,
        u.email,
        u.created_at,
        u.role,
        uc.contest_global_rank,
        uc.contest_rating,
        uc.is_banned
      FROM users u
      LEFT JOIN user_contest_stats uc
        ON u.id = uc.user_id
      WHERE u.username = $1
      `,
      [req.params.username]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "user not found"
      });
    }

    res.json(rows[0]);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "An internal error occurred"
    });
  }
});

router.post("/update-user-information/:id", authMiddleware, async (req, res) => {
  const conn = await db.connect();

  try {
    const targetUserId = req.params.id;
    const { role, is_banned } = req.body;

    const roleResult = await conn.query(
      `SELECT role FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (roleResult.rows.length === 0 || roleResult.rows[0].role !== "owner") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const validRoles = ["user", "moderator", "owner"];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role specified" });
    }
    if (String(req.user.id) === String(targetUserId) && (is_banned === true || role !== "owner")) {
      return res.status(400).json({ 
        message: "Action restricted: You cannot ban or demote your own account." 
      });
    }
    let isBannedInt = null;
    if (is_banned !== undefined) {
      isBannedInt = is_banned ? 1 : 0;
    }

    await conn.query("BEGIN");

    let updatedUser = null;
    if (role !== undefined) {
      const { rows } = await conn.query(
        `
        UPDATE users 
        SET role = $1
        WHERE id = $2 
        RETURNING id, username, email, role;
        `,
        [role, targetUserId]
      );
      if (rows.length === 0) throw new Error("USER_NOT_FOUND");
      updatedUser = rows[0];
    }

    let updatedStats = null;
    if (isBannedInt !== null) {
      const { rows } = await conn.query(
        `
        UPDATE user_contest_stats 
        SET is_banned = $1::int2
        WHERE user_id = $2
        RETURNING is_banned;
        `,
        [isBannedInt, targetUserId]
      );
      if (rows.length > 0) updatedStats = rows[0];
    }

    await conn.query("COMMIT");

    res.json({
      message: "User context synchronized successfully",
      user: {
        ...updatedUser,
        is_banned: updatedStats ? (updatedStats.is_banned === 1) : is_banned
      }
    });

  } catch (err) {
    await conn.query("ROLLBACK");
    console.error("Administrative update loop tracking failure:", err);

    if (err.message === "USER_NOT_FOUND") {
      return res.status(404).json({ message: "Target account variant missing" });
    }
    res.status(500).json({ message: "An internal database error occurred" });
  } finally {
    conn.release();
  }
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

// GET /api/user-dashboard
router.get("/user-dashboard", authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const { rows } = await db.query(`
      WITH user_info AS (
        SELECT * FROM user_stats WHERE user_id = $1
      ),
      c_stats AS (
        SELECT user_id, contests_participated, contests_solved, 
               contest_total_submissions, contest_successful_submissions, 
               contest_acceptance_rate, contest_rating, contest_global_rank, 
               is_banned, banned_reason, banned_at, last_contest_date, 
               created_at, updated_at
        FROM user_contest_stats WHERE user_id = $1
      ),
      r_history AS (
        SELECT json_agg(row_to_json(t)) AS data FROM (
          SELECT contest_id, rating_before, rating_after, rating_change, 
                 final_rank, solved_count, created_at
          FROM contest_rating_history WHERE user_id = $1 ORDER BY created_at ASC
        ) t
      ),
      b_list AS (
        SELECT json_agg(row_to_json(t)) AS data FROM (
          SELECT ub.badge_id, b.name, b.description, ub.earned_at 
          FROM user_badges ub JOIN badges b ON ub.badge_id = b.id 
          WHERE ub.user_id = $1 ORDER BY ub.earned_at DESC
        ) t
      ),
      ac_list AS (
        SELECT json_agg(row_to_json(t)) AS data FROM (
          SELECT s.id, s.problem_id, p.title AS problem_title, s.language, 
                 s.runtime_ms, s.memory_kb, s.submitted_at
          FROM submissions s JOIN problems p ON p.id = s.problem_id 
          WHERE s.user_id = $1 AND s.verdict = 'AC' 
          ORDER BY s.submitted_at DESC LIMIT 10
        ) t
      ),
      h_map AS (
        SELECT json_agg(row_to_json(t)) AS data FROM (
          SELECT submitted_at::DATE AS day, COUNT(*)::INTEGER AS count 
          FROM submissions WHERE user_id = $1 AND submitted_at >= CURRENT_DATE - INTERVAL '3 months' 
          GROUP BY submitted_at::DATE ORDER BY day
        ) t
      ),
      p_stats AS (
        SELECT * FROM platform_stats LIMIT 1
      )
      
      -- Assemble the final JSON object to send straight to the frontend
      SELECT
        (SELECT row_to_json(user_info.*) FROM user_info) AS details,
        (SELECT row_to_json(c_stats.*) FROM c_stats) AS "contestStats",
        COALESCE((SELECT data FROM r_history), '[]'::json) AS "ratingHistory",
        COALESCE((SELECT data FROM b_list), '[]'::json) AS badges,
        COALESCE((SELECT data FROM ac_list), '[]'::json) AS "recentAC",
        COALESCE((SELECT data FROM h_map), '[]'::json) AS heatmap,
        (SELECT row_to_json(p_stats.*) FROM p_stats) AS "platformStats";
    `, [userId]);

    // If the user doesn't exist, handle it safely
    if (!rows[0].details) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(rows[0]);

  } catch (err) {
    console.error("Unified dashboard fetch error:", err);
    res.status(500).json({ error: "Failed to fetch user dashboard data" });
  }
});

// GET /api/users/profile/:username
router.get("/profile/:username", async (req, res) => {
  const { username } = req.params;

  try {
    const { rows } = await db.query(`
      WITH target_user AS (
        SELECT id, username, created_at, profile FROM users WHERE username = $1
      ),
      u_stats AS (
        SELECT total_solved, global_rank, acceptance_rate, current_streak
        FROM user_stats WHERE user_id = (SELECT id FROM target_user)
      ),
      c_stats AS (
        SELECT contest_rating, contest_global_rank, contests_participated, is_banned
        FROM user_contest_stats WHERE user_id = (SELECT id FROM target_user)
      ),
      r_hist AS (
        SELECT json_agg(row_to_json(t)) AS data FROM (
          SELECT contest_id, rating_before, rating_after, rating_change, final_rank, created_at
          FROM contest_rating_history 
          WHERE user_id = (SELECT id FROM target_user) 
          ORDER BY created_at ASC
        ) t
      ),
      h_map AS (
        SELECT json_agg(row_to_json(t)) AS data FROM (
          SELECT submitted_at::DATE AS day, COUNT(*)::INTEGER AS count 
          FROM submissions 
          WHERE user_id = (SELECT id FROM target_user) 
            AND submitted_at >= CURRENT_DATE - INTERVAL '6 months' 
          GROUP BY submitted_at::DATE 
          ORDER BY day
        ) t
      )
      
      SELECT 
        (SELECT row_to_json(target_user.*) FROM target_user) AS user_info,
        (SELECT row_to_json(u_stats.*) FROM u_stats) AS general_stats,
        (SELECT row_to_json(c_stats.*) FROM c_stats) AS contest_stats,
        COALESCE((SELECT data FROM r_hist), '[]'::json) AS rating_history,
        COALESCE((SELECT data FROM h_map), '[]'::json) AS heatmap;
    `, [username]);

    // If target_user CTE returned nothing, the user doesn't exist
    if (!rows[0].user_info) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(rows[0]);

  } catch (err) {
    console.error("Public profile fetch error:", err);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

export default router;
