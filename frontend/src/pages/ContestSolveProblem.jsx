import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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
        prose-code:font-mono prose-code:text-[13px] prose-code:bg-slate-100 dark:prose-code:bg-slate-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-[3px]
        prose-pre:font-mono prose-pre:text-[13px] prose-pre:bg-slate-50 dark:prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-200 dark:prose-pre:border-slate-800 prose-pre:rounded-[3px] prose-pre:text-slate-800 dark:prose-pre:text-slate-200
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

  const formatCFDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()];
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
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
        // Dynamically check if the contest has ended based on current local time
        const end = new Date(problemData.contest.end_time).getTime();
        setIsEnded(Date.now() > end);
      };

      // 1. Check Session Cache first
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setProblemState(JSON.parse(cached));
        return;
      }

      // 2. Network Call if no cache
      try {
        const res = await api.get(`/contests/${contestId}/problems/${problemId}`);
        sessionStorage.setItem(cacheKey, JSON.stringify(res.data));
        setProblemState(res.data);
      } catch (err) { 
        // Redirect to contest page if not started or not registered
        if (err.response?.status === 403 || err.response?.status === 404 || err.response?.data?.code === "NOT_STARTED") {
          navigate(`/contests`);
        } else {
          console.error("Problem fetch failed"); 
        }
      }
    }
    if (user) loadProblem();
  }, [contestId, problemId, user, navigate]);

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
      const res = await api.post(`/contests/${contestId}/submit`, { problemId, language, code });
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tracking-[0.15em] animate-pulse">
          LOADING STATEMENT...
        </span>
      </div>
    );
  }

  const { problem, content, samples } = data;

  // Reusable Editor Component
  const CodeEditorSection = (
    <div className="mt-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
      <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
        <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 tracking-[0.1em] uppercase">IDE</span>
        <div className="flex items-center gap-2">
          <label className="font-mono text-[10px] text-slate-500 dark:text-slate-400 tracking-[0.08em] uppercase">Compiler</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded px-2 py-1 text-[11px] font-mono outline-none focus:border-amber-500 transition-colors cursor-pointer"
          >
            <option value="cpp">GNU C++</option>
            <option value="java">Java</option>
            <option value="python">Python 3</option>
            <option value="javascript">Node.js</option>
          </select>
        </div>
      </div>
      
      <div className="p-4">
        <div className="h-[450px] border border-slate-200 dark:border-slate-800 rounded overflow-hidden">
          <Editor
            height="100%"
            language={language}
            value={code}
            theme={theme === "dark" ? "vs-dark" : "light"}
            options={{
              fontSize: 13,
              fontFamily: "'JetBrains Mono', monospace",
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              padding: { top: 16 },
              readOnly: false,
              smoothScrolling: true,
              cursorBlinking: "smooth",
            }}
            onChange={(v) => setCode(v || "")}
          />
        </div>
        
        <div className="mt-4 flex flex-wrap gap-2.5">
          <button 
            onClick={handleRun} 
            disabled={runLoading}
            className="font-mono text-[11px] font-semibold tracking-[0.06em] rounded transition-all duration-150 cursor-pointer bg-transparent text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {runLoading ? "Running..." : "Run Code"}
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={submitting || isEnded}
            className="font-mono text-[11px] font-bold tracking-[0.12em] rounded transition-opacity duration-150 cursor-pointer  bg-orange-600 dark:bg-orange-500 text-black dark:text-slate-950 border-none px-4 py-2 hover:opacity-85 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting ? "Submitting..." : "Submit →"}
          </button>
        </div>

        {isEnded && (
          <div className="mt-4 border-l-2 border-red-500 pl-3">
            <span className="font-mono text-[10px] text-red-500 tracking-[0.08em] uppercase">Contest Concluded</span>
            <div className="font-sans text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Submissions are closed. Problem will be added to the global problemset shortly.
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .font-sans { font-family: 'DM Sans', sans-serif; }
        
        /* Markdown Overrides */
        .cf-markdown p { margin-bottom: 1rem; line-height: 1.6; }
        .cf-markdown code { font-family: 'JetBrains Mono', monospace; font-size: 0.9em; padding: 0.15rem 0.3rem; background: var(--code-bg); border-radius: 0.25rem; }
        .cf-markdown pre { background: var(--pre-bg); padding: 1rem; border-radius: 0.375rem; overflow-x: auto; font-family: 'JetBrains Mono', monospace; font-size: 0.85em; border: 1px solid var(--border-color); }
        .cf-markdown pre code { background: transparent; padding: 0; }
        .cf-markdown ul, .cf-markdown ol { padding-left: 1.5rem; margin-bottom: 1rem; }
        .cf-markdown li { margin-bottom: 0.25rem; }
        
        :root { --code-bg: #f1f5f9; --pre-bg: #f8fafc; --border-color: #e2e8f0; }
        .dark { --code-bg: rgba(30, 41, 59, 0.5); --pre-bg: #0f172a; --border-color: #1e293b; }
      `}</style>

      <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 pb-16">
        <div className="max-w-5xl mx-auto py-10 px-6 flex flex-col gap-8">
          
          {/* --- TABS MENU --- */}
          <div className="border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-6 whitespace-nowrap">
              {TABS.map((t) => (
                <button 
                  key={t} 
                  onClick={() => setActiveTab(t)}
                  className={`pb-3 font-mono text-[11px] font-semibold tracking-[0.08em] uppercase transition-all duration-200 border-b-2 relative top-[2px] bg-transparent ${
                    activeTab === t 
                      ? "text-orange-500 border-orange-500" 
                      : "text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <button 
              onClick={() => navigate(`/contests/${contestId}/problems`)}
              className="pb-3 font-mono text-[11px] font-semibold tracking-[0.06em] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors bg-transparent border-none flex items-center gap-2"
            >
              ← BACK
            </button>
          </div>

          {/* --- PROBLEM TAB --- */}
          {activeTab === "Problem" && (
            <div className="bg-white dark:bg-slate-900 rounded-md shadow-sm border border-slate-200 dark:border-slate-800 p-8 md:p-12">
              
              {/* Header */}
              <div className="text-center mb-10 pb-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-center gap-2.5 mb-3">
                  <span className="inline-block w-[3px] h-[14px] rounded-sm bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                  <span className="font-mono text-[11px] font-semibold tracking-[0.12em] text-slate-500 dark:text-slate-400 uppercase">
                    Problem {problem.index}
                  </span>
                </div>
                <h1 className="font-sans text-2xl md:text-3xl font-semibold text-slate-900 dark:text-white mb-4">
                  {problem.title}
                </h1>
                <div className="flex justify-center gap-6 font-mono text-[10px] text-slate-500 dark:text-slate-400 tracking-[0.08em] uppercase">
                  <span>Time Limit: 2.0s</span>
                  <span>Memory Limit: 256MB</span>
                </div>
              </div>

              {/* Markdown Content */}
              <div className="font-sans text-[14px] text-slate-800 dark:text-slate-300">
                <MarkdownRenderer content={content.statement} />

                {content.input_format && (
                  <div className="mt-10">
                    <h3 className="font-sans text-lg font-bold text-slate-900 dark:text-white mb-3">Input Format</h3>
                    <MarkdownRenderer content={content.input_format} />
                  </div>
                )}

                {content.output_format && (
                  <div className="mt-8">
                    <h3 className="font-sans text-lg font-bold text-slate-900 dark:text-white mb-3">Output Format</h3>
                    <MarkdownRenderer content={content.output_format} />
                  </div>
                )}

                {content.constraints && (
                  <div className="mt-8">
                    <h3 className="font-sans text-lg font-bold text-slate-900 dark:text-white mb-3">Constraints</h3>
                    <MarkdownRenderer content={content.constraints} />
                  </div>
                )}

                {/* Examples */}
                <div className="mt-10">
                  <h3 className="font-sans text-lg font-bold text-slate-900 dark:text-white mb-4">Examples</h3>
                  <div className="flex flex-col gap-5">
                    {samples.map((s, i) => (
                      <div key={i} className="border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden shadow-sm">
                        <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase">
                          Input
                        </div>
                        <pre className="p-4 bg-white dark:bg-slate-900 font-mono text-[13px] text-slate-800 dark:text-slate-200 m-0 whitespace-pre-wrap">
                          {s.input}
                        </pre>
                        
                        <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-950 border-y border-slate-200 dark:border-slate-800 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase">
                          Output
                        </div>
                        <pre className="p-4 bg-white dark:bg-slate-900 font-mono text-[13px] text-slate-800 dark:text-slate-200 m-0 whitespace-pre-wrap">
                          {s.output}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Injected Code Editor */}
              {CodeEditorSection}
            </div>
          )}

          {/* --- RUN TAB --- */}
          {activeTab === "Run" && (
            <div className="w-full">
              <div className="flex items-center gap-2.5 mb-5">
                <span className="inline-block w-[3px] h-[14px] rounded-sm bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                <span className="font-mono text-[11px] font-semibold tracking-[0.12em] text-slate-500 dark:text-slate-400 uppercase">
                  Execution Results
                </span>
              </div>
              
              {runError && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-md shadow-sm">
                  <div className="font-mono text-[11px] font-bold text-red-600 dark:text-red-400 tracking-[0.08em] uppercase mb-2">Error</div>
                  <pre className="font-mono text-[11px] text-red-500 whitespace-pre-wrap">{runError}</pre>
                </div>
              )}
              
              {runResults.length === 0 && !runError ? (
                <div className="px-4 py-8 text-center border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-900 shadow-sm font-mono text-[11px] tracking-[0.06em] text-slate-500 dark:text-slate-400 uppercase">
                  No code executed yet.
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {runResults.map((r, i) => {
                    const isMatch = r.output?.trim() === r.expected?.trim();
                    return (
                      <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden shadow-sm">
                        <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                          <span className="font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-600 dark:text-slate-300 uppercase">Test #{r.sample || r.index}</span>
                          <span className={`px-2 py-0.5 rounded-[3px] font-mono text-[10px] font-semibold tracking-wide uppercase ${
                            isMatch ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                          }`}>
                            {isMatch ? "Matched" : "Mismatch"}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
                          <div>
                            <div className="px-4 py-2 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 font-mono text-[9px] font-semibold text-slate-500 uppercase tracking-[0.1em]">Your Output</div>
                            <pre className={`p-4 m-0 font-mono text-[12px] whitespace-pre-wrap ${isMatch ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {r.output || "(empty output)"}
                            </pre>
                          </div>
                          <div>
                            <div className="px-4 py-2 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 font-mono text-[9px] font-semibold text-slate-500 uppercase tracking-[0.1em]">Expected Output</div>
                            <pre className="p-4 m-0 font-mono text-[12px] text-slate-800 dark:text-slate-300 whitespace-pre-wrap">
                              {r.expected}
                            </pre>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {CodeEditorSection}
            </div>
          )}

          {/* --- RESULT TAB --- */}
          {activeTab === "Result" && (
            <div className="w-full">
              <div className="flex items-center gap-2.5 mb-5">
                <span className="inline-block w-[3px] h-[14px] rounded-sm bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                <span className="font-mono text-[11px] font-semibold tracking-[0.12em] text-slate-500 dark:text-slate-400 uppercase">
                  Submission Verdict
                </span>
              </div>

              {!lastResult ? (
                <div className="px-4 py-8 text-center border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-900 shadow-sm font-mono text-[11px] tracking-[0.06em] text-slate-500 dark:text-slate-400 uppercase">
                  Submit code to view final verdict.
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  <div className={`p-5 rounded-md border shadow-sm ${
                    lastResult.verdict === "AC" || lastResult.verdict === "Accepted" 
                    ? "bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900/50" 
                    : "bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50"
                  }`}>
                    <h3 className={`font-mono text-[18px] font-bold tracking-wide uppercase ${lastResult.verdict === "AC" || lastResult.verdict === "Accepted" ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"}`}>
                      {lastResult.verdict === "AC" ? "Accepted" : lastResult.verdict}
                    </h3>
                    <p className="font-mono text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Tested against all system cases</p>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse whitespace-nowrap">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800">
                            <th className="px-4 py-2.5 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase text-left">Test Case</th>
                            <th className="px-4 py-2.5 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lastResult.samples && lastResult.samples.map((s) => (
                            <tr key={s.index} className="border-b border-slate-200 dark:border-slate-800 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/50">
                              <td className="px-4 py-3 font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                                Test #{s.index}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className={`inline-flex px-2 py-0.5 rounded-[3px] font-mono text-[10px] font-semibold tracking-wide uppercase ${
                                  s.verdict === "AC" || s.verdict === "Accepted" 
                                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" 
                                    : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                                }`}>
                                  {s.verdict === "AC" ? "Accepted" : s.verdict}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* --- EDITORIAL TAB --- */}
          {activeTab === "Editorial" && (
            <div className="bg-white dark:bg-slate-900 rounded-md shadow-sm border border-slate-200 dark:border-slate-800 p-8 md:p-12">
              <MarkdownRenderer content={content.editorial} />
            </div>
          )}

          {/* --- SUBMISSIONS TAB --- */}
          {activeTab === "Submissions" && (
            <div className="w-full">
              <div className="flex items-center gap-2.5 mb-5">
                <span className="inline-block w-[3px] h-[14px] rounded-sm bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                <span className="font-mono text-[11px] font-semibold tracking-[0.12em] text-slate-500 dark:text-slate-400 uppercase">
                  My Submissions
                </span>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse whitespace-nowrap min-w-[800px]">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800">
                        <th className="px-4 py-2.5 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase text-left">#</th>
                        <th className="px-4 py-2.5 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase text-left">When</th>
                        <th className="px-4 py-2.5 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase text-left">Problem</th>
                        <th className="px-4 py-2.5 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase text-center">Lang</th>
                        <th className="px-4 py-2.5 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase text-center">Verdict</th>
                        <th className="px-4 py-2.5 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase text-right">Time</th>
                        <th className="px-4 py-2.5 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase text-right">Memory</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-4 py-8 text-center text-slate-500 dark:text-slate-400 font-mono text-[11px] tracking-[0.06em] uppercase">
                            You haven't submitted anything yet.
                          </td>
                        </tr>
                      ) : (
                        submissions.map((s, i) => (
                          <tr key={s.submission_id || i} className="border-b border-slate-200 dark:border-slate-800 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/50 group">
                            <td className="px-4 py-3">
                              <span 
                                className="font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 cursor-pointer transition-colors"
                                onClick={() => setViewCode(s)}
                                title="Click to view source code"
                              >
                                {s.submission_id}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                              {formatCFDate(s.submitted_at)}
                            </td>
                            <td className="px-4 py-3">
                              <span 
                                className="font-sans text-[13px] font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 cursor-pointer transition-colors"
                                onClick={() => navigate(`/contests/${contestId}/solve/${s.problem_id}`)}
                              >
                                {s.problem_index} - {s.problem_title}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center font-mono text-[11px] font-medium text-slate-600 dark:text-slate-300">
                              {s.language}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex px-2 py-0.5 rounded-[3px] font-mono text-[10px] font-semibold tracking-wide uppercase ${
                                s.verdict === "AC" || s.verdict === "Accepted" 
                                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" 
                                  : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                              }`}>
                                {s.verdict === "AC" ? "Accepted" : s.verdict}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-[11px] text-slate-600 dark:text-slate-400">
                              {s.time_ms !== null && s.time_ms !== undefined ? `${s.time_ms} ms` : "0 ms"}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-[11px] text-slate-600 dark:text-slate-400">
                              {s.memory_kb !== null && s.memory_kb !== undefined ? `${s.memory_kb} KB` : "0 KB"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* --- SOURCE CODE MODAL --- */}
          {viewCode && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
              <div className="bg-white dark:bg-slate-950 w-full max-w-4xl rounded-md shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh]">
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                  <div className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    SUBMISSION #{viewCode.submission_id} · {viewCode.problem_index} · {viewCode.language}
                  </div>
                  <button 
                    onClick={() => setViewCode(null)} 
                    className="font-mono text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer bg-transparent border-none p-1"
                  >
                    CLOSE [X]
                  </button>
                </div>
                <div className="flex-1 overflow-auto p-4 bg-slate-50 dark:bg-[#0d1117]">
                  <pre className="font-mono text-[12px] text-slate-800 dark:text-slate-300 whitespace-pre-wrap m-0 leading-relaxed">
                    {viewCode.code}
                  </pre>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}