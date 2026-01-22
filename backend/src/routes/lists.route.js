import express from "express";
import { db } from "../config/db.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/lists", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id; 

    const [rows] = await db.query(
      `
      SELECT
        ul.id,
        ul.name,
        ul.description,
        ul.color,
        ul.created_at,
        COUNT(ulp.problem_id) AS total_problems,
        COUNT(
          CASE WHEN ups.status = 'solved' THEN 1 END
        ) AS solved_problems
      FROM user_lists ul
      LEFT JOIN user_list_problems ulp
        ON ulp.list_id = ul.id
      LEFT JOIN user_problem_status ups
        ON ups.problem_id = ulp.problem_id
        AND ups.user_id = ul.user_id
      WHERE ul.user_id = ?
      GROUP BY ul.id
      ORDER BY ul.created_at DESC
      `,
      [userId]
    );

    res.json(rows);
  } catch (err) {
    console.error("GET LISTS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/lists", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, description, color } = req.body;

    if (!name || !color) {
      return res.status(400).json({ error: "Name and color are required" });
    }

    const [result] = await db.query(
      `
      INSERT INTO user_lists (user_id, name, description, color)
      VALUES (?, ?, ?, ?)
      `,
      [userId, name, description || null, color]
    );

    res.status(201).json({
      id: result.insertId,
      name,
      description,
      color
    });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        error: "You already have a list with this name"
      });
    }
    console.error("CREATE LIST ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

router.put("/lists/:listId", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { listId } = req.params;
    const { name, description, color } = req.body;

    const [result] = await db.query(
      `
      UPDATE user_lists
      SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        color = COALESCE(?, color)
      WHERE id = ? AND user_id = ?
      `,
      [name, description, color, listId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "List not found" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("UPDATE LIST ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

router.delete("/lists/:listId", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { listId } = req.params;

    const [result] = await db.query(
      `
      DELETE FROM user_lists
      WHERE id = ? AND user_id = ?
      `,
      [listId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "List not found" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("DELETE LIST ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/lists/:listId/problems", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { listId } = req.params;

    // ensure list belongs to user
    const [[list]] = await db.query(
      `
      SELECT id
      FROM user_lists
      WHERE id = ? AND user_id = ?
      `,
      [listId, userId]
    );

    if (!list) {
      return res.status(404).json({ error: "List not found" });
    }

    const [rows] = await db.query(
      `
      SELECT
        p.id,
        p.title,
        p.difficulty,
        ups.status
      FROM user_list_problems ulp
      JOIN problems p
        ON p.id = ulp.problem_id
      LEFT JOIN user_problem_status ups
        ON ups.problem_id = p.id
        AND ups.user_id = ?
      WHERE ulp.list_id = ?
      ORDER BY p.id ASC
      `,
      [userId, listId]
    );

    res.json(rows);
  } catch (err) {
    console.error("GET LIST PROBLEMS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

router.delete(
  "/lists/:listId/problems/:problemId",
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { listId, problemId } = req.params;

      // ensure list belongs to user
      const [[list]] = await db.query(
        `
        SELECT id
        FROM user_lists
        WHERE id = ? AND user_id = ?
        `,
        [listId, userId]
      );

      if (!list) {
        return res.status(404).json({ error: "List not found" });
      }

      const [result] = await db.query(
        `
        DELETE FROM user_list_problems
        WHERE list_id = ? AND problem_id = ?
        `,
        [listId, problemId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          error: "Problem not found in list",
        });
      }

      res.json({ success: true });
    } catch (err) {
      console.error("REMOVE PROBLEM FROM LIST ERROR:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

router.post("/lists/:listId/problems", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { listId } = req.params;
    const { problemId } = req.body;

    if (!problemId) {
      return res.status(400).json({ error: "problemId is required" });
    }

    // verify list ownership
    const [[list]] = await db.query(
      `
      SELECT id
      FROM user_lists
      WHERE id = ? AND user_id = ?
      `,
      [listId, userId]
    );

    if (!list) {
      return res.status(404).json({ error: "List not found" });
    }

    await db.query(
      `
      INSERT IGNORE INTO user_list_problems (list_id, problem_id)
      VALUES (?, ?)
      `,
      [listId, problemId]
    );

    res.status(201).json({ success: true });
  } catch (err) {
    console.error("ADD PROBLEM TO LIST ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


export default router;