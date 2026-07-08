// routes/discussions.routes.js
import express from "express";
import { db } from "../config/db.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * CREATE DISCUSSION
 */
router.post(
  "/problems/:problemId/discussions",
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { problemId } = req.params;
      const { title, body } = req.body;

      if (!title || !body) {
        return res.status(400).json({
          error: "Title and body are required"
        });
      }

      // Postgres uses RETURNING id instead of result.insertId
      const { rows } = await db.query(
        `
        INSERT INTO problem_discussions
          (problem_id, user_id, title, body)
        VALUES ($1, $2, $3, $4)
        RETURNING id
        `,
        [problemId, userId, title.trim(), body]
      );

      res.status(201).json({
        id: rows[0].id,
        problemId,
        title,
        body
      });
    } catch (err) {
      console.error("CREATE DISCUSSION ERROR:", err);
      res.status(500).json({ error: "Failed to create discussion" });
    }
  }
);

/**
 * GET DISCUSSIONS FOR A PROBLEM
 */
router.get(
  "/problems/:problemId/discussions",
  authMiddleware,
  async (req, res) => {
    try {
      const { problemId } = req.params;

      const { rows } = await db.query(
        `
        SELECT
        d.id,
        d.title,
        d.views,
        d.reply_count,
        d.created_at,
        u.username,
        COALESCE(v.votes, 0) AS votes
        FROM problem_discussions d
        JOIN users u
        ON u.id = d.user_id
        LEFT JOIN (
          SELECT
          discussion_id,
          SUM(vote) AS votes
          FROM discussion_votes
          GROUP BY discussion_id
        ) v
        ON v.discussion_id = d.id
        WHERE d.problem_id = $1
        AND d.is_deleted = 0
        ORDER BY d.is_pinned DESC, d.created_at DESC;
        `,
        [problemId]
      );

      res.json(rows);
    } catch (err) {
      console.error("GET DISCUSSIONS ERROR:", err);
      res.status(500).json({ error: "Failed to fetch discussions" });
    }
  }
);

/**
 * GET SINGLE DISCUSSION
 */
router.get(
  "/problems/:problemId/discussions/:discussionId",
  authMiddleware,
  async (req, res) => {
    try {
      const { discussionId } = req.params;

      // increment views
      await db.query(
        `
        UPDATE problem_discussions
        SET views = views + 1
        WHERE id = $1
        `,
        [discussionId]
      );

      const { rows } = await db.query(
        `
        SELECT
        d.id,
        d.title,
        d.body,
        d.views,
        d.reply_count,
        d.created_at,
        u.username,
        COALESCE(
          (SELECT SUM(vote)
          FROM discussion_votes dv
          WHERE dv.discussion_id = d.id),
          0
        ) AS votes
        FROM problem_discussions d
        JOIN users u
        ON u.id = d.user_id
        WHERE d.id = $1
        AND d.is_deleted = 0;
        `,
        [discussionId]
      );
      
      const discussion = rows[0];
// SELECT SUM(vote) FROM discussion_votes WHERE discussion_id = $1
      if (!discussion) {
        return res.status(404).json({ error: "Discussion not found" });
      }

      res.json(discussion);
    } catch (err) {
      console.error("GET DISCUSSION ERROR:", err);
      res.status(500).json({ error: "Failed to fetch discussion" });
    }
  }
);

router.put("/discussions/:discussionId/upvote", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { discussionId } = req.params;

  let conn;
  try {
    conn = await db.connect();
    const { ExistenceRow } = await conn.query("SELECT 1 FROM problem_discussion WHERE id = $1", [discussionId]);
    if (ExistenceRow.length === 0) {
      return res.status(404).json({ message: "Discussion Not Found" });
    }
    const { alreadyVoted } = await conn.query("SELECT vote FROM discussion_votes WHERE user_id = $1 AND discussion_id = $2", [userId, discussionId]);
    if (alreadyVoted.length) {
      if (alreadyVoted[0].vote == "1") return res.status(200).json({ message : "Already Voted" });
      await conn.query("UPDATE discussion_votes SET vote = 1 WHERE user_id = $1 AND discussion_id = $2", [userId, discussionId]);
    }
    else await conn.query("INSERT INTO discussion_votes (user_id, discussion_id, vote) VALUES ($1, $2, 1)", [userId, discussionId]);
    res.status(200).json({ message : "Upvoted" });
  } catch (err) {
    res.status(500).json({ message : "An internal server error occured" });
  } finally {
    if (conn) conn.release();
  }
});

router.put("/discussions/:discussionId/downvote", authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const { discussionId } = req.params;

  let conn;
  try {
    conn = await db.connect();
    const { ExistenceRow } = await conn.query("SELECT 1 FROM problem_discussion WHERE id = $1", [discussionId]);
    if (ExistenceRow.length === 0) {
      return res.status(404).json({ message: "Discussion Not Found" });
    }
    const { alreadyVoted } = await conn.query("SELECT vote FROM discussion_votes WHERE user_id = $1 AND discussion_id = $2", [userId, discussionId]);
    if (alreadyVoted.length) {
      if (alreadyVoted[0].vote == "-1") return res.status(200).json({ message : "Already Voted" });
      await conn.query("UPDATE discussion_votes SET vote = -1 WHERE user_id = $1 AND discussion_id = $2", [userId, discussionId]);
    }
    else await conn.query("INSERT INTO discussion_votes (user_id, discussion_id, vote) VALUES ($1, $2, -1)", [userId, discussionId]);
    res.status(200).json({ message : "Upvoted" });
  } catch (err) {
    res.status(500).json({ message : "An internal server error occured" });
  } finally {
    if (conn) conn.release();
  }
});

export default router;