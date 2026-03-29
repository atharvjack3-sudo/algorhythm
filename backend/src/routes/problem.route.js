import express from "express";
import fs from "fs/promises";
import path from "path";
import { db } from "../config/db.js"; // your pg pool

const router = express.Router();

router.post("/add-problem", async (req, res) => {
  const {
    title,
    difficulty,
    statement,
    constraints,
    input_format,
    output_format,
    editorial,
    topics,

    // old
    sample_testcase,

    // new
    sample_testcases,
    hidden_testcases,
  } = req.body;

  // ------------------ Validation ------------------
  if (
    !title ||
    !difficulty ||
    !statement ||
    !input_format ||
    !output_format ||
    !Array.isArray(topics) ||
    topics.length === 0
  ) {
    return res.status(400).json({ error: "Invalid payload format" });
  }

  // ------------------ Normalize testcases ------------------
  let samples = [];
  let hidden = [];

  // backward compatibility
  if (sample_testcase?.input && sample_testcase?.output) {
    samples.push(sample_testcase);
  }

  if (Array.isArray(sample_testcases)) {
    samples.push(...sample_testcases);
  }

  if (Array.isArray(hidden_testcases)) {
    hidden.push(...hidden_testcases);
  }

  // validate testcase format
  const validateTC = (tc) => tc?.input != null && tc?.output != null;

  samples = samples.filter(validateTC);
  hidden = hidden.filter(validateTC);

  const conn = await db.connect();

  try {
    await conn.query('BEGIN');

    //  Insert problem (Postgres uses RETURNING id)
    const { rows: problemRes } = await conn.query(
      `INSERT INTO problems (title, difficulty)
       VALUES ($1, $2) RETURNING id`,
      [title, difficulty]
    );
    const problemId = problemRes[0].id;

    //  Insert problem content
    await conn.query(
      `INSERT INTO problem_content
       (problem_id, statement, constraints, input_format, output_format, editorial)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        problemId,
        statement,
        constraints ?? null,
        input_format,
        output_format,
        editorial ?? null,
      ]
    );

    //  Insert initial stats
    await conn.query(
      `INSERT INTO problem_stats
       (problem_id, total_submissions, total_accepted, acceptance_rate)
       VALUES ($1, 0, 0, NULL)`,
      [problemId]
    );

    //  Ensure topics exist (Postgres uses ON CONFLICT DO NOTHING)
    for (const topic of topics) {
      await conn.query(
        `INSERT INTO topics (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
        [topic]
      );
    }

    //  Map problem ↔ topics
    // dynamically generate $2, $3, etc. for the IN clause
    const topicPlaceholders = topics.map((_, i) => `$${i + 2}`).join(",");
    await conn.query(
      `INSERT INTO problem_topics (problem_id, topic_id)
       SELECT $1, id FROM topics
       WHERE name IN (${topicPlaceholders})`,
      [problemId, ...topics]
    );

    //  Write testcases
    const testcaseDir = path.join(
      process.cwd(),
      "testcases",
      `problem_${problemId}`
    );
    await fs.mkdir(testcaseDir, { recursive: true });

    let tcIndex = 1;

    const insertTC = async (tc, isSample) => {
      const inputPath = path.join(testcaseDir, `input${tcIndex}.txt`);
      const outputPath = path.join(testcaseDir, `output${tcIndex}.txt`);

      await fs.writeFile(inputPath, tc.input);
      await fs.writeFile(outputPath, tc.output);

      await conn.query(
        `INSERT INTO problem_testcases
         (problem_id, input_path, output_path, is_sample)
         VALUES ($1, $2, $3, $4)`,
        [
          problemId,
          `/testcases/problem_${problemId}/input${tcIndex}.txt`,
          `/testcases/problem_${problemId}/output${tcIndex}.txt`,
          isSample ? 1 : 0, // Converting boolean to SMALLINT mapped 1/0
        ]
      );

      tcIndex++;
    };

    for (const tc of samples) {
      await insertTC(tc, true);
    }

    for (const tc of hidden) {
      await insertTC(tc, false);
    }

    //  Update platform stats
    const columnMap = {
      easy: "easy_problems",
      medium: "medium_problems",
      hard: "hard_problems",
    };

    const column = columnMap[difficulty.toLowerCase()];
    if (!column) throw new Error("Invalid difficulty");

    await conn.query(`
      UPDATE platform_stats
      SET ${column} = ${column} + 1
    `);

    await conn.query('COMMIT');

    res.status(201).json({
      message: "Problem created successfully",
      problem_id: problemId,
      samples_added: samples.length,
      hidden_added: hidden.length,
    });
  } catch (err) {
    await conn.query('ROLLBACK');
    console.error("Problem insertion failed:", err);
    res.status(500).json({ error: "Failed to create problem" });
  } finally {
    conn.release();
  }
});


router.get("/problems/:problemId", async (req, res) => {
  const { problemId } = req.params;

  if (!problemId || isNaN(problemId)) {
    return res.status(400).json({ error: "Invalid problem ID" });
  }

  try {
    //  Fetch problem core + content + stats
    const { rows: problemRows } = await db.query(
      `
      SELECT
        p.id,
        p.title,
        p.difficulty,
        p.created_at,

        pc.statement,
        pc.constraints,
        pc.input_format,
        pc.output_format,
        pc.editorial,

        ps.total_submissions,
        ps.acceptance_rate
      FROM problems p
      JOIN problem_content pc ON pc.problem_id = p.id
      JOIN problem_stats ps ON ps.problem_id = p.id
      WHERE p.id = $1
      `,
      [problemId]
    );

    const problem = problemRows[0];

    if (!problem) {
      return res.status(404).json({ error: "Problem not found" });
    }

    //  Fetch topics
    const { rows: topicRows } = await db.query(
      `
      SELECT t.name
      FROM problem_topics pt
      JOIN topics t ON t.id = pt.topic_id
      WHERE pt.problem_id = $1
      `,
      [problemId]
    );

    const topics = topicRows.map((t) => t.name);

    //  Fetch sample testcases (paths)
    const { rows: sampleRows } = await db.query(
      `
      SELECT input_path, output_path
      FROM problem_testcases
      WHERE problem_id = $1 AND is_sample = 1
      `,
      [problemId]
    );

    //  Read testcase files from disk
    const samples = [];

    for (const tc of sampleRows) {
      const inputPath = path.join(process.cwd(), tc.input_path);
      const outputPath = path.join(process.cwd(), tc.output_path);

      const input = await fs.readFile(inputPath, "utf-8");
      const output = await fs.readFile(outputPath, "utf-8");

      samples.push({ input, output });
    }

    //  Send response
    res.json({
      problem: {
        id: problem.id,
        title: problem.title,
        difficulty: problem.difficulty,
        created_at: problem.created_at,
      },
      content: {
        statement: problem.statement,
        constraints: problem.constraints,
        input_format: problem.input_format,
        output_format: problem.output_format,
        editorial: problem.editorial,
      },
      stats: {
        total_submissions: problem.total_submissions,
        acceptance_rate: problem.acceptance_rate,
      },
      topics,
      samples,
    });
  } catch (err) {
    console.error("Failed to fetch problem:", err);
    res.status(500).json({ error: "Failed to fetch problem details" });
  }
});

router.get("/problem-list", async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const offset = (page - 1) * limit;

    const search = req.query.searchQuery?.trim() || "";

    const tags = req.query.tags
      ? req.query.tags.split(",").map(Number).filter(Boolean)
      : [];

    const difficulties = req.query.difficulty
      ? req.query.difficulty
          .split(",")
          .map(d => d.toLowerCase())
          .filter(d => ["easy", "medium", "hard"].includes(d))
      : [];

    let whereClauses = [];
    let params = [];
    let pIdx = 1; // Tracks parameter positioning ($1, $2, etc.)

    //  Search filter (Postgres uses ILIKE for case-insensitive LIKE)
    if (search) {
      whereClauses.push(`p.title ILIKE $${pIdx++}`);
      params.push(`%${search}%`);
    }

    //  Tag filter (AND)
    if (tags.length > 0) {
      const tagPlaceholders = tags.map(() => `$${pIdx++}`).join(",");
      whereClauses.push(`
        p.id IN (
          SELECT pt.problem_id
          FROM problem_topics pt
          WHERE pt.topic_id IN (${tagPlaceholders})
          GROUP BY pt.problem_id
          HAVING COUNT(DISTINCT pt.topic_id) = $${pIdx++}
        )
      `);
      params.push(...tags, tags.length);
    }

    //  Difficulty filter (OR for difficulty)
    if (difficulties.length > 0) {
      const diffPlaceholders = difficulties.map(() => `$${pIdx++}`).join(",");
      whereClauses.push(
        `LOWER(p.difficulty) IN (${diffPlaceholders})`
      );
      params.push(...difficulties);
    }

    const whereClause =
      whereClauses.length > 0
        ? `WHERE ${whereClauses.join(" AND ")}`
        : "";

    // Postgres requires explicit LIMIT and OFFSET parameters
    const mainParams = [...params, limit, offset];
    const { rows } = await db.query(
      `
      SELECT 
        p.id,
        p.title,
        p.difficulty,
        ps.acceptance_rate
      FROM problems p
      LEFT JOIN problem_stats ps
        ON ps.problem_id = p.id
      ${whereClause}
      ORDER BY p.id ASC
      LIMIT $${pIdx++} OFFSET $${pIdx++}
      `,
      mainParams
    );

    const { rows: countRows } = await db.query(
      `
      SELECT COUNT(*) AS total
      FROM problems p
      ${whereClause}
      `,
      params // Excludes limit and offset
    );
    
    // Postgres COUNT() returns a string (bigint), so we parse it
    const total = parseInt(countRows[0].total, 10); 

    res.json({ problems: rows, total, page, limit });
  } catch (err) {
    console.error("SEARCH ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


router.get("/topics", async (req, res) => {
  try {
    const { rows } = await db.query(
      `
      SELECT id, name
      FROM topics
      ORDER BY name ASC
      `
    );

    res.json(rows);
  } catch (err) {
    console.error("TOPICS FETCH ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;