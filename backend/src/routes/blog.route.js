import express from "express";
import { db } from "../config/db.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
const router = express.Router();

router.post("/blogs", authMiddleware, async (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: "Title and content are required" });
  }

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  try {
    await db.query(
      `
      INSERT INTO blogs (author_id, title, slug, content)
      VALUES ($1, $2, $3, $4)
      `,
      [req.user.id, title, slug, content]
    );

    res.status(201).json({ message: "Blog created successfully" });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ error: "Blog with this title already exists" });
    }
    res.status(500).json({ error: "Failed to create blog" });
  }
});

router.get("/blogs", async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 10, 50);
  const offset = parseInt(req.query.offset) || 0;

  try {
    const query = `
      SELECT
        b.id,
        b.title,
        b.slug,
        b.likes_count,
        b.views_count,
        b.comments_count,
        b.created_at,
        u.username AS author
      FROM blogs b
      JOIN users u ON u.id = b.author_id
      WHERE b.is_published = 1
      ORDER BY b.created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const { rows } = await db.query(query, [limit, offset]);
    res.json(rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to fetch blogs" });
  }
});

router.get("/blogs/mine", authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query(
      `
      SELECT
        id,
        title,
        slug,
        likes_count,
        comments_count,
        views_count,
        created_at
      FROM blogs
      WHERE author_id = $1
      ORDER BY created_at DESC
      `,
      [req.user.id]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch user blogs" });
  }
});

router.get("/blogs/:slug", async (req, res) => {
  try {
    const { rows } = await db.query(
      `
      SELECT
        b.id,
        b.title,
        b.content,
        b.likes_count,
        b.views_count,
        b.comments_count,
        b.created_at,
        u.username AS author,
        u.id AS author_id
      FROM blogs b
      JOIN users u ON u.id = b.author_id
      WHERE b.slug = $1 AND b.is_published = 1
      `,
      [req.params.slug]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Blog not found" });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch blog" });
  }
});

router.put("/blogs/:id", authMiddleware, async (req, res) => {
  const { title, content } = req.body;

  try {
    const { rows } = await db.query(
      `SELECT author_id FROM blogs WHERE id = $1`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Blog not found" });
    }

    if (rows[0].author_id !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await db.query(
      `
      UPDATE blogs
      SET title = $1, content = $2
      WHERE id = $3
      `,
      [title, content, req.params.id]
    );

    res.json({ message: "Blog updated successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update blog" });
  }
});

router.delete("/blogs/:id", authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT author_id FROM blogs WHERE id = $1`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Blog not found" });
    }

    if (rows[0].author_id !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await db.query(`DELETE FROM blogs WHERE id = $1`, [req.params.id]);

    res.json({ message: "Blog deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete blog" });
  }
});

router.post("/blogs/:id/comments", authMiddleware, async (req, res) => {
  const { content } = req.body;
  const blogId = req.params.id;

  if (!content?.trim()) {
    return res.status(400).json({ error: "Comment content required" });
  }

  const conn = await db.connect();
  try {
    await conn.query('BEGIN');

    await conn.query(
      `
      INSERT INTO blog_comments (blog_id, user_id, content)
      VALUES ($1, $2, $3)
      `,
      [blogId, req.user.id, content]
    );

    await conn.query(
      `
      UPDATE blogs
      SET comments_count = comments_count + 1
      WHERE id = $1
      `,
      [blogId]
    );

    await conn.query('COMMIT');
    res.status(201).json({ message: "Comment added" });
  } catch (err) {
    await conn.query('ROLLBACK');
    res.status(500).json({ error: "Failed to add comment" });
  } finally {
    conn.release();
  }
});

router.get("/blogs/:id/comments", async (req, res) => {
  try {
    const { rows } = await db.query(
      `
      SELECT
        c.id,
        c.content,
        c.likes_count,
        c.created_at,
        u.username,
        u.id AS user_id
      FROM blog_comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.blog_id = $1
      ORDER BY c.created_at ASC
      `,
      [req.params.id]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

router.post("/blogs/:id/like", authMiddleware, async (req, res) => {
  const blogId = req.params.id;

  const conn = await db.connect();
  try {
    await conn.query('BEGIN');

    const { rows } = await conn.query(
      `
      SELECT 1 FROM blog_likes
      WHERE blog_id = $1 AND user_id = $2
      `,
      [blogId, req.user.id]
    );

    if (rows.length) {
      await conn.query(
        `DELETE FROM blog_likes WHERE blog_id = $1 AND user_id = $2`,
        [blogId, req.user.id]
      );

      await conn.query(
        `
        UPDATE blogs
        SET likes_count = likes_count - 1
        WHERE id = $1
        `,
        [blogId]
      );

      await conn.query('COMMIT');
      return res.json({ liked: false });
    }

    await conn.query(
      `
      INSERT INTO blog_likes (blog_id, user_id)
      VALUES ($1, $2)
      `,
      [blogId, req.user.id]
    );

    await conn.query(
      `
      UPDATE blogs
      SET likes_count = likes_count + 1
      WHERE id = $1
      `,
      [blogId]
    );

    await conn.query('COMMIT');
    res.json({ liked: true });
  } catch (err) {
    await conn.query('ROLLBACK');
    res.status(500).json({ error: "Failed to toggle like" });
  } finally {
    conn.release();
  }
});

router.post("/comments/:id/like", authMiddleware, async (req, res) => {
  const commentId = req.params.id;

  const conn = await db.connect();
  try {
    await conn.query('BEGIN');

    const { rows } = await conn.query(
      `
      SELECT 1 FROM comment_likes
      WHERE comment_id = $1 AND user_id = $2
      `,
      [commentId, req.user.id]
    );

    if (rows.length) {
      await conn.query(
        `
        DELETE FROM comment_likes
        WHERE comment_id = $1 AND user_id = $2
        `,
        [commentId, req.user.id]
      );

      await conn.query(
        `
        UPDATE blog_comments
        SET likes_count = likes_count - 1
        WHERE id = $1
        `,
        [commentId]
      );

      await conn.query('COMMIT');
      return res.json({ liked: false });
    }

    await conn.query(
      `
      INSERT INTO comment_likes (comment_id, user_id)
      VALUES ($1, $2)
      `,
      [commentId, req.user.id]
    );

    await conn.query(
      `
      UPDATE blog_comments
      SET likes_count = likes_count + 1
      WHERE id = $1
      `,
      [commentId]
    );

    await conn.query('COMMIT');
    res.json({ liked: true });
  } catch (err) {
    await conn.query('ROLLBACK');
    res.status(500).json({ error: "Failed to toggle comment like" });
  } finally {
    conn.release();
  }
});

router.post("/blogs/:id/view", async (req, res) => {
  const blogId = req.params.id;
  const userId = req.user?.id || null;
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress;

  try {
    let query, params;

    if (userId) {
      query = `
        SELECT 1 FROM blog_views
        WHERE blog_id = $1
          AND user_id = $2
          AND viewed_at >= NOW() - INTERVAL '1 day'
        LIMIT 1
      `;
      params = [blogId, userId];
    } else {
      query = `
        SELECT 1 FROM blog_views
        WHERE blog_id = $1
          AND ip_address = $2
          AND viewed_at >= NOW() - INTERVAL '1 day'
        LIMIT 1
      `;
      params = [blogId, ip];
    }

    const { rows } = await db.query(query, params);

    if (rows.length) {
      return res.json({ viewed: false });
    }

    const conn = await db.connect();
    try {
      await conn.query('BEGIN');

      await conn.query(
        `
        INSERT INTO blog_views (blog_id, user_id, ip_address)
        VALUES ($1, $2, $3)
        `,
        [blogId, userId, ip]
      );

      await conn.query(
        `
        UPDATE blogs
        SET views_count = views_count + 1
        WHERE id = $1
        `,
        [blogId]
      );

      await conn.query('COMMIT');
    } catch (err) {
      await conn.query('ROLLBACK');
      throw err;
    } finally {
      conn.release();
    }

    res.json({ viewed: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to register view" });
  }
});

export default router;