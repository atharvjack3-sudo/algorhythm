import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { api } from "../api/client";
import Editor from "@monaco-editor/react";

// Markdown Imports
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import CustomTC from "../components/CustomTC";
import darkAlgoTheme from "../themes/Dark-Algo.json";
import "highlight.js/styles/atom-one-dark.css";
import "katex/dist/katex.min.css";


const TABS = ["Problem", "Submissions", "Run", "Result"];


/* =========================
   MARKDOWN RENDERER
========================= */
function MarkdownRenderer({ content, className = "" }) {
  if (!content) return null;

  return (
    <div
      className={`
        cf-markdown font-sans text-[14px] leading-relaxed text-slate-800 dark:text-slate-300
        prose dark:prose-invert max-w-none
        prose-headings:font-sans prose-headings:font-bold prose-headings:tracking-tight
        prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
        prose-a:text-blue-600 dark:prose-a:text-blue-400
        
        /* 1. Target INLINE code only */
        [&_:not(pre)>code]:font-mono [&_:not(pre)>code]:text-[13px] [&_:not(pre)>code]:bg-slate-100 dark:[&_:not(pre)>code]:bg-slate-800 [&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:rounded-[3px]
        
        /* 2. Container PRE styles */
        prose-pre:p-0 prose-pre:bg-[#282c34] prose-pre:border prose-pre:border-slate-700 dark:prose-pre:border-slate-800 prose-pre:rounded-[5px]
        
        /* 3. Force highlight.js CODE block to use JetBrains Mono, 13px size, and better line height */
        [&_pre_code.hljs]:!bg-transparent [&_pre_code.hljs]:p-4 [&_pre_code.hljs]:!text-[#abb2bf] [&_pre_code.hljs]:!font-mono [&_pre_code.hljs]:!text-[13px] [&_pre_code.hljs]:!leading-[1.6]
        
        ${className}
      `}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeHighlight]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default function ContestSolveProblem() {
  const { contestId, problemId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("Problem");
  const [data, setData] = useState(null);
  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState("");

  const [runLoading, setRunLoading] = useState(false);
  const [runResults, setRunResults] = useState([]);
  const [runError, setRunError] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [submissions, setSubmissions] = useState([]);

  const [viewCode, setViewCode] = useState(null);
  const [isEnded, setIsEnded] = useState(false);
  const monacoRef = useRef(null);

  /* =========================
     RESIZER LOGIC 
  ========================= */
  const [leftWidth, setLeftWidth] = useState(45); // Start at 45%
  const [isDragging, setIsDragging] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  const formatCFDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = months[d.getMonth()];
    const day = String(d.getDate()).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const mins = String(d.getMinutes()).padStart(2, "0");
    return `${month}/${day}/${year} ${hours}:${mins}`;
  };

  /* =========================
      Logic & Backend Wiring
  ========================= */
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    async function loadProblem() {
      const cacheKey = `contest_${contestId}_problem_${problemId}_data`;

      const setProblemState = (problemData) => {
        setData(problemData);
        // check if the contest has ended based on current local time
        const end = new Date(problemData.contest.end_time).getTime();
        setIsEnded(Date.now() > end);
      };

      // Check Session Cache
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setProblemState(JSON.parse(cached));
        return;
      }

      // Network Call if no cache
      try {
        const res = await api.get(
          `/contests/${contestId}/problems/${problemId}`,
        );
        sessionStorage.setItem(cacheKey, JSON.stringify(res.data));
        setProblemState(res.data);
      } catch (err) {
        // Redirect to contest page if not started or not registered
        if (
          err.response?.status === 403 ||
          err.response?.status === 404 ||
          err.response?.data?.code === "NOT_STARTED"
        ) {
          navigate(`/contests`);
        } else {
          console.error("Problem fetch failed");
        }
      }
    }
    if (user) loadProblem();
  }, [contestId, problemId, user, navigate]);

  function handleBeforeMount(monaco) {
    monacoRef.current = monaco;
    monaco.editor.defineTheme("Dark-Algo", darkAlgoTheme);
  }

  async function loadSubmissions() {
    try {
      const res = await api.get(`/contests/${contestId}/my-submissions`);
      setSubmissions(res.data);
    } catch (err) {
      console.error("Logs fetch failed");
    }
  }

  useEffect(() => {
    if (user) loadSubmissions();
  }, [contestId, problemId, user]);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const newWidth = (e.clientX / window.innerWidth) * 100;
      if (newWidth > 20 && newWidth < 67) {
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

  const handleRun = async () => {
    if (!code.trim()) return;
    try {
      setRunLoading(true);
      setRunError(null);
      const res = await api.post("/run", { problemId, language, code });
      setRunResults(res.data.samples);
      setActiveTab("Run");
    } catch (err) {
      setRunError(err.response?.data?.error || "Run failed");
    } finally {
      setRunLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return navigate("/auth");
    try {
      setSubmitting(true);
      const res = await api.post(`/contests/${contestId}/submit`, {
        problemId,
        language,
        code,
      });
      setLastResult(res.data);
      if (res.data.samples) setRunResults(res.data.samples);

      // Invalidate the global dashboard cache so the user's solved stats update immediately!
      sessionStorage.removeItem(`dashboard_data_${user.id}`);

      await loadSubmissions();
      setActiveTab("Result");
    } catch (err) {
      console.error("Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!data || authLoading) {
    return (
      <div className="w-full h-[calc(100vh-56px)] flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tracking-[0.15em] animate-pulse uppercase">
          LOADING WORKSPACE...
        </span>
      </div>
    );
  }

  const { problem, content, samples } = data;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .font-sans { font-family: 'DM Sans', sans-serif; }
        
        .custom-scrollbar::-webkit-scrollbar { height: 4px; width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 2px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
      `}</style>

      <div className="w-full h-[calc(100dvh-56px)] overflow-y-auto md:overflow-hidden bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row font-sans transition-colors duration-200 relative">
        {isDragging && (
          <div className="fixed inset-0 z-[200] cursor-col-resize" />
        )}

        {/* =========================
            LEFT PANEL
        ========================= */}
        <section
          className="w-full min-h-[calc(100dvh-56px)] shrink-0 md:shrink md:min-h-0 md:h-full bg-white dark:bg-slate-950 flex flex-col relative z-10 transition-colors overflow-hidden border-r border-slate-200 dark:border-slate-800"
          style={isDesktop ? { width: `${leftWidth}%` } : {}}
        >
          {/* Header */}
          <div className="px-5 pt-6 pb-2 flex-shrink-0">
            <h1 className="font-sans text-2xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight flex items-center justify-between">
              <span>
                {problem.index}. {problem.title}
              </span>
            </h1>

            <div className="flex flex-wrap items-center gap-3">
              <span className="px-2 py-0.5 rounded-[3px] text-slate-600 dark:text-slate-400 font-mono text-[10px] font-bold uppercase tracking-wider ">
                Time Limit: 2.0s
              </span>
              <span className="px-2 py-0.5 rounded-[3px] text-slate-600 dark:text-slate-400 font-mono text-[10px] font-bold uppercase tracking-wider ">
                Memory Limit: 256MB
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex justify-between overflow-x-auto overflow-y-hidden border-b border-slate-200 dark:border-slate-800 mt-2 custom-scrollbar px-2 flex-shrink-0 bg-slate-50 dark:bg-slate-950/50">
            <div className="flex">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 font-sans text-[11px] cursor-pointer font-semibold uppercase tracking-[0.08em] transition-all relative whitespace-nowrap border-b-[3px] top-[1px]
                    ${
                      activeTab === tab
                        ? "text-orange-600 dark:text-orange-500 border-orange-600 dark:border-orange-500"
                        : "text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <button
              onClick={() => navigate(`/contests/${contestId}/problems`)}
              className="px-4 py-2.5 font-mono text-[10px] cursor-pointer font-bold uppercase tracking-[0.1em] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors bg-transparent border-none"
            >
              Back
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto px-5 py-6 text-[14px] text-slate-800 dark:text-slate-200 custom-scrollbar bg-white dark:bg-slate-950">
            {/* ===== PROBLEM ===== */}
            {activeTab === "Problem" && (
              <div className="flex flex-col gap-8">
                <MarkdownRenderer content={content.statement} />

                {content.constraints && (
                  <div>
                    <h3 className="font-sans text-[15px] font-bold text-slate-900 dark:text-white mb-2">
                      Constraints
                    </h3>
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-md">
                      <MarkdownRenderer
                        content={content.constraints}
                        className="font-mono text-[12px] whitespace-pre-line"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {content.input_format && (
                    <div className="flex flex-col h-full">
                      <h3 className="font-sans text-[15px] font-bold text-slate-900 dark:text-white mb-2">
                        Input Format
                      </h3>
                      <div className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-md">
                        <MarkdownRenderer
                          content={content.input_format}
                          className="text-[13px] whitespace-pre-line"
                        />
                      </div>
                    </div>
                  )}

                  {content.output_format && (
                    <div className="flex flex-col h-full">
                      <h3 className="font-sans text-[15px] font-bold text-slate-900 dark:text-white mb-2">
                        Output Format
                      </h3>
                      <div className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-md">
                        <MarkdownRenderer
                          content={content.output_format}
                          className="text-[13px] whitespace-pre-line"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-5 pt-2">
                  <h3 className="font-sans text-[15px] font-bold text-slate-900 dark:text-white mb-0">
                    Examples
                  </h3>
                  {samples.map((s, i) => (
                    <div
                      key={i}
                      className="border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden shadow-sm"
                    >
                      <div className="bg-slate-100 dark:bg-slate-900 px-4 py-2 border-b border-slate-200 dark:border-slate-800">
                        <span className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                          Example {i + 1}
                        </span>
                      </div>
                      <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
                        <div className="flex-1 bg-slate-50 dark:bg-slate-950/50">
                          <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 font-mono text-[9px] font-bold text-slate-500 uppercase tracking-[0.1em]">
                            Input
                          </div>
                          <pre className="p-4 m-0 font-mono text-[13px] text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                            {s.input}
                          </pre>
                        </div>
                        <div className="flex-1 bg-white dark:bg-slate-950">
                          <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 font-mono text-[9px] font-bold text-slate-500 uppercase tracking-[0.1em]">
                            Output
                          </div>
                          <pre className="p-4 m-0 font-mono text-[13px] text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                            {s.output}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===== RUN ===== */}
            <div className={`${activeTab === "Run" ? "block" : "hidden"}`}>
              <div className="flex flex-col gap-5">
                {runLoading ? (
                  <div className="w-full py-16 flex items-center justify-center">
                    <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tracking-[0.15em] animate-pulse uppercase">
                      Executing code...
                    </span>
                  </div>
                ) : (
                  <>
                    {runError && (
                      <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-[3px] shadow-sm">
                        <div className="font-mono text-[11px] font-bold text-red-600 dark:text-red-400 tracking-[0.08em] uppercase mb-2">
                          Runtime / Compilation Error
                        </div>
                        <pre className="font-mono text-[11px] text-red-500 whitespace-pre-wrap">
                          {runError}
                        </pre>
                      </div>
                    )}

                    {runResults.length === 0 ? (
                      <div className="px-4 py-16 text-center border border-slate-200 dark:border-slate-800 rounded-md bg-slate-50 dark:bg-slate-900 shadow-sm font-sans font-semibold text-[12px] text-slate-500 dark:text-slate-400 ">
                        Run your code to evaluate sample test cases.
                      </div>
                    ) : (
                      <div className="flex flex-col gap-5">
                        {runResults.map((r, i) => {
                          const isMatch = r.verdict === "AC";
                          const isWA = r.verdict === "WA";

                          const verdictDisplay = isMatch
                            ? "Matched"
                            : isWA
                              ? "Mismatch"
                              : r.verdict;

                          return (
                            <div
                              key={i}
                              className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden shadow-sm flex flex-col"
                            >
                              <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                                <div className="flex items-center gap-3">
                                  <span className="font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-600 dark:text-slate-300 uppercase">
                                    Test Case {r.sample || r.index || i + 1}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded-[3px] font-mono text-[10px] font-bold tracking-wide uppercase ${
                                      isMatch
                                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                        : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                                    }`}
                                  >
                                    {verdictDisplay}
                                  </span>
                                </div>

                                <div className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 tracking-wider">
                                  {r.time !== undefined
                                    ? `${r.time} ms`
                                    : "- ms"}
                                  <span className="mx-2 text-slate-300 dark:text-slate-700 font-normal">
                                    |
                                  </span>
                                  {r.memory !== undefined
                                    ? `${r.memory} KB`
                                    : "- KB"}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
                                <div>
                                  <div className="px-4 py-2 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 font-mono text-[9px] font-semibold text-slate-500 uppercase tracking-[0.1em]">
                                    Your Output
                                  </div>
                                  <pre
                                    className={`p-4 m-0 font-mono text-[12px] whitespace-pre-wrap ${isMatch ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                                  >
                                    {r.output || (
                                      <span className="italic text-slate-400 dark:text-slate-600">
                                        No output
                                      </span>
                                    )}
                                  </pre>
                                </div>
                                <div>
                                  <div className="px-4 py-2 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 font-mono text-[9px] font-semibold text-slate-500 uppercase tracking-[0.1em]">
                                    Expected Output
                                  </div>
                                  <pre className="p-4 m-0 font-mono text-[12px] text-slate-800 dark:text-slate-300 whitespace-pre-wrap">
                                    {r.expected}
                                  </pre>
                                </div>
                              </div>

                              {r.error && (
                                <div className="border-t border-slate-200 dark:border-slate-800">
                                  <div className="px-4 py-2 bg-red-50/50 dark:bg-red-950/20 border-b border-slate-200 dark:border-slate-800 font-mono text-[9px] font-semibold text-red-500 uppercase tracking-[0.1em]">
                                    Error / Stderr
                                  </div>
                                  <pre className="p-4 m-0 font-mono text-[12px] text-red-600 dark:text-red-400 whitespace-pre-wrap bg-red-50/30 dark:bg-red-950/10 max-h-48 overflow-y-auto">
                                    {r.error}
                                  </pre>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}

                <div className={`${runLoading ? "hidden" : "block"}`}>
                  <CustomTC
                    setRunLoading={setRunLoading}
                    lang={language}
                    code={code}
                  />
                </div>
              </div>
            </div>

            {/* ===== RESULT ===== */}
            {activeTab === "Result" && (
              <div className="flex flex-col gap-5">
                {submitting ? (
                  <div className="w-full py-16 flex items-center justify-center">
                    <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tracking-[0.15em] animate-pulse uppercase">
                      Judging submission...
                    </span>
                  </div>
                ) : (
                  <>
                    {!lastResult ? (
                      <div className="px-4 py-16 text-center border border-slate-200 dark:border-slate-800 rounded-md bg-slate-50 dark:bg-slate-900 shadow-sm font-sans text-[12px] text-slate-500 dark:text-slate-400 font-semibold">
                        Submit code to view final verdict.
                      </div>
                    ) : (
                      <>
                        <div
                          className={`p-5 rounded-md border shadow-sm ${
                            lastResult.verdict === "AC" ||
                            lastResult.verdict === "Accepted"
                              ? "bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900/50"
                              : "bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50"
                          }`}
                        >
                          <h3
                            className={`font-mono text-[18px] font-bold tracking-wide uppercase ${lastResult.verdict === "AC" || lastResult.verdict === "Accepted" ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"}`}
                          >
                            {lastResult.verdict === "AC"
                              ? "Accepted"
                              : lastResult.verdict}
                          </h3>
                          <p className="font-mono text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
                            Tested against all system cases
                          </p>
                        </div>

                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden shadow-sm">
                          <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
                            <span className="font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase">
                              Test Cases Breakdown
                            </span>
                          </div>
                          <div className="w-full overflow-x-auto custom-scrollbar">
                            <table className="w-full border-collapse whitespace-nowrap text-left">
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                {lastResult.samples &&
                                  lastResult.samples.map((s) => (
                                    <tr
                                      key={s.index}
                                      className="border-b border-slate-200 dark:border-slate-800 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                    >
                                      <td className="px-4 py-3 font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                                        Test #{s.index}
                                      </td>
                                      <td className="px-4 py-3 text-right">
                                        <span
                                          className={`inline-flex px-2 py-0.5 rounded-[3px] font-mono text-[10px] font-semibold tracking-wide uppercase ${
                                            s.verdict === "AC" ||
                                            s.verdict === "Accepted"
                                              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                              : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                                          }`}
                                        >
                                          {s.verdict === "AC"
                                            ? "Accepted"
                                            : s.verdict}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {lastResult.verdict !== "AC" && lastResult.error && (
                          <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-md shadow-sm">
                            <div className="font-mono text-[11px] font-bold text-red-600 dark:text-red-400 tracking-[0.08em] uppercase mb-2">
                              Error Details
                            </div>
                            <pre className="font-mono text-[11px] text-red-500 whitespace-pre-wrap">
                              {lastResult.error}
                            </pre>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ===== SUBMISSIONS ===== */}
            {activeTab === "Submissions" && (
              <div className="flex flex-col gap-4">
                {submissions.length === 0 ? (
                  <div className="px-4 py-16 text-center border border-slate-200 dark:border-slate-800 rounded-md bg-slate-50 dark:bg-slate-900 shadow-sm font-sans text-[12px] font-semibold text-slate-500 dark:text-slate-400">
                    You haven't submitted anything yet in the contest.
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
                    <div className="w-full overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
                          <tr>
                            <th className="px-5 py-3 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase w-20">
                              ID
                            </th>
                            <th className="px-5 py-3 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase">
                              When
                            </th>
                            <th className="px-5 py-3 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase">
                              Problem
                            </th>
                            <th className="px-5 py-3 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase text-center">
                              Lang
                            </th>
                            <th className="px-5 py-3 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase text-center">
                              Verdict
                            </th>
                            <th className="px-5 py-3 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase text-right">
                              Time
                            </th>
                            <th className="px-5 py-3 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase text-right">
                              Memory
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                          {submissions.map((s, i) => (
                            <tr
                              key={s.submission_id || i}
                              className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                            >
                              <td className="px-5 py-3">
                                <span
                                  className="font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-500 cursor-pointer transition-colors"
                                  onClick={() => setViewCode(s)}
                                >
                                  #{s.submission_id}
                                </span>
                              </td>
                              <td className="px-5 py-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                                {formatCFDate(s.submitted_at)}
                              </td>
                              <td className="px-5 py-3">
                                <span
                                  className="font-sans text-[13px] font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 cursor-pointer transition-colors"
                                  onClick={() =>
                                    navigate(
                                      `/contests/${contestId}/solve/${s.problem_id}`,
                                    )
                                  }
                                >
                                  {s.problem_index} - {s.problem_title}
                                </span>
                              </td>
                              <td className="text-center text-[11px] font-mono font-extralight text-gray-600 dark:text-slate-400">
                                {s.language}
                              </td>
                              <td className="px-5 py-3 text-center">
                                <span
                                  className={`inline-flex px-2 py-0.5 rounded-[3px] font-mono text-[10px] font-bold tracking-wide uppercase ${
                                    s.verdict === "AC" ||
                                    s.verdict === "Accepted"
                                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                      : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                                  }`}
                                >
                                  {s.verdict === "AC" ? "Accepted" : s.verdict}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-right font-mono text-[11px] text-slate-600 dark:text-slate-400">
                                {s.time_ms !== null && s.time_ms !== undefined
                                  ? `${s.time_ms} ms`
                                  : "0 ms"}
                              </td>
                              <td className="px-5 py-3 text-right font-mono text-[11px] text-slate-600 dark:text-slate-400">
                                {s.memory_kb !== null &&
                                s.memory_kb !== undefined
                                  ? `${s.memory_kb} KB`
                                  : "0 KB"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ===== DESKTOP DRAG RESIZER ===== */}
        <div
          className="hidden md:flex w-[1px] bg-slate-200 dark:bg-slate-800 cursor-col-resize hover:bg-orange-500 dark:hover:bg-gray-300 transition-colors z-50 items-center justify-center flex-shrink-0 relative group"
          onMouseDown={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
        >
          <div className="absolute inset-y-0 -left-1 -right-1 z-10" />
        </div>

        {/* ===== RIGHT PANEL EDITOR ===== */}
        <section className="w-full min-h-[calc(100dvh-56px)] shrink-0 md:shrink md:min-h-0 md:h-full md:flex-1 flex flex-col bg-white dark:bg-[#1e1e1e] overflow-hidden transition-colors border-t md:border-t-0 border-slate-200 dark:border-slate-800">
          {/* Editor Toolbar */}
          <div className="min-h-12 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between px-4 z-10 gap-4 flex-shrink-0 transition-colors">
            <div className="flex items-center gap-2">
              <label className="font-sans text-[12px] font-semibold text-slate-500 dark:text-slate-400 tracking-wide hidden sm:block">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-[3px] px-2 py-1 text-[11px] font-sans outline-none focus:border-orange-500 transition-colors cursor-pointer tracking-widest"
              >
                <option value="cpp">C++20</option>
                <option value="java">Java</option>
                <option value="python">Python 3</option>
                <option value="javascript">JavaScript</option>
              </select>
            </div>

            <div className="flex gap-2.5 items-center">
              {authLoading ? (
                <span className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-widest animate-pulse">
                  AUTH...
                </span>
              ) : user ? (
                <>
                  <button
                    onClick={handleRun}
                    disabled={runLoading || submitting}
                    className="text-[12px] cursor-pointer font-semibold tracking-[0.06em] rounded-[3px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 px-4 py-2 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {runLoading ? "Running..." : "Run Code"}
                  </button>

                  <button
                    onClick={handleSubmit}
                    disabled={submitting || runLoading || isEnded}
                    className="text-[12px] font-bold tracking-[0.12em] rounded-[3px] transition-opacity duration-150 cursor-pointer bg-orange-500 text-white border-none px-6 py-2 hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Submitting..." : "Submit"}
                  </button>
                </>
              ) : (
                <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  <a
                    href="/auth"
                    className="text-blue-600 dark:text-blue-400 hover:underline font-bold"
                  >
                    SIGN IN
                  </a>{" "}
                  TO SUBMIT
                </span>
              )}
            </div>
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-1 w-full relative">
            <Editor
              height="100%"
              beforeMount={handleBeforeMount}
              theme={theme === "light" ? "light" : "Dark-Algo"}
              language={language}
              defaultValue={code}
              onChange={(value) => setCode(value ?? "")}
              options={{
                fontSize: 13,
                fontFamily: "'JetBrains Mono', monospace",
                lineNumbers: "on",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                quickSuggestions: false,
                parameterHints: { enabled: false },
                suggestOnTriggerCharacters: false,
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

          {/* Bottom Info Bar */}
          <div className="dark:bg-slate-950 w-full py-1.5 px-4 bg-white text-xs dark:text-slate-400 text-slate-700 font-sans flex justify-center items-center border-t border-white dark:border-slate-950">
            {false && isEnded ? (
              <span className="font-mono text-[10px] font-bold text-red-500 tracking-[0.08em] uppercase border border-red-500/30 bg-red-500/10 px-2 py-0.5 rounded-[3px]">
                Contest Concluded (Submissions Closed)
              </span>
            ) : (
              <div className="w-full flex justify-between pl-2 items-center">
                <span>
                  <span className="mr-5">
                    Run Code: ⌘
                    <span className="font-semibold ml-0.5">
                      {" "}
                      + Shift + Enter
                    </span>
                  </span>
                  <span>
                    Submit Code: ⌘
                    <span className="font-semibold ml-0.5"> + Enter</span>
                  </span>
                </span>
                <span className="md:block hidden font-sans text-xs">
                  Local Autosave: Disabled
                </span>
              </div>
            )}
          </div>
        </section>

        {/* ===== SUBMISSION CODE VIEW MODAL ===== */}
        {viewCode && (
          <div className="fixed inset-0 bg-slate-900/80 z-[150] backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-950 w-full max-w-4xl h-[85vh] rounded-md shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 transition-colors">
              {/* Modal Header */}
              <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    SUBMISSION #{viewCode.submission_id} ·{" "}
                    {viewCode.problem_index} · {viewCode.language}
                  </div>
                </div>
                <button
                  onClick={() => setViewCode(null)}
                  className="font-mono text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer bg-transparent border-none p-1"
                >
                  CLOSE [X]
                </button>
              </div>

              {/* Readonly Editor */}
              <div className="flex-1 relative bg-slate-50 dark:bg-[#0d1117]">
                <Editor
                  height="100%"
                  language={viewCode.language}
                  value={viewCode.code}
                  theme={theme === "dark" ? "vs-dark" : "light"}
                  options={{
                    readOnly: true,
                    fontSize: 13,
                    fontFamily: "'JetBrains Mono', monospace",
                    minimap: { enabled: false },
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    smoothScrolling: true,
                    wordWrap: "on",
                    renderLineHighlight: "all",
                    cursorStyle: "line",
                    contextmenu: false,
                    padding: { top: 16 },
                    overviewRulerBorder: false,
                    hideCursorInOverviewRuler: true,
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
