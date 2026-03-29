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
          d.upvotes,
          d.views,
          d.reply_count,
          d.created_at,
          u.username
        FROM problem_discussions d
        JOIN users u ON u.id = d.user_id
        WHERE d.problem_id = $1
          AND d.is_deleted = FALSE
        ORDER BY d.is_pinned DESC, d.created_at DESC
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
          d.upvotes,
          d.views,
          d.reply_count,
          d.created_at,
          u.username
        FROM problem_discussions d
        JOIN users u ON u.id = d.user_id
        WHERE d.id = $1 AND d.is_deleted = FALSE
        `,
        [discussionId]
      );
      
      const discussion = rows[0];

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

export default router;