import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEM_API_KEY);

export async function analyzeWithAI(code) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash"
  });

  const prompt = `
You are a competitive programming expert.
Analyze the following code like a CP contestant.

Rules:
- Ignore constant factors
- Give Big-O time and space complexity
- Dont get stuck in edge cases
- Be concise, no explanation
- If unsure, or code is strange return O(NA) for both time and space.
- Output strictly in JSON
- Output time and space complexity using LaTeX math notation
- Example: O(N^2), O(N \\log N), O(V * E)
- Do NOT include $ symbols


Format:
{
  "time_complexity": "...",
  "space_complexity": "..."
}

Code:
${code}
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // Sanitize gemini output
  const cleaned = text.replace(/```json|```/g, "").trim();

  return JSON.parse(cleaned);
}


export async function analyzeUserPerformance(details) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.25
    }
  });

  const prompt = `
You are an experienced technical interview coach.

Your role:
- Analyze structured performance data
- Suggest topics and problem-solving patterns to practice
- Focus on interview readiness
- Suggest common interview patterns based on user skills
- Commend the user if their skills are strong

Rules:
- Backend has already classified topics as weak / medium / strong
- Do NOT recommend specific problems
- Do NOT invent metrics or scores
- Do NOT mention internal rating systems
- Be concise and practical
- Output STRICTLY valid JSON
- NO markdown, NO explanations, NO extra text

User performance data:
${JSON.stringify(details, null, 2)}

Return JSON in EXACT format:
{
  "summary": string,
  "focus_topics": string[],
  "practice_advice": string[]
}
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  // Sanitize Gemini output (same pattern as analyzeWithAI)
  const cleaned = text.replace(/```json|```/g, "").trim();

  return JSON.parse(cleaned);
}
