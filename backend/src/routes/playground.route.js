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
    // 1. Encode source code and stdin to Base64
    const codeBase64 = Buffer.from(sourceCode || "").toString("base64");
    const stdinBase64 = Buffer.from(stdin || "").toString("base64");

    const judgeRes = await axios.post(JUDGE_URL, {
      source_code: codeBase64,
      language_id: LANGUAGE_MAP[lang],
      stdin: stdinBase64,
      cpu_time_limit: 2,
      memory_limit: 128000,
    }, 
    {
      headers: {
        "X-RapidAPI-Key": process.env.JUDGE0_API_KEY,
        "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
       },
    });

    // 2. Extract Judge0 results
    const { stdout, stderr, compile_output, time, memory } = judgeRes.data;

    // 3. Helper function to decode Base64 strings from Judge0
    const decode = (str) => str ? Buffer.from(str, "base64").toString("utf-8") : "";

    // 4. Decode all potential output streams
    const decodedStdout = decode(stdout);
    const decodedStderr = decode(stderr);
    const decodedCompileOutput = decode(compile_output);

    res.status(200).json({
      output: decodedStdout || decodedStderr || decodedCompileOutput, 
      time: time,
      memory: memory,
    });

  } catch (err) {
    // Log the actual response data if available to help debug future 400s
    console.error("Execution Error:", err.response?.data || err.message);
    res.status(500).json({ error: "Execution Engine Offline" });
  }
});

export default router;