import React, { useEffect, useState, Suspense, lazy } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { api } from "../api/client";
import Editor from "@monaco-editor/react";
import { InlineMath } from "react-katex";
import ReactMarkdown from "react-markdown";
import "highlight.js/styles/atom-one-dark.css";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import "katex/dist/katex.min.css";

const DiscussionTab = lazy(
  () => import("../components/discussion/DiscussionTab"),
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
  const { theme } = useTheme();

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
  const [lastResult, setLastResult] = useState(null);
  const [complexity, setComplexity] = useState(null);
  const [submissions, setSubmissions] = useState([]);

  // --- Resizer State & Logic ---
  const [leftWidth, setLeftWidth] = useState(45); // Start at 45%
  const [isDragging, setIsDragging] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const newWidth = (e.clientX / window.innerWidth) * 100;
      if (newWidth > 20 && newWidth < 80) {
        setLeftWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    } else {
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
    };
  }, [isDragging]);
  // -----------------------------

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

      setLastResult(result);
      setSubmissions((prev) => [
        {
          verdict: result.verdict,
          submitted_at: new Date().toISOString(),
          language,
        },
        ...prev,
      ]);

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

  useEffect(() => {
    async function fetchProblem() {
      try {
        setLoading(true);
        setError(null);

        const res = await api.get(`/problems/${problemId}`);
        setData(res.data);
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

  if (loading) {
    return (
      <div className="w-full h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-[#f8f9fa] dark:bg-slate-950 transition-colors duration-300">
        <div className="relative w-12 h-12 flex items-center justify-center mb-4">
          <div className="absolute inset-0 rounded-full border-[3px] border-slate-200 dark:border-slate-800"></div>
          <div className="absolute inset-0 rounded-full border-[3px] border-blue-600 dark:border-blue-500 border-t-transparent border-r-transparent animate-[spin_0.8s_linear_infinite]"></div>
          <div className="absolute inset-0 rounded-full bg-blue-500/10 dark:bg-blue-500/20 blur-md"></div>
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          Loading problem workspace...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[calc(100vh-4rem)] flex items-center justify-center bg-[#f8f9fa] dark:bg-[#0a0c10] transition-colors">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 text-center max-w-md">
          <svg
            className="w-12 h-12 text-rose-500 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-slate-900 dark:text-white font-semibold text-lg">
            {error}
          </p>
        </div>
      </div>
    );
  }

  const { problem, content, stats, topics, samples } = data;

  return (
    // FIX: Added overflow-y-auto for mobile scrolling, and hidden for desktop to rely on internal pane scrolling
    <div className="w-full h-[calc(100dvh-4rem)] overflow-y-auto md:overflow-hidden bg-[#f8f9fa] dark:bg-[#0a0c10] flex flex-col md:flex-row font-sans transition-colors duration-300 relative">
      {/* Invisible overlay while dragging to prevent Monaco Editor from swallowing mouse events */}
      {isDragging && (
        <div className="fixed inset-0 z-[200] cursor-col-resize" />
      )}

      {/* ===== LEFT PANEL ===== */}
      {/* FIX: Changed h-[...] to min-h-[...] and added shrink-0 so it forces full height on mobile */}
      <section
        className="w-full min-h-[calc(100dvh-4rem)] shrink-0 md:shrink md:min-h-0 md:h-full bg-white dark:bg-slate-950 flex flex-col relative z-10 shadow-sm transition-colors overflow-hidden"
        style={isDesktop ? { width: `${leftWidth}%` } : {}}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-2 flex-shrink-0">
          <h1 className="text-2xl leading-tight font-bold text-slate-900 dark:text-white mb-3 tracking-tight">
            {problemId}. {problem.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span
              className={`px-2.5 py-0.5 rounded-md text-xs font-bold border uppercase tracking-wider ${
                problem?.difficulty === "easy"
                  ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                  : problem?.difficulty === "medium"
                    ? "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20"
                    : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20"
              }`}
            >
              {problem?.difficulty}
            </span>

            <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">
              Acceptance: {stats.acceptance_rate ?? "—"}%
            </span>

            {solved && (
              <span className="flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-500/20 uppercase tracking-wider">
                <svg
                  className="w-3 h-3 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Solved
              </span>
            )}
          </div>

          {topics?.length > 0 && (
            <div className="mt-3 flex gap-2 flex-wrap">
              {topics.map((t) => (
                <span
                  key={t}
                  className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300 transition-colors"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-800 mt-2 custom-scrollbar px-2 flex-shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-semibold transition-colors relative whitespace-nowrap
                ${
                  activeTab === tab
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-t-md"
                }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-500 rounded-t-sm"></div>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content - Scrolls internally */}
        <div className="flex-1 overflow-y-auto px-6 py-6 text-sm text-slate-700 dark:text-slate-300 custom-scrollbar">
          {/* Discussion */}
          {activeTab === "Discussion" && (
            <Suspense
              fallback={
                <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                  Loading discussions...
                </div>
              }
            >
              <DiscussionTab />
            </Suspense>
          )}

          {/* ===== PROBLEM ===== */}
          {activeTab === "Problem" && (
            <div className="space-y-8 leading-relaxed">
              <div className="prose prose-slate dark:prose-invert prose-sm max-w-none text-slate-800 dark:text-slate-200">
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {content.statement}
                </ReactMarkdown>
              </div>

              {content.constraints && (
                <div>
                  <h3 className="text-[15px] font-bold text-slate-900 dark:text-white mb-3">
                    Constraints
                  </h3>
                  <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 rounded-xl">
                    <div className="prose prose-sm dark:prose-invert max-w-none font-mono text-[13px] text-slate-700 dark:text-slate-300 whitespace-pre-line">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {content.constraints}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-[15px] font-bold text-slate-900 dark:text-white mb-3">
                    Input Format
                  </h3>
                  <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 rounded-xl h-full">
                    <pre className="text-[13px] whitespace-pre-line text-slate-700 dark:text-slate-300 font-sans">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {content.input_format}
                      </ReactMarkdown>
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-[15px] font-bold text-slate-900 dark:text-white mb-3">
                    Output Format
                  </h3>
                  <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 rounded-xl h-full">
                    <pre className="text-[13px] whitespace-pre-line text-slate-700 dark:text-slate-300 font-sans">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {content.output_format}
                      </ReactMarkdown>
                    </pre>
                  </div>
                </div>
              </div>

              <div className="space-y-6 pt-2">
                {samples.map((s, i) => (
                  <div
                    key={i}
                    className="border mt-4 border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 transition-colors"
                  >
                    <div className="bg-slate-50 dark:bg-slate-800/80 px-4 py-2 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                      <h3 className="text-[13px] font-bold text-slate-800 dark:text-slate-200">
                        Example {i + 1}
                      </h3>
                    </div>
                    <div className="flex flex-col md:flex-row">
                      <div className="flex-1 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 p-4 bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 mb-2">
                          Input
                        </div>
                        <pre className="text-[13px] font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                          {s.input}
                        </pre>
                      </div>
                      <div className="flex-1 p-4 bg-white dark:bg-slate-900">
                        <div className="text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 mb-2">
                          Output
                        </div>
                        <pre className="text-[13px] font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                          {s.output}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== EDITORIAL ===== */}
          {activeTab === "Editorial" && (
            <div className="prose prose-slate dark:prose-invert prose-sm max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex, rehypeHighlight]}
              >
                {data.content.editorial}
              </ReactMarkdown>
            </div>
          )}

          {/* ===== RUN ===== */}
          {activeTab === "Run" && (
            <div className="space-y-4">
              {runError && (
                <div className="p-4 text-sm bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 rounded-xl flex items-start gap-3">
                  <svg
                    className="w-5 h-5 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="font-medium">{runError}</span>
                </div>
              )}

              {runResults.length === 0 ? (
                <div className="text-center py-16 flex flex-col items-center">
                  <svg
                    className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">
                    Run your code to evaluate sample test cases
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {runResults.map((r) => (
                    <div
                      key={r.sample}
                      className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 transition-colors"
                    >
                      <div className="bg-slate-50 dark:bg-slate-800/80 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          Test Case {r.sample}
                        </span>
                      </div>
                      <div className="p-4 space-y-4">
                        <div>
                          <p className="text-[12px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                            Your Output
                          </p>
                          <pre className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-lg text-[13px] font-mono text-slate-800 dark:text-slate-200">
                            {r.output || "(empty)"}
                          </pre>
                        </div>
                        <div>
                          <p className="text-[12px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                            Expected Output
                          </p>
                          <pre className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-lg text-[13px] font-mono text-slate-800 dark:text-slate-200">
                            {r.expected}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== RESULT ===== */}
          {activeTab === "Result" && (
            <div className="space-y-4">
              {!lastResult ? (
                <div className="text-center py-16 flex flex-col items-center">
                  <svg
                    className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">
                    No active submission found.
                  </p>
                </div>
              ) : (
                <>
                  <div
                    className={`p-5 rounded-xl border flex items-center gap-4 ${
                      lastResult.verdict === "AC"
                        ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                        : "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400"
                    }`}
                  >
                    {lastResult.verdict === "AC" ? (
                      <svg
                        className="w-8 h-8"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-8 h-8"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    <div>
                      <h2 className="text-xl font-bold">
                        {lastResult.verdict === "AC"
                          ? "Accepted"
                          : "Wrong Answer / Error"}
                      </h2>
                      <p className="text-sm opacity-90 font-medium">
                        Verdict: {lastResult.verdict}
                      </p>
                    </div>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 overflow-hidden transition-colors">
                    <div className="bg-slate-50 dark:bg-slate-800/80 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                      <span className="font-bold text-slate-900 dark:text-white">
                        Test Cases Breakdown
                      </span>
                    </div>
                    <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                      {lastResult.samples.map((s) => (
                        <li
                          key={s.index}
                          className="px-4 py-3 flex items-center justify-between"
                        >
                          <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300">
                            Sample #{s.index}
                          </span>
                          <span
                            className={`text-[13px] font-bold ${s.verdict === "AC" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
                          >
                            {s.verdict}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {lastResult.hidden_failed && (
                    <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-rose-700 dark:text-rose-400 text-sm font-medium">
                      Hidden Test Failure: {lastResult.hidden_failed}
                    </div>
                  )}
                  {lastResult.verdict !== "AC" && lastResult.error && (
                    <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-rose-700 dark:text-rose-400 text-sm font-mono whitespace-pre-wrap">
                      {lastResult.error}
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
                <div className="text-center py-16 flex flex-col items-center">
                  <svg
                    className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">
                    No past submissions
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden transition-colors">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[12px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        <th className="px-4 py-3">ID</th>
                        <th className="px-4 py-3">Time Submitted</th>
                        <th className="px-4 py-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {submissions.map((s, i) => (
                        <tr
                          key={i}
                          onClick={() => setOpenSubmission(s)}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-3 text-[13px] font-medium text-blue-600 dark:text-blue-400">
                            #{submissions.length - i}
                          </td>
                          <td className="px-4 py-3 text-[13px] text-slate-600 dark:text-slate-400">
                            {new Date(s.submitted_at).toLocaleString(
                              undefined,
                              {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${
                                s.verdict === "AC"
                                  ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                                  : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20"
                              }`}
                            >
                              {s.verdict}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ===== DESKTOP DRAG RESIZER ===== */}
      <div
        className="hidden md:flex w-2 cursor-col-resize hover:bg-blue-500/50 dark:hover:bg-blue-500/50 active:bg-blue-500 transition-colors z-50 items-center justify-center flex-shrink-0 -mx-1"
        onMouseDown={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
      >
        <div className="w-[3px] h-8 bg-slate-300 dark:bg-slate-600 rounded-full" />
      </div>

      {/* ===== RIGHT PANEL EDITOR ===== */}
      {/* FIX: Changed h-[...] to min-h-[...] and added shrink-0 so it forces full height on mobile */}
      <section className="w-full min-h-[calc(100dvh-4rem)] shrink-0 md:shrink md:min-h-0 md:h-full md:flex-1 flex flex-col bg-white dark:bg-[#1e1e1e] overflow-hidden transition-colors border-t md:border-t-0 border-slate-200 dark:border-slate-800">
        {/* Editor Toolbar */}
        <div className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 shadow-sm z-10 flex-shrink-0 transition-colors">
          <div className="flex items-center gap-4">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer"
            >
              <option value="cpp">C++17</option>
              <option value="java">Java</option>
              <option value="python">Python 3</option>
              <option value="javascript">JavaScript</option>
            </select>
          </div>

          <div className="flex gap-3 items-center">
            {authLoading ? (
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Checking auth...
              </span>
            ) : user ? (
              <>
                <button
                  onClick={handleRun}
                  disabled={runLoading || submitting}
                  className="px-5 py-1.5 text-[13px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-all active:scale-95 shadow-sm"
                >
                  {runLoading ? "Running..." : "Run Code"}
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={submitting || runLoading}
                  className="px-5 py-1.5 text-[13px] font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 disabled:opacity-60 disabled:shadow-none transition-all active:scale-95 border border-transparent"
                >
                  {submitting ? "Submitting..." : "Submit"}
                </button>
              </>
            ) : (
              <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                Please{" "}
                <a
                  href="/auth"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  sign in
                </a>{" "}
                to submit.
              </span>
            )}
          </div>
        </div>

        {submitError && (
          <div className="bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 px-4 py-2.5 text-sm font-medium border-b border-rose-200 dark:border-rose-500/20 flex-shrink-0 flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {submitError}
          </div>
        )}

        {/* Monaco Editor Container - Scrolls internally */}
        <div className="flex-1 w-full relative">
          <Editor
            height="100%"
            language={language}
            theme={theme === "dark" ? "vs-dark" : "vs-light"}
            value={code}
            onChange={(value) => setCode(value ?? "")}
            options={{
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Roboto Mono', monospace",
              lineNumbers: "on",
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 4,
              wordWrap: "on",
              cursorBlinking: "smooth",
              renderLineHighlight: "all",
              smoothScrolling: true,
              padding: { top: 16 },
              overviewRulerBorder: false,
              hideCursorInOverviewRuler: true,
            }}
          />
        </div>
      </section>

      {/* ===== SUBMISSION MODAL ===== */}
      {openSubmission && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 flex items-center justify-center z-[150] backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 transition-colors">
            {/* Modal Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 transition-colors">
              <div className="flex items-center gap-4">
                <h2 className="text-[18px] font-bold text-slate-900 dark:text-white">
                  Submission Details
                </h2>
                <span
                  className={`text-[11px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider border ${
                    openSubmission.verdict === "AC"
                      ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                      : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20"
                  }`}
                >
                  {openSubmission.verdict}
                </span>
              </div>

              <div className="flex items-center gap-4">
                {openSubmission.verdict === "AC" && (
                  <button
                    onClick={() => evaluate_complexity(openSubmission.id)}
                    disabled={complexity?.id === openSubmission.id}
                    className="text-[13px] font-bold px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-60 transition-colors shadow-sm active:scale-95 flex items-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    {complexity?.id === openSubmission.id
                      ? "Analyzed"
                      : "AI Analysis"}
                  </button>
                )}

                <button
                  onClick={() => setOpenSubmission(null)}
                  className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* AI Complexity Dropdown */}
            <div
              className={`flex-shrink-0 overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                complexity && complexity.id === openSubmission.id
                  ? "max-h-40 opacity-100 border-b border-blue-100 dark:border-blue-900/30"
                  : "max-h-0 opacity-0"
              }`}
            >
              <div className="px-6 py-4 bg-blue-50 dark:bg-blue-500/10 text-sm flex flex-col gap-2 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <svg
                    className="w-5 h-5 text-blue-600 dark:text-blue-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                  <span className="font-bold tracking-tight text-blue-700 dark:text-blue-400">
                    AI Analysis Insight
                  </span>
                </div>

                <div className="flex flex-wrap gap-x-8 gap-y-3 pl-7">
                  <p className="flex items-center gap-2">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      Time:
                    </span>
                    <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm">
                      <InlineMath math={complexity?.time} />
                    </span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      Space:
                    </span>
                    <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm">
                      <InlineMath math={complexity?.space} />
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Readonly Editor */}
            <div className="flex-1 relative bg-[#1e1e1e]">
              <Editor
                height="100%"
                language={openSubmission.language || "cpp"}
                value={openSubmission.code}
                theme={theme === "dark" ? "vs-dark" : "vs-light"}
                options={{
                  readOnly: true,
                  fontSize: 14,
                  fontFamily: "'JetBrains Mono', 'Roboto Mono', monospace",
                  minimap: { enabled: false },
                  lineNumbers: "on",
                  scrollBeyondLastLine: false,
                  smoothScrolling: true,
                  wordWrap: "on",
                  renderLineHighlight: "all",
                  cursorStyle: "line",
                  contextmenu: false,
                  padding: { top: 16 },
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
