import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import Editor from "@monaco-editor/react";
import { InlineMath } from "react-katex";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { lazy, Suspense } from "react";

const DiscussionTab = lazy(() =>
  import("../components/discussion/DiscussionTab")
);

const TABS = [
  "Problem",
  "Editorial",
  "Submissions",
  "Run",
  "Result",
  "Discussion",
];

export default function SolveProblem() {
  const { problemId } = useParams();
  const { user, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState("Problem");
  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState("");
  const [openSubmission, setOpenSubmission] = useState(null);
  const [runLoading, setRunLoading] = useState(false);
  const [runResults, setRunResults] = useState([]);
  const [runError, setRunError] = useState(null);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [solved, setSolved] = useState(false);
  // stores result of latest submission
  const [lastResult, setLastResult] = useState(null);
  const [complexity, setComplexity] = useState(null);

  // submission history
  const [submissions, setSubmissions] = useState([]);

  async function handleSubmit() {
    if (!user) return;

    try {
      setSubmitting(true);
      setSubmitError(null);

      const res = await api.post("/submissions", {
        problemId: Number(problemId),
        language,
        code,
      });

      const result = res.data;

      // save result for Result tab
      setLastResult(result);

      // push into submissions tab (local)
      setSubmissions((prev) => [
        {
          verdict: result.verdict,
          submitted_at: new Date().toISOString(),
          language,
        },
        ...prev,
      ]);

      // auto switch to Result tab
      setActiveTab("Result");
    } catch (err) {
      setSubmitError(err.response?.data?.error || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  const handleRun = async () => {
    if (!code.trim()) return;

    try {
      setRunLoading(true);
      setRunError(null);
      setRunResults([]);

      const res = await api.post("/run", {
        problemId,
        language,
        code,
      });

      setRunResults(res.data.samples);
      setActiveTab("Run");
    } catch (err) {
      setRunError(err.response?.data?.error || "Run failed");
    } finally {
      setRunLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    async function fetchSubmissions() {
      try {
        const res = await api.get(`/submissions/${problemId}`);
        setSubmissions(res.data);
      } catch (err) {
        console.error("Failed to load submissions");
      }
    }

    fetchSubmissions();
  }, [problemId, user]);

  useEffect(() => {
    if (!submissions) return;
    setSolved(submissions.some((s) => s.verdict === "AC"));
  }, [submissions]);

  // Fetch problem details
  useEffect(() => {
    async function fetchProblem() {
      try {
        setLoading(true);
        setError(null);

        const res = await api.get(
          `/problems/${problemId}`
        );

        setData(res.data);
        // console.log(data);
      } catch (err) {
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.error || "Problem not found");
        } else {
          setError("Unexpected error");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchProblem();
  }, [problemId]);

  async function evaluate_complexity(id) {
    try {
      const res = await api.get(`/submissions/analyze/${id}`);

      setComplexity({
        time: res.data.time_complexity,
        space: res.data.space_complexity,
        id: id,
      });
    } catch (err) {
      console.error("Couldn't evaluate complexity", err);
    }
  }

  // ---------- States ----------
  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-gray-500">
        Loading problem...
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  const { problem, content, stats, topics, samples } = data;

  return (
    <div className="w-full h-[200vh] md:h-screen bg-gray-50 flex flex-col md:flex-row">

      {/* ===== LEFT PANEL ===== */}
      <section className="
  w-full md:w-[45%]
  md:min-w-[420px]
  h-[100vh] md:h-full
  bg-white
  border-b md:border-b-0 md:border-r
  border-gray-200
  flex flex-col
">

        {/* Header */}
        <div className="px-6 pt-5 pb-3">
          <h1 className="text-2xl font-semibold text-gray-800">
            {problemId}. {problem.title}
          </h1>

          <div className="mt-2 flex gap-6 text-sm text-gray-600">
            <span>
              Difficulty:{" "}
              <span
                className={`font-semibold capitalize ${
                  problem?.difficulty === "easy"
                    ? "text-green-500"
                    : problem?.difficulty === "medium"
                    ? "text-yellow-500"
                    : "text-red-500"
                }`}
              >
                {problem?.difficulty}
              </span>
            </span>

            <span>
              Acceptance Rate:{" "}
              <span className="font-semibold">
                {stats.acceptance_rate ?? "—"}%
              </span>
            </span>

            {solved ? (
              <span className="flex items-center text-sm font-semibold">
                {" "}
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>{" "}
                Solved{" "}
              </span>
            ) : (
              <></>
            )}
          </div>

          <div className="mt-2 flex gap-2 flex-wrap">
            {topics.map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 rounded bg-gray-100 text-xs text-gray-600"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-gray-200 scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium rounded-t-lg transition relative
                ${
                  activeTab === tab
                    ? "text-cyan-600 bg-blue-100"
                    : "text-gray-600 hover:text-gray-900"
                }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-600"></div>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 text-sm text-gray-700">
          {/*Discussion*/}
          {activeTab === "Discussion" && (
            <Suspense
              fallback={
                <div className="py-10 text-center text-sm text-gray-500">
                  Loading discussions...
                </div>
              }
            >
              <DiscussionTab />
            </Suspense>
          )}

          {/* ===== PROBLEM ===== */}

          {activeTab === "Problem" && (
            <div className="space-y-6 leading-relaxed">
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-line text-gray-700">
                  {content.statement}
                </p>
              </div>

              {content.constraints && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <span className="w-1 h-5 bg-cyan-500 rounded"></span>
                    Constraints
                  </h3>
                  <pre className="bg-gray-50 border border-gray-200 p-4 rounded-lg text-xs whitespace-pre-line text-gray-700">
                    {content.constraints}
                  </pre>
                </div>
              )}

              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="w-1 h-5 bg-cyan-500 rounded"></span>
                  Input
                </h3>
                <pre className="bg-gray-50 border border-gray-200 p-4 rounded-lg text-xs whitespace-pre-line text-gray-700">
                  {content.input_format}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="w-1 h-5 bg-cyan-500 rounded"></span>
                  Output
                </h3>
                <pre className="bg-gray-50 border border-gray-200 p-4 rounded-lg text-xs whitespace-pre-line text-gray-700">
                  {content.output_format}
                </pre>
              </div>

              {samples.map((s, i) => (
                <div
                  key={i}
                  className="border border-gray-200 rounded-lg p-4 bg-white"
                >
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Sample #{i + 1}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-1">
                        Input
                      </div>
                      <pre className="bg-gray-50 border border-gray-200 p-3 rounded text-xs text-gray-700">
                        {s.input}
                      </pre>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-1">
                        Output
                      </div>
                      <pre className="bg-gray-50 border border-gray-200 p-3 rounded text-xs text-gray-700">
                        {s.output}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ===== EDITORIAL ===== */}
          {activeTab === "Editorial" && (
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-600 leading-relaxed">
                {data.content.editorial}
              </p>
            </div>
          )}
          {/* ===== RESULT ===== */}
          {activeTab === "Run" && (
            <div className="space-y-4">
              {runError && (
                <div className="p-4 text-sm bg-red-50 border border-red-200 text-red-700 rounded-lg">
                  {runError}
                </div>
              )}

              {runResults.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-500">
                    Run code to see sample outputs
                  </p>
                </div>
              ) : (
                runResults.map((r) => (
                  <div
                    key={r.sample}
                    className="border border-gray-200 rounded-lg p-4 bg-white"
                  >
                    <div className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="w-1 h-5 bg-cyan-500 rounded"></span>
                      Sample #{r.sample}
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">
                          Your Output
                        </p>
                        <pre className="bg-gray-900 text-green-400 p-3 rounded-lg text-xs font-mono">
                          {r.output || "(empty)"}
                        </pre>
                      </div>

                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-2">
                          Expected Output
                        </p>
                        <pre className="bg-gray-50 border border-gray-200 p-3 rounded-lg text-xs font-mono text-gray-700">
                          {r.expected}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "Result" && (
            <div className="space-y-4">
              {!lastResult ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-500">No submission yet</p>
                </div>
              ) : (
                <>
                  <div
                    className={`p-4 rounded-lg border-2 ${
                      lastResult.verdict === "AC"
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <p className="text-lg font-semibold">
                      Verdict:{" "}
                      <span
                        className={
                          lastResult.verdict === "AC"
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {lastResult.verdict}
                      </span>
                    </p>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4 bg-white">
                    <p className="font-semibold text-gray-900 mb-3">
                      Sample Testcases
                    </p>
                    <ul className="space-y-2">
                      {lastResult.samples.map((s) => (
                        <li
                          key={s.index}
                          className="flex items-center gap-2 text-sm"
                        >
                          <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></span>
                          Sample #{s.index}:{" "}
                          <span className="font-medium">{s.verdict}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {lastResult.hidden_failed && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {lastResult.hidden_failed}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ===== SUBMISSIONS ===== */}
          {activeTab === "Submissions" && (
            <div className="space-y-3">
              {submissions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-500">No submissions yet</p>
                </div>
              ) : (
                submissions.map((s, i) => (
                  <div
                    key={i}
                    onClick={() => setOpenSubmission(s)}
                    className="flex justify-between items-center border border-gray-200 px-4 py-3 rounded-lg cursor-pointer hover:border-cyan-300 hover:bg-cyan-50 transition"
                  >
                    <span className="font-medium text-gray-700">
                      #{submissions.length - i}
                    </span>

                    <span
                      className={`font-semibold px-3 py-1 rounded-full text-sm ${
                        s.verdict === "AC"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {s.verdict}
                    </span>

                    <span className="text-xs text-gray-500">
                      {new Date(s.submitted_at).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </section>
      {submitError && (
        <div className="bg-red-100 text-red-600 px-3 py-1 text-sm">
          {submitError}
        </div>
      )}

      {/* ===== RIGHT PANEL EDITOR ===== */}
      <section className="
  w-full md:flex-1
  h-[100vh] md:h-full
  flex flex-col
">

        <div className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600">Language</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value="cpp">C++17</option>
              <option value="java">Java</option>
              <option value="python">Python3</option>
              <option value="javascript">JavaScript</option>
            </select>
          </div>

          <div className="flex gap-3 items-center">
            {authLoading ? (
              <span className="text-xs text-gray-400">
                Checking authentication...
              </span>
            ) : user ? (
              <>
                <button
                  onClick={handleRun}
                  disabled={runLoading || submitting}
                  className="px-4 py-1 text-sm rounded border hover:bg-gray-100 disabled:opacity-50"
                >
                  {runLoading ? "Running..." : "Run"}
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={submitting || runLoading}
                  className="px-4 py-1 text-sm rounded bg-sky-500 text-white hover:bg-sky-600 disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Submit"}
                </button>
              </>
            ) : (
              <span className="text-sm text-gray-500">
                You must{" "}
                <a
                  href="/auth"
                  className="text-sky-500 font-medium hover:underline"
                >
                  login / signup
                </a>{" "}
                to run or submit code.
              </span>
            )}
          </div>
        </div>

        <div className="flex-1  text-gray-100 font-mono text-sm">
          {/* <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="// Write your solution here"
            spellCheck={false}
            className="w-full h-full bg-transparent outline-none resize-none"
          /> */}
          <div className="flex flex-col h-full w-full bg-gray-900">
            {/* Optional header */}
            {/* <div className="w-full h-6 bg-red-600 flex gap-2">
              <div
                onClick={() => setCode("")}
                className="w-8 h-full bg-blue-500 flex justify-center items-center"
              >
                r
              </div>
              <div
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(code);
                  } catch (err) {
                    console.log("failed to copy to clipboard");
                  }
                }}
                className="w-8 h-full bg-green-500 flex justify-center items-center"
              >
                cpy
              </div>
            </div> */}

            {/* Monaco Editor */}
            <div className="flex-1">
              <Editor
                height="100%"
                language={language}
                theme="vs-light"
                value={code}
                onChange={(value) => setCode(value ?? "")}
                options={{
                  fontSize: 14,
                  fontFamily: "monospace",
                  lineNumbers: "on",
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 4,
                  wordWrap: "on",
                  cursorBlinking: "smooth",
                  renderLineHighlight: "all",
                  smoothScrolling: true,
                }}
              />
            </div>
          </div>
        </div>
        {runError && (
          <div className="p-3 text-sm text-red-500 border-t">{runError}</div>
        )}
      </section>

      {/* ===== SUBMISSION MODAL ===== */}
      {openSubmission && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-[85%] max-w-5xl h-[85vh] rounded-xl shadow-xl overflow-hidden flex flex-col">
            {/* ===== Header ===== */}
            <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b bg-gray-50">
              <div className="flex items-center gap-3">
                <p className="font-semibold text-gray-800">Submission</p>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-semibold ${
                    openSubmission.verdict === "AC"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {openSubmission.verdict}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {openSubmission.verdict === "AC" && (
                  <button
                    onClick={() => evaluate_complexity(openSubmission.id)}
                    disabled={complexity?.id === openSubmission.id}
                    className="text-sm font-semibold px-3 py-1.5 rounded-md
                         bg-indigo-600 text-white hover:bg-indigo-700
                         disabled:opacity-60 disabled:cursor-not-allowed
                         transition"
                  >
                    {complexity?.id === openSubmission.id
                      ? "Analyzed"
                      : "Analyze Complexity"}
                  </button>
                )}

                <button
                  onClick={() => setOpenSubmission(null)}
                  className="text-gray-400 hover:text-gray-700 text-lg"
                >
                  ✕
                </button>
              </div>
            </div>

          
            <div
              className={`flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out
          ${
            complexity && complexity.id === openSubmission.id
              ? "max-h-32 opacity-100"
              : "max-h-0 opacity-0"
          }
        `}
            >
              <div className="px-5 py-3 border-b bg-indigo-50 text-sm">
                <p className="font-semibold text-indigo-700 mb-1">
                  Complexity Analysis
                </p>

                <div className="flex gap-6 text-gray-700">
                  <p>
                    <span className="font-medium">Time Complexity:</span>{" "}
                    <InlineMath math={complexity?.time} />
                  </p>

                  <p>
                    <span className="font-medium">Space Complexity:</span>{" "}
                    <InlineMath math={complexity?.space} />
                  </p>
                </div>

                <p className="text-xs text-gray-500 mt-1">
                  Estimated worst-case complexity (AI-generated)
                </p>
              </div>
            </div>

            {/* ===== Monaco Editor ===== */}
            <div className="flex-1 bg-[#1e1e1e]">
              <Editor
                height="100%"
                language={openSubmission.language || "cpp"}
                value={openSubmission.code}
                theme="vs-light"
                options={{
                  readOnly: true,
                  fontSize: 14,
                  fontFamily: "JetBrains Mono, monospace",
                  minimap: { enabled: false },
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  smoothScrolling: true,
                  wordWrap: "on",
                  renderLineHighlight: "all",
                  cursorStyle: "line",
                  contextmenu: false,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
