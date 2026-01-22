import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import Editor from "@monaco-editor/react";

const TABS = ["Problem", "Submissions", "Run", "Result"];

export default function ContestSolveProblem() {
  const { contestId, problemId } = useParams();
  const { user, loading: authLoading } = useAuth();
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
    <div className="h-screen flex items-center justify-center font-black text-sky-500 animate-pulse uppercase tracking-[0.3em]">
      Syncing Tactical HUD...
    </div>
  );

  const { problem, content, samples } = data;

  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans text-slate-800">
      
      {/* LEFT COLUMN TACTICAL CONTROL */}
      <div className="w-[45%] flex flex-col border-r border-slate-100 bg-slate-50/20">
        
        {/* Header */}
        <div className="p-6 bg-white border-b border-slate-100">
            <div className="flex items-center gap-2 mb-1 text-sky-500 font-black text-[10px] uppercase tracking-[0.2em]">
                <span>Objective #{problemId}</span>
                <div className="h-px flex-grow bg-sky-50"></div>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">{problem.title}</h1>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-white px-6 border-b border-slate-100">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`py-4 px-5 text-[10px] font-black uppercase tracking-widest transition-all relative ${
                activeTab === t ? "text-sky-500" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {t}
              {activeTab === t && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-sky-500 rounded-t-full shadow-[0_-2px_10px_rgba(14,165,233,0.4)]"></div>}
            </button>
          ))}
        </div>

        {/* Dynamic Content Panel */}
        <div className="flex-grow overflow-y-auto p-8 bg-white/50 leading-relaxed">
          
          {/* PROBLEM TAB */}
          {activeTab === "Problem" && (
            <div className="space-y-10 animate-in fade-in duration-300">
              <div className="text-[15px] font-bold text-slate-700 whitespace-pre-line">{content.statement}</div>
              
              {content.constraints && (
                <div className="bg-sky-50/50 border border-sky-100 rounded-2xl p-6">
                  <h4 className="text-[10px] font-black text-sky-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5-10-5-10 5z"/></svg>
                    Constraints
                  </h4>
                  <pre className="text-xs font-bold text-sky-700/80 whitespace-pre-line font-sans">{content.constraints}</pre>
                </div>
              )}

              <div className="space-y-6 pb-12">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Training Samples</h4>
                {samples.map((s, i) => (
                  <div key={i} className="border border-slate-100 rounded-2xl bg-white p-5 shadow-sm">
                    <div className="text-[9px] font-black text-slate-400 uppercase mb-4 tracking-widest">Case #{i + 1}</div>
                    <div className="grid grid-cols-2 gap-4 font-mono text-[11px]">
                      <div>
                        <p className="text-[8px] font-bold text-slate-400 uppercase mb-2">Input</p>
                        <pre className="bg-slate-50 p-3 rounded-lg text-slate-700 whitespace-pre-line leading-relaxed">{s.input}</pre>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-slate-400 uppercase mb-2">Output</p>
                        <pre className="bg-emerald-50 p-3 rounded-lg text-emerald-600 font-black">{s.output}</pre>
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
              {runError && <div className="p-4 text-xs font-black bg-rose-50 border border-rose-100 text-rose-600 rounded-xl uppercase tracking-tighter">{runError}</div>}
              {runResults.length === 0 ? (
                <div className="text-center py-20 text-slate-300 font-black uppercase text-[10px] tracking-widest italic opacity-50">Run simulator to view observation data</div>
              ) : (
                runResults.map((r, i) => (
                  <div key={i} className="border border-slate-100 rounded-2xl p-6 bg-white shadow-sm">
                    <div className="font-black text-slate-900 text-[10px] mb-4 flex items-center gap-2 uppercase tracking-widest">
                      <span className="w-1.5 h-1.5 bg-sky-500 rounded-full"></span>
                      Sample #{r.sample || r.index}
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-2 tracking-widest">Observed Output</p>
                        <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-xs font-mono overflow-x-auto shadow-inner">
                          {r.output || "(null)"}
                        </pre>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-2 tracking-widest">Expected Result</p>
                        <pre className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-xs font-mono text-slate-600">
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
                <div className="text-center py-20 text-slate-300 font-black uppercase text-[10px] tracking-widest">Mission status pending deployment</div>
              ) : (
                <>
                  <div className={`p-8 rounded-[2rem] border-2 flex items-center justify-between shadow-xl ${
                    lastResult.verdict === "AC" || lastResult.verdict === "Accepted" 
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-emerald-100/50" 
                    : "bg-rose-50 border-rose-200 text-rose-700 shadow-rose-100/50"
                  }`}>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 leading-none mb-2">Operation Verdict</p>
                        <p className="text-4xl font-black italic tracking-tighter uppercase">{lastResult.verdict}</p>
                    </div>
                    <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-black border-2 border-current">
                        {lastResult.verdict === "AC" || lastResult.verdict === "Accepted" ? "✓" : "!"}
                    </div>
                  </div>

                  <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-sm">
                    <p className="font-black text-slate-900 text-xs uppercase tracking-widest mb-6">Validation Sequence Results</p>
                    <ul className="space-y-4">
                      {lastResult.samples && lastResult.samples.map((s) => (
                        <li key={s.index} className="flex items-center justify-between text-xs group">
                          <div className="flex items-center gap-3">
                            <span className={`w-1.5 h-1.5 rounded-full ${s.verdict === "AC" || s.verdict === "Accepted" ? "bg-emerald-400" : "bg-rose-400"}`}></span>
                            <span className="font-bold text-slate-500 group-hover:text-slate-800 transition-colors">Test Module #{s.index}</span>
                          </div>
                          <span className={`font-black uppercase tracking-tighter ${s.verdict === "AC" || s.verdict === "Accepted" ? "text-emerald-600" : "text-rose-600"}`}>{s.verdict}</span>
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
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Deployment Logs</h4>
              {submissions.length === 0 ? (
                <div className="text-center py-20 text-slate-300 font-black uppercase text-[10px] tracking-widest italic opacity-50">Log entry empty</div>
              ) : (
                submissions.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm group hover:border-sky-300 transition-all">
                    <div className="flex flex-col">
                      <span className={`font-black text-sm italic uppercase ${s.verdict === "AC" || s.verdict === "Accepted" ? "text-emerald-500" : "text-rose-500"}`}>{s.verdict}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(s.submitted_at).toLocaleTimeString()}</span>
                    </div>
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{s.language}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN THE WORKSTATION */}
      <div className="flex-1 flex flex-col bg-slate-50 p-4">
        <div className="h-full rounded-[2.5rem] overflow-hidden border border-slate-200 bg-white shadow-2xl flex flex-col relative">
          
          {/* Workstation Header */}
          <div className="h-16 border-b border-slate-100 px-8 flex items-center justify-between bg-white z-20">
            <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-slate-100 border-none px-5 py-2 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest outline-none cursor-pointer focus:ring-2 focus:ring-sky-400"
            >
                <option value="cpp">C++ Kernel</option>
                <option value="java">Java JVM</option>
                <option value="python">Python Interpreter</option>
            </select>

            <div className="flex gap-3">
              <button 
                onClick={handleRun} 
                disabled={runLoading} 
                className="px-6 py-2.5 rounded-xl text-[10px] font-black text-sky-500 border-2 border-sky-500 hover:bg-sky-50 disabled:opacity-50 transition-all uppercase tracking-widest"
              >
                {runLoading ? "Simulating..." : "Run Simulator"}
              </button>
              <button 
                onClick={handleSubmit} 
                disabled={submitting} 
                className="px-8 py-2.5 rounded-xl text-[10px] font-black text-white bg-sky-500 hover:bg-sky-600 shadow-lg shadow-sky-200 disabled:opacity-50 transition-all uppercase tracking-widest"
              >
                {submitting ? "Engaging..." : "Deploy Solution"}
              </button>
            </div>
          </div>

          {/* Code Editor */}
          <div className="flex-grow">
            <Editor
                height="100%"
                language={language}
                value={code}
                theme="vs-light"
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
          <div className="h-10 bg-slate-900 flex items-center px-8 justify-between text-[9px] font-black tracking-[0.2em] text-slate-400">
            <div className="flex items-center gap-4 uppercase">
              <span className="text-emerald-500 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                System Synced
              </span>
              <span className="opacity-40 text-white">Environment: {language.toUpperCase()}</span>
            </div>
            <div className="text-sky-500 italic opacity-80 uppercase tracking-[0.5em]">Battleground Hub v2.0</div>
          </div>
        </div>
      </div>
    </div>
  );
}