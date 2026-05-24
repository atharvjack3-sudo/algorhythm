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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center font-['verdana','arial','sans-serif'] text-sm">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading problem statement...
        </div>
      </div>
    );
  }

  const { problem, content, samples } = data;

  // Reusable Editor Component
  const CodeEditorSection = (
    <div className="mt-10 bg-white dark:bg-[#111827] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden font-['verdana','arial','sans-serif']">
      <div className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 px-5 py-3.5 flex items-center justify-between">
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
          Workspace
        </h3>
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400">Compiler:</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-md px-2.5 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
          >
            <option value="cpp">GNU C++</option>
            <option value="java">Java</option>
            <option value="python">Python 3</option>
            <option value="javascript">Node.js</option>
          </select>
        </div>
      </div>
      <div className="p-5">
        <div className="h-[450px] rounded-lg border border-slate-200 dark:border-slate-700/60 overflow-hidden shadow-inner bg-[#fffffe] dark:bg-[#1e1e1e]">
          <Editor
            height="100%"
            language={language}
            value={code}
            theme={theme === "dark" ? "vs-dark" : "vs-light"}
            options={{
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              padding: { top: 16 },
              readOnly: isEnded,
              smoothScrolling: true,
              cursorBlinking: "smooth",
            }}
            onChange={(v) => setCode(v || "")}
          />
        </div>
        
        <div className="mt-5 flex flex-wrap gap-3">
          <button 
            onClick={handleRun} 
            disabled={runLoading}
            className="px-6 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm rounded-lg transition-colors border border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {runLoading ? (
              <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg> Running...</>
            ) : (
              <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Run Code</>
            )}
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={submitting || isEnded}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting ? (
              <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg> Submitting...</>
            ) : (
              <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Submit Solution</>
            )}
          </button>
        </div>

        {isEnded && (
          <div className="mt-5 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg p-3 text-center shadow-sm">
            <span className="font-bold text-red-600 dark:text-red-400 text-sm">
              This contest has ended. Submissions are closed, but the problem will be added to the global problemset shortly.
            </span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-['verdana','arial','sans-serif'] selection:bg-blue-200 dark:selection:bg-blue-900/50 pb-16">
      <div className="max-w-5xl mx-auto py-8 px-4 flex flex-col gap-8">
        
        {/* --- TABS MENU --- */}
        <div className="border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <ul className="flex m-0 p-0 list-none text-sm font-bold tracking-wide uppercase">
            {TABS.map((t) => (
              <li 
                key={t} 
                onClick={() => setActiveTab(t)}
                className={`mr-8 pb-3 cursor-pointer transition-all duration-200 border-b-[3px] relative top-[1.5px] ${
                  activeTab === t 
                    ? "text-blue-600 dark:text-blue-500 border-blue-600 dark:border-blue-500" 
                    : "text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                {t}
              </li>
            ))}
          </ul>
          <button 
            onClick={() => navigate(`/contests/${contestId}/problems`)}
            className="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold transition-colors flex items-center gap-1 pb-3"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Arena
          </button>
        </div>

        {/* --- PROBLEM TAB (RESEARCH PAPER AESTHETIC WITH VERDANA) --- */}
        {activeTab === "Problem" && (
          <div className="animate-in fade-in duration-500 bg-white dark:bg-[#111827] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 md:p-12">
            
            {/* Academic Header */}
            <div className="text-center mb-10 pb-6 border-b border-slate-200 dark:border-slate-800">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3">
                {problem.index}. {problem.title}
              </h1>
              <div className="text-sm text-slate-500 dark:text-slate-400 flex flex-col items-center gap-1">
                <span>Time limit per test: <strong className="font-bold">2 seconds</strong></span>
                <span>Memory limit per test: <strong className="font-bold">256 megabytes</strong></span>
              </div>
            </div>

            {/* Research Paper Styled Markdown Content (Strictly Verdana) */}
            <div className="text-[15px] leading-[1.8] text-slate-800 dark:text-slate-300 text-justify cf-markdown space-y-6">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm, remarkMath]} 
                rehypePlugins={[rehypeKatex, rehypeHighlight]}
              >
                {content.statement}
              </ReactMarkdown>

              {content.input_format && (
                <div className="mt-10">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">Input</h3>
                  <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {content.input_format}
                  </ReactMarkdown>
                </div>
              )}

              {content.output_format && (
                <div className="mt-10">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">Output</h3>
                  <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {content.output_format}
                  </ReactMarkdown>
                </div>
              )}

              {content.constraints && (
                <div className="mt-10">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2 mb-4">Constraints</h3>
                  <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {content.constraints}
                  </ReactMarkdown>
                </div>
              )}

              {/* Examples Section (Modern Monospace Block) */}
              <div className="mt-12">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Examples</h3>
                <div className="space-y-6 text-left">
                  {samples.map((s, i) => (
                    <div key={i} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden font-mono text-sm shadow-sm">
                      <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-2 font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                        Input
                      </div>
                      <pre className="p-4 bg-white dark:bg-[#0f172a] whitespace-pre-wrap text-slate-800 dark:text-slate-200 m-0">
                        {s.input}
                      </pre>
                      
                      <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-2 font-bold text-slate-700 dark:text-slate-300 border-y border-slate-200 dark:border-slate-700">
                        Output
                      </div>
                      <pre className="p-4 bg-white dark:bg-[#0f172a] whitespace-pre-wrap text-slate-800 dark:text-slate-200 m-0">
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
          <div className="animate-in fade-in duration-300 max-w-4xl">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Execution Results</h2>
            
            {runError && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl shadow-sm flex gap-3 items-start">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <div>
                  <h4 className="font-bold text-red-800 dark:text-red-300 mb-1">Compilation / Runtime Error</h4>
                  <pre className="text-sm font-mono text-red-600 dark:text-red-400 whitespace-pre-wrap">{runError}</pre>
                </div>
              </div>
            )}
            
            {runResults.length === 0 && !runError ? (
              <div className="p-8 text-center bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm text-slate-500 dark:text-slate-400 font-bold">
                <svg className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                No code executed yet. Run your code to see outputs here.
              </div>
            ) : (
              <div className="space-y-6">
                {runResults.map((r, i) => {
                  const isMatch = r.output?.trim() === r.expected?.trim();
                  return (
                    <div key={i} className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                      <div className="bg-slate-50 dark:bg-slate-800/50 px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                        <span className="font-bold text-slate-700 dark:text-slate-200">Test #{r.sample || r.index}</span>
                        {isMatch ? (
                          <span className="px-2.5 py-1 text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md">Matched</span>
                        ) : (
                          <span className="px-2.5 py-1 text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md">Mismatch</span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
                        <div>
                          <div className="px-4 py-2 bg-slate-50/50 dark:bg-slate-800/20 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">Your Output</div>
                          <pre className={`p-4 m-0 text-sm font-mono whitespace-pre-wrap ${isMatch ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {r.output || "(empty output)"}
                          </pre>
                        </div>
                        <div>
                          <div className="px-4 py-2 bg-slate-50/50 dark:bg-slate-800/20 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">Expected Output</div>
                          <pre className="p-4 m-0 text-sm font-mono text-slate-800 dark:text-slate-300 whitespace-pre-wrap">
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
          <div className="animate-in fade-in duration-300 max-w-4xl">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Submission Verdict</h2>
            {!lastResult ? (
              <div className="p-8 text-center bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm text-slate-500 dark:text-slate-400 font-bold">
                Submit your code to see the final verdict across all hidden test cases.
              </div>
            ) : (
              <div className="space-y-6">
                <div className={`p-5 rounded-xl border flex items-center justify-between shadow-sm ${
                  lastResult.verdict === "AC" || lastResult.verdict === "Accepted" 
                  ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/50" 
                  : "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/50"
                }`}>
                  <div className="flex items-center gap-3">
                    {lastResult.verdict === "AC" || lastResult.verdict === "Accepted" ? (
                      <svg className="w-8 h-8 text-green-600 dark:text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    ) : (
                      <svg className="w-8 h-8 text-red-600 dark:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    )}
                    <div>
                      <h3 className={`text-xl font-bold ${lastResult.verdict === "AC" || lastResult.verdict === "Accepted" ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}`}>
                        {lastResult.verdict === "AC" ? "Accepted" : lastResult.verdict}
                      </h3>
                      <p className="text-sm font-bold opacity-80 mt-0.5">Tested against all system cases</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-[#111827] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <th className="p-4">Test Case</th>
                        <th className="p-4 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-800/60">
                      {lastResult.samples && lastResult.samples.map((s, i) => (
                        <tr key={s.index} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="p-4 font-bold text-slate-700 dark:text-slate-300">
                            Test #{s.index}
                          </td>
                          <td className="p-4 text-right">
                            <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-md ${
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
            )}
          </div>
        )}

        {/* --- SUBMISSIONS TAB --- */}
        {activeTab === "Submissions" && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">My Submissions</h2>
            <div className="bg-white dark:bg-[#111827] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <th className="p-4">#</th>
                      <th className="p-4">When</th>
                      <th className="p-4">Problem</th>
                      <th className="p-4 text-center">Lang</th>
                      <th className="p-4 text-center">Verdict</th>
                      <th className="p-4 text-right">Time</th>
                      <th className="p-4 text-right">Memory</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-800/60">
                    {submissions.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="p-8 text-center text-slate-400 dark:text-slate-500 font-bold">
                          You haven't submitted anything yet.
                        </td>
                      </tr>
                    ) : (
                      submissions.map((s, i) => (
                        <tr key={s.submission_id || i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="p-4">
                            <span 
                              className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer transition-colors"
                              onClick={() => setViewCode(s)}
                              title="Click to view source code"
                            >
                              {s.submission_id}
                            </span>
                          </td>
                          <td className="p-4 text-slate-500 dark:text-slate-400 text-xs tabular-nums">
                            {formatCFDate(s.submitted_at)}
                          </td>
                          <td className="p-4">
                            <span 
                              className="font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
                              onClick={() => navigate(`/contests/${contestId}/solve/${s.problem_id}`)}
                            >
                              {s.problem_index} - {s.problem_title}
                            </span>
                          </td>
                          <td className="p-4 text-center text-slate-600 dark:text-slate-300 font-bold text-xs">
                            {s.language}
                          </td>
                          <td className="p-4 text-center">
                            <span className={`inline-flex px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide rounded-md border ${
                              s.verdict === "AC" || s.verdict === "Accepted" 
                                ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/30" 
                                : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/30"
                            }`}>
                              {s.verdict === "AC" ? "Accepted" : s.verdict}
                            </span>
                          </td>
                          <td className="p-4 text-right text-slate-600 dark:text-slate-400 tabular-nums text-xs">
                            {s.time_ms !== null && s.time_ms !== undefined ? `${s.time_ms} ms` : "0 ms"}
                          </td>
                          <td className="p-4 text-right text-slate-600 dark:text-slate-400 tabular-nums text-xs">
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#0f172a] w-full max-w-4xl rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-[#1e293b] rounded-t-xl">
                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                  Submission #{viewCode.submission_id} - {viewCode.problem_index} ({viewCode.language})
                </div>
                <button 
                  onClick={() => setViewCode(null)} 
                  className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="flex-1 overflow-auto p-4 bg-[#fffffe] dark:bg-[#1e1e1e]">
                <pre className="text-sm font-mono text-slate-800 dark:text-slate-300 whitespace-pre-wrap m-0 leading-relaxed">
                  {viewCode.code}
                </pre>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}