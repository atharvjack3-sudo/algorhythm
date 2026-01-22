import express from "express";
import fs from "fs/promises";
import path from "path";
import { db } from "../config/db.js"; // your mysql2 promise pool

const router = express.Router();

/**
 * POST /api/problems
 * Open route (admin protection later)
 */
// router.post("/add-problem", async (req, res) => {
//   const {
//     title,
//     difficulty,
//     statement,
//     constraints,
//     input_format,
//     output_format,
//     editorial,
//     topics,
//     sample_testcase,
//   } = req.body;

//   // ------------------ Validation ------------------
//   if (
//     !title ||
//     !difficulty ||
//     !statement ||
//     !input_format ||
//     !output_format ||
//     !Array.isArray(topics) ||
//     topics.length === 0 ||
//     !sample_testcase?.input ||
//     !sample_testcase?.output
//   ) {
//     return res.status(400).json({ error: "Invalid payload format" });
//   }

//   const conn = await db.getConnection();

//   try {
//     await conn.beginTransaction();

//     // 1️⃣ Insert problem
//     const [problemRes] = await conn.execute(
//       `INSERT INTO problems (title, difficulty)
//        VALUES (?, ?)`,
//       [title, difficulty]
//     );
//     const problemId = problemRes.insertId;

//     // 2️⃣ Insert problem content
//     await conn.execute(
//       `INSERT INTO problem_content
//        (problem_id, statement, constraints, input_format, output_format, editorial)
//        VALUES (?, ?, ?, ?, ?, ?)`,
//       [
//         problemId,
//         statement,
//         constraints ?? null,
//         input_format,
//         output_format,
//         editorial ?? null,
//       ]
//     );

//     // 3️⃣ Insert initial stats
//     await conn.execute(
//       `INSERT INTO problem_stats
//        (problem_id, total_submissions, total_accepted, acceptance_rate)
//        VALUES (?, 0, 0, NULL)`,
//       [problemId]
//     );

//     // 4️⃣ Ensure topics exist
//     for (const topic of topics) {
//       await conn.execute(
//         `INSERT IGNORE INTO topics (name) VALUES (?)`,
//         [topic]
//       );
//     }

//     // 5️⃣ Map problem ↔ topics
//     await conn.execute(
//       `INSERT INTO problem_topics (problem_id, topic_id)
//        SELECT ?, id FROM topics
//        WHERE name IN (${topics.map(() => "?").join(",")})`,
//       [problemId, ...topics]
//     );

//     // 6️⃣ Write sample testcase to filesystem
//     const testcaseDir = path.join(
//       process.cwd(),
//       "testcases",
//       `problem_${problemId}`
//     );

//     await fs.mkdir(testcaseDir, { recursive: true });

//     const inputFile = path.join(testcaseDir, "input1.txt");
//     const outputFile = path.join(testcaseDir, "output1.txt");

//     await fs.writeFile(inputFile, sample_testcase.input);
//     await fs.writeFile(outputFile, sample_testcase.output);

//     // 7️⃣ Insert testcase path
//     await conn.execute(
//       `INSERT INTO problem_testcases
//        (problem_id, input_path, output_path, is_sample)
//        VALUES (?, ?, ?, TRUE)`,
//       [
//         problemId,
//         `/testcases/problem_${problemId}/input1.txt`,
//         `/testcases/problem_${problemId}/output1.txt`,
//       ]
//     );
//     const columnMap = {
//       easy: "easy_problems",
//       medium: "medium_problems",
//       hard: "hard_problems",
//     };

//     const key = difficulty.toLowerCase();
//     const column = columnMap[key];

//     if (!column) {
//       throw new Error("Invalid difficulty");
//     }

//     await conn.execute(`
//       UPDATE platform_stats
//       SET ${column} = ${column} + 1
//     `);


//     await conn.commit();

//     res.status(201).json({
//       message: "Problem created successfully",
//       problem_id: problemId,
//     });
//   } catch (err) {
//     await conn.rollback();
//     console.error("Problem insertion failed:", err);
//     res.status(500).json({ error: "Failed to create problem" });
//   } finally {
//     conn.release();
//   }
// });

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

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    //  Insert problem
    const [problemRes] = await conn.execute(
      `INSERT INTO problems (title, difficulty)
       VALUES (?, ?)`,
      [title, difficulty]
    );
    const problemId = problemRes.insertId;

    //  Insert problem content
    await conn.execute(
      `INSERT INTO problem_content
       (problem_id, statement, constraints, input_format, output_format, editorial)
       VALUES (?, ?, ?, ?, ?, ?)`,
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
    await conn.execute(
      `INSERT INTO problem_stats
       (problem_id, total_submissions, total_accepted, acceptance_rate)
       VALUES (?, 0, 0, NULL)`,
      [problemId]
    );

    //  Ensure topics exist
    for (const topic of topics) {
      await conn.execute(
        `INSERT IGNORE INTO topics (name) VALUES (?)`,
        [topic]
      );
    }

    //  Map problem ↔ topics
    await conn.execute(
      `INSERT INTO problem_topics (problem_id, topic_id)
       SELECT ?, id FROM topics
       WHERE name IN (${topics.map(() => "?").join(",")})`,
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

      await conn.execute(
        `INSERT INTO problem_testcases
         (problem_id, input_path, output_path, is_sample)
         VALUES (?, ?, ?, ?)`,
        [
          problemId,
          `/testcases/problem_${problemId}/input${tcIndex}.txt`,
          `/testcases/problem_${problemId}/output${tcIndex}.txt`,
          isSample,
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

    await conn.execute(`
      UPDATE platform_stats
      SET ${column} = ${column} + 1
    `);

    await conn.commit();

    res.status(201).json({
      message: "Problem created successfully",
      problem_id: problemId,
      samples_added: samples.length,
      hidden_added: hidden.length,
    });
  } catch (err) {
    await conn.rollback();
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
    const [[problem]] = await db.execute(
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
      WHERE p.id = ?
      `,
      [problemId]
    );

    if (!problem) {
      return res.status(404).json({ error: "Problem not found" });
    }

    //  Fetch topics
    const [topicRows] = await db.execute(
      `
      SELECT t.name
      FROM problem_topics pt
      JOIN topics t ON t.id = pt.topic_id
      WHERE pt.problem_id = ?
      `,
      [problemId]
    );

    const topics = topicRows.map((t) => t.name);

    //  Fetch sample testcases (paths)
    const [sampleRows] = await db.execute(
      `
      SELECT input_path, output_path
      FROM problem_testcases
      WHERE problem_id = ? AND is_sample = TRUE
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

    //  Search filter
    if (search) {
      whereClauses.push("p.title LIKE ?");
      params.push(`%${search}%`);
    }

    //  Tag filter (AND)
    if (tags.length > 0) {
      whereClauses.push(`
        p.id IN (
          SELECT pt.problem_id
          FROM problem_topics pt
          WHERE pt.topic_id IN (${tags.map(() => "?").join(",")})
          GROUP BY pt.problem_id
          HAVING COUNT(DISTINCT pt.topic_id) = ?
        )
      `);
      params.push(...tags, tags.length);
    }

    //  Difficulty filter (OR for difficulty)
    if (difficulties.length > 0) {
      whereClauses.push(
        `LOWER(p.difficulty) IN (${difficulties.map(() => "?").join(",")})`
      );
      params.push(...difficulties);
    }

    const whereClause =
      whereClauses.length > 0
        ? `WHERE ${whereClauses.join(" AND ")}`
        : "";

    const [rows] = await db.query(
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
      LIMIT ?, ?
      `,
      [...params, offset, limit]
    );

    const [[{ total }]] = await db.query(
      `
      SELECT COUNT(*) AS total
      FROM problems p
      ${whereClause}
      `,
      params
    );

    res.json({ problems: rows, total, page, limit });
  } catch (err) {
    console.error("SEARCH ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


router.get("/topics", async (req, res) => {
  try {
    const [rows] = await db.query(
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
