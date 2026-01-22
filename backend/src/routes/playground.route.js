import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import axios from "axios";

const router = express.Router();
const LANGUAGE_MAP = {
  cpp: 54,
  java: 62,
  python: 71,
  javascript: 63,
};

router.post("/playground/run", authMiddleware, async (req, res) => {
  const { sourceCode, stdin, lang } = req.body;

  if (!LANGUAGE_MAP[lang]) {
    return res.status(400).json({ error: "Unsupported language" });
  }

  const JUDGE_URL = process.env.JUDGE0_URL;

  try {
    const judgeRes = await axios.post(JUDGE_URL, {
      source_code: sourceCode,
      language_id: LANGUAGE_MAP[lang],
      stdin: stdin,
      cpu_time_limit: 2,
      memory_limit: 128000,
    }, 
    {
      headers: {
        "X-RapidAPI-Key": process.env.JUDGE0_API_KEY,
        "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
       },
        }
  );

    // Extracting data for 'Output Stream' UI
    const { stdout, stderr, compile_output, time, memory } = judgeRes.data;

    res.status(200).json({
      output: stdout || stderr || compile_output, // Shows errors if code fails
      time: time,
      memory: memory,
    });

  } catch (err) {
    console.error("Execution Error:", err.message);
    res.status(500).json({ error: "Execution Engine Offline" });
  }
});

export default router;