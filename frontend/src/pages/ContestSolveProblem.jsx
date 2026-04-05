import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { api } from "../api/client";
import Editor from "@monaco-editor/react";

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

  /* =========================
      Logic & Backend Wiring
  ========================= */
  useEffect(() => {
    async function loadProblem() {
      try {
        const res = await api.get(`/problems/${problemId}`);
        setData(res.data);
      } catch (err) { console.error("Problem fetch failed"); }
    }
    loadProblem();
  }, [problemId]);

  async function loadSubmissions() {
    try {
      const res = await api.get(`/contests/${contestId}/submissions`);
      setSubmissions(res.data.filter((s) => s.problem_id === Number(problemId)));
    } catch (err) { console.error("Logs fetch failed"); }
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
      setActiveTab("Run"); // Switch to Run tab to show outputs
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
      // Sync runResults so "Run" tab isn't stale
      if (res.data.samples) setRunResults(res.data.samples);
      await loadSubmissions();
      setActiveTab("Result"); // Switch to Result tab to show verdict
    } catch (err) {
      console.error("Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!data) return (
    <div className="w-full h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-[#f8f9fa] dark:bg-[#0a0c10] transition-colors duration-300">
      <div className="relative w-12 h-12 flex items-center justify-center mb-6">
        <div className="absolute inset-0 rounded-full border-[3px] border-slate-200 dark:border-slate-800"></div>
        <div className="absolute inset-0 rounded-full border-[3px] border-blue-600 dark:border-blue-500 border-t-transparent border-r-transparent animate-[spin_0.8s_linear_infinite]"></div>
        <div className="absolute inset-0 rounded-full bg-blue-500/10 dark:bg-blue-500/20 blur-md"></div>
      </div>
      <p className="font-black text-blue-600 dark:text-blue-500 animate-pulse uppercase tracking-[0.3em] text-[11px]">
        Syncing Tactical HUD...
      </p>
    </div>
  );

  const { problem, content, samples } = data;

  return (
    <div className="w-full h-[calc(100dvh-4rem)] overflow-y-auto md:overflow-hidden bg-[#f8f9fa] dark:bg-[#0a0c10] flex flex-col md:flex-row font-sans text-slate-800 dark:text-slate-200 transition-colors duration-300 relative">
      
      {/* Invisible overlay while dragging to prevent Monaco Editor from swallowing mouse events */}
      {isDragging && <div className="fixed inset-0 z-[200] cursor-col-resize" />}

      {/* LEFT COLUMN TACTICAL CONTROL */}
      <section 
        className="w-full min-h-[calc(100dvh-4rem)] shrink-0 md:shrink md:min-h-0 md:h-full flex flex-col border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors relative z-10"
        style={isDesktop ? { width: `${leftWidth}%` } : {}}
      >
        
        {/* Header */}
        <div className="p-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors flex-shrink-0">
            <div className="flex items-center gap-3 mb-2 text-blue-600 dark:text-blue-500 font-black text-[10px] uppercase tracking-[0.2em] transition-colors">
                <span>Objective #{problemId}</span>
                <div className="h-px flex-grow bg-blue-100 dark:bg-blue-500/20"></div>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic transition-colors leading-tight">
              {problem.title}
            </h1>
        </div>

        {/* Tab Selection */}
        <div className="flex overflow-x-auto bg-white dark:bg-slate-900 px-4 border-b border-slate-200 dark:border-slate-800 transition-colors flex-shrink-0 custom-scrollbar">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`py-4 px-4 text-[10px] font-black uppercase tracking-widest transition-colors relative whitespace-nowrap ${
                activeTab === t 
                  ? "text-blue-600 dark:text-blue-500" 
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-t-lg"
              }`}
            >
              {t}
              {activeTab === t && (
                <div className="absolute bottom-0 left-0 w-full h-[3px] bg-blue-600 dark:bg-blue-500 rounded-t-sm shadow-[0_-2px_10px_rgba(37,99,235,0.4)]"></div>
              )}
            </button>
          ))}
        </div>

        {/* Dynamic Content Panel */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/50 dark:bg-[#0a0c10]/50 leading-relaxed custom-scrollbar transition-colors">
          
          {/* PROBLEM TAB */}
          {activeTab === "Problem" && (
            <div className="space-y-10 animate-in fade-in duration-300">
              <div className="text-[14px] md:text-[15px] font-medium text-slate-700 dark:text-slate-300 whitespace-pre-line transition-colors">
                {content.statement}
              </div>
              
              {content.constraints && (
                <div className="bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/20 rounded-2xl p-5 md:p-6 transition-colors">
                  <h4 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2 transition-colors">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5-10-5-10 5z"/></svg>
                    Constraints
                  </h4>
                  <pre className="text-[11px] md:text-xs font-bold text-blue-800 dark:text-blue-300 whitespace-pre-line font-sans transition-colors">
                    {content.constraints}
                  </pre>
                </div>
              )}

              <div className="space-y-6 pb-12">
                <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest italic transition-colors">
                  Training Samples
                </h4>
                {samples.map((s, i) => (
                  <div key={i} className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden shadow-sm transition-colors">
                    <div className="bg-slate-50 dark:bg-slate-950/50 px-5 py-3 border-b border-slate-200 dark:border-slate-800 transition-colors">
                      <div className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        Case #{i + 1}
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800 font-mono text-[11px] md:text-[12px] transition-colors">
                      <div className="flex-1 p-5 bg-white dark:bg-slate-900 transition-colors">
                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-3 tracking-wider">Input</p>
                        <pre className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed border border-slate-100 dark:border-slate-800 transition-colors">
                          {s.input}
                        </pre>
                      </div>
                      <div className="flex-1 p-5 bg-white dark:bg-slate-900 transition-colors">
                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-3 tracking-wider">Output</p>
                        <pre className="bg-emerald-50/50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 p-4 rounded-xl text-emerald-700 dark:text-emerald-400 font-bold whitespace-pre-wrap transition-colors">
                          {s.output}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RUN TAB (Side-by-side comparison) */}
          {activeTab === "Run" && (
            <div className="space-y-6 animate-in zoom-in-95 duration-200">
              {runError && (
                <div className="p-5 text-xs font-black bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl uppercase tracking-tighter transition-colors">
                  {runError}
                </div>
              )}
              {runResults.length === 0 ? (
                <div className="text-center py-20 text-slate-400 dark:text-slate-500 font-black uppercase text-[10px] tracking-widest italic opacity-60 transition-colors">
                  Run simulator to view observation data
                </div>
              ) : (
                runResults.map((r, i) => (
                  <div key={i} className="border border-slate-200 dark:border-slate-800 rounded-2xl p-6 bg-white dark:bg-slate-900 shadow-sm transition-colors">
                    <div className="font-black text-slate-900 dark:text-white text-[10px] md:text-[11px] mb-5 flex items-center gap-2 uppercase tracking-widest transition-colors">
                      <span className="w-2 h-2 bg-blue-600 dark:bg-blue-500 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.5)]"></span>
                      Sample #{r.sample || r.index}
                    </div>
                    <div className="space-y-5">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase mb-2 tracking-widest transition-colors">Observed Output</p>
                        <pre className="bg-slate-900 dark:bg-black text-emerald-400 p-4 rounded-xl text-xs font-mono overflow-x-auto shadow-inner border border-slate-800">
                          {r.output || "(null)"}
                        </pre>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase mb-2 tracking-widest transition-colors">Expected Result</p>
                        <pre className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-xl text-xs font-mono text-slate-700 dark:text-slate-300 transition-colors">
                          {r.expected}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* RESULT TAB */}
          {activeTab === "Result" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {!lastResult ? (
                <div className="text-center py-20 text-slate-400 dark:text-slate-500 font-black uppercase text-[10px] tracking-widest transition-colors">
                  Mission status pending deployment
                </div>
              ) : (
                <>
                  <div className={`p-8 rounded-[2rem] border-2 flex items-center justify-between shadow-lg transition-colors ${
                    lastResult.verdict === "AC" || lastResult.verdict === "Accepted" 
                    ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 shadow-emerald-100/50 dark:shadow-none" 
                    : "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 shadow-rose-100/50 dark:shadow-none"
                  }`}>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-70 leading-none mb-2 transition-colors">Operation Verdict</p>
                        <p className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase transition-colors">{lastResult.verdict}</p>
                    </div>
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center text-2xl font-black border-[3px] border-current transition-colors">
                        {lastResult.verdict === "AC" || lastResult.verdict === "Accepted" ? "✓" : "!"}
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 md:p-8 shadow-sm transition-colors">
                    <p className="font-black text-slate-900 dark:text-white text-[11px] uppercase tracking-widest mb-6 transition-colors">
                      Validation Sequence Results
                    </p>
                    <ul className="space-y-4">
                      {lastResult.samples && lastResult.samples.map((s) => (
                        <li key={s.index} className="flex items-center justify-between text-xs group">
                          <div className="flex items-center gap-3">
                            <span className={`w-2 h-2 rounded-full ${s.verdict === "AC" || s.verdict === "Accepted" ? "bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-rose-500 dark:bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.6)]"}`}></span>
                            <span className="font-bold text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">
                              Test Module #{s.index}
                            </span>
                          </div>
                          <span className={`font-black uppercase tracking-tighter transition-colors ${s.verdict === "AC" || s.verdict === "Accepted" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                            {s.verdict}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
          )}

          {/* SUBMISSIONS TAB */}
          {activeTab === "Submissions" && (
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-6 transition-colors">
                Deployment Logs
              </h4>
              {submissions.length === 0 ? (
                <div className="text-center py-20 text-slate-400 dark:text-slate-500 font-black uppercase text-[10px] tracking-widest italic opacity-60 transition-colors">
                  Log entry empty
                </div>
              ) : (
                submissions.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm hover:border-blue-400 dark:hover:border-blue-500 transition-all group">
                    <div className="flex flex-col gap-1">
                      <span className={`font-black text-sm italic uppercase transition-colors ${s.verdict === "AC" || s.verdict === "Accepted" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                        {s.verdict}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest transition-colors">
                        {new Date(s.submitted_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-md uppercase tracking-widest transition-colors border border-slate-100 dark:border-slate-700">
                      {s.language}
                    </span>
                  </div>
                ))
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

      {/* RIGHT COLUMN THE WORKSTATION */}
      <section className="w-full min-h-[calc(100dvh-4rem)] shrink-0 md:shrink md:min-h-0 md:h-full md:flex-1 flex flex-col bg-slate-100 dark:bg-[#0a0c10] p-3 md:p-4 transition-colors">
        <div className="h-full rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1e1e1e] shadow-2xl flex flex-col relative transition-colors">
          
          {/* Workstation Header */}
          <div className="h-16 md:h-20 border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 flex items-center justify-between bg-white dark:bg-[#1e1e1e] z-20 transition-colors shrink-0">
            
            <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-slate-100 dark:bg-slate-800 border-none px-4 py-2.5 rounded-xl text-[10px] md:text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest outline-none cursor-pointer focus:ring-2 focus:ring-blue-500 transition-colors"
            >
                <option value="cpp">C++ Kernel</option>
                <option value="java">Java JVM</option>
                <option value="python">Python Interpreter</option>
                <option value="javascript">JavaScript</option>
            </select>

            <div className="flex gap-2 md:gap-3">
              <button 
                onClick={handleRun} 
                disabled={runLoading} 
                className="px-4 md:px-6 py-2.5 rounded-xl text-[10px] md:text-[11px] font-black text-blue-600 dark:text-blue-400 border-[2px] border-blue-600 dark:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 disabled:opacity-50 transition-all uppercase tracking-widest active:scale-95"
              >
                {runLoading ? "..." : "Run"}
              </button>
              <button 
                onClick={handleSubmit} 
                disabled={submitting} 
                className="px-5 md:px-8 py-2.5 rounded-xl text-[10px] md:text-[11px] font-black text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 shadow-lg shadow-blue-600/20 disabled:opacity-50 transition-all uppercase tracking-widest active:scale-95 border border-transparent"
              >
                {submitting ? "Engaging..." : "Deploy"}
              </button>
            </div>
          </div>

          {/* Code Editor */}
          <div className="flex-1 relative">
            <Editor
                height="100%"
                language={language}
                value={code}
                theme={theme === "dark" ? "vs-dark" : "vs-light"}
                options={{
                    fontSize: 14,
                    fontFamily: "'JetBrains Mono', monospace",
                    minimap: { enabled: false },
                    padding: { top: 30 },
                    cursorSmoothCaretAnimation: true,
                    smoothScrolling: true,
                    lineNumbers: "on",
                }}
                onChange={(v) => setCode(v || "")}
            />
          </div>

          {/* Status Bar */}
          <div className="h-10 md:h-12 bg-slate-900 dark:bg-black flex items-center px-6 md:px-8 justify-between text-[9px] md:text-[10px] font-black tracking-[0.2em] text-slate-400 shrink-0 transition-colors">
            <div className="flex items-center gap-4 uppercase">
              <span className="text-emerald-500 flex items-center gap-2">
                <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></span>
                System Synced
              </span>
              <span className="opacity-40 text-white hidden sm:inline">Environment: {language.toUpperCase()}</span>
            </div>
            <div className="text-blue-500 italic opacity-80 uppercase tracking-[0.4em] md:tracking-[0.5em]">Battleground Hub v2.0</div>
          </div>
        </div>
      </section>
    </div>
  );
}