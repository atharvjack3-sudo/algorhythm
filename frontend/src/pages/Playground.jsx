import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

function Playground() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("cpp");
  const [loadingRes, setLoadingRes] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState({
    output: "Run code to see results",
    time: null,
    memory: null,
  });
  
  const navigate = useNavigate();
  const { theme } = useTheme();

  useEffect(() => {
    if (authLoading) return;
    if (!user) navigate("/auth");
  }, [user, authLoading, navigate]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    alert("Copied to Clipboard");
  };

  const handleReset = () => {
    if (
      window.confirm(
        "Are you sure you want to reset the editor? All progress will be lost."
      )
    ) {
      setCode("");
    }
  };

  async function handleSubmit(code, input, lang) {
    if (!code) return;
    try {
      setLoadingRes(true);
      setOutput({
        output: "Loading",
        time: "Calculating",
        memory: "Calculating",
      });
      const res = await api.post("/playground/run", {
        sourceCode: code,
        lang: lang,
        stdin: input,
      });
      setOutput({
        output: res.data.output,
        time: res.data.time,
        memory: res.data.memory,
      });
    } catch (err) {
      console.log(err);
      setOutput({
        output: "",
        time: 0,
        memory: 0,
      });
    } finally {
      setLoadingRes(false);
    }
  }

  if (authLoading) {
    return (
      <div className="w-full h-[calc(100vh-56px)] flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
        <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tracking-[0.15em] animate-pulse uppercase">
          LOADING PLAYGROUND...
        </span>
      </div>
    );
  }

  if (!user) return null;

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

      <div className="min-h-[calc(100vh-56px)] w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans transition-colors duration-200 flex flex-col">
        <div className="max-w-7xl w-full mx-auto p-6 flex flex-col gap-6 flex-grow">
          
          {/* --- TOP NAVIGATION --- */}
          <header className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2.5">
                <span className="inline-block w-[3px] h-[14px] rounded-sm bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                <span className="font-mono text-[11px] font-semibold tracking-[0.12em] text-slate-500 dark:text-slate-400 uppercase">
                  Workspace
                </span>
              </div>
              <h1 className="font-sans text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Playground
              </h1>
              <h3 className="font-mono text-xs font-semibold tracking-wide mt-1 text-gray-500">
                Memory Limit: 128 MB, Time Limit: 2.0s
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-[3px] overflow-hidden shadow-sm flex-grow md:flex-grow-0">
                <button
                  onClick={handleCopy}
                  title="Copy Content"
                  className="p-1.5 md:p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors border-r border-slate-300 dark:border-slate-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  onClick={handleReset}
                  title="Reset Editor"
                  className="p-1.5 md:p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors border-r border-slate-300 dark:border-slate-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-transparent px-3 py-1 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer uppercase tracking-widest [&>option]:bg-white dark:[&>option]:bg-slate-900 transition-colors"
                >
                  <option value="cpp">C++ 17</option>
                  <option value="python">Python 3</option>
                  <option value="javascript">JavaScript</option>
                </select>
              </div>

              <button
                onClick={() => handleSubmit(code, input, language)}
                disabled={loadingRes}
                className="font-mono text-[11px] font-bold tracking-[0.12em] uppercase rounded-[3px] transition-opacity duration-150 cursor-pointer bg-orange-500 text-white border-none px-6 py-2 hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed flex-grow md:flex-grow-0 text-center"
              >
                {loadingRes ? "RUNNING..." : "RUN CODE →"}
              </button>
            </div>
          </header>

          {/* --- MAIN WORKSPACE --- */}
          <main className="flex-grow flex flex-col gap-6">
            
            {/* EDITOR SECTION */}
            <div className="w-full h-[50vh] min-h-[350px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md shadow-sm flex flex-col overflow-hidden transition-colors">
              <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between transition-colors">
                <span className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  main.{language === "cpp" ? "cpp" : language === "python" ? "py" : "js"}
                </span>
              </div>

              <div className="flex-grow relative">
                <Editor
                  height="100%"
                  language={language}
                  value={code}
                  onChange={(val) => setCode(val ?? "")}
                  theme={theme === "dark" ? "vs-dark" : "light"}
                  options={{
                    fontSize: 13,
                    fontFamily: "'JetBrains Mono', monospace",
                    lineNumbers: "on",
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 4,
                    wordWrap: "on",
                    padding: { top: 16 },
                    cursorBlinking: "smooth",
                    renderLineHighlight: "all",
                    overviewRulerBorder: false,
                    hideCursorInOverviewRuler: true,
                  }}
                />
              </div>
            </div>

            {/* INPUT & CMD TERMINAL SECTION */}
            <div className="w-full flex flex-col lg:flex-row gap-6 mb-8">
              
              {/* Input Card */}
              <div className="w-full lg:w-1/3 flex flex-col bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 shadow-sm transition-colors overflow-hidden h-[300px]">
                <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 transition-colors">
                  <span className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Standard Input
                  </span>
                </div>
                <textarea
                  className="w-full flex-grow bg-white dark:bg-slate-950 p-4 font-mono text-[12px] text-slate-800 dark:text-slate-200 outline-none transition-colors resize-none placeholder:text-slate-400 dark:placeholder:text-slate-600 custom-scrollbar"
                  placeholder="Enter standard input here..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
              </div>

              {/* WINDOWS CMD TERMINAL REPLICA */}
              <div className="w-full lg:w-2/3 flex flex-col bg-black rounded-md shadow-sm border border-slate-800 h-[300px] overflow-hidden">
                
                {/* CMD Title Bar */}
                <div className="flex items-center justify-between px-3 h-8 bg-[#e5e5e5] text-black select-none border-b border-gray-400 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 bg-black border border-gray-600 flex items-center justify-center">
                      <span className="text-white text-[7px] font-mono leading-none font-bold">C:\_</span>
                    </div>
                    <span className="font-sans text-[11px] font-semibold tracking-wide">Output Terminal</span>
                  </div>
                  <div className="flex items-center h-full -mr-3">
                    <button className="w-10 h-full cursor-not-allowed hover:bg-gray-300 flex items-center justify-center text-gray-700 transition-colors">
                      <svg width="10" height="10" viewBox="0 0 10 10"><path fill="currentColor" d="M0 4h10v1H0z"/></svg>
                    </button>
                    <button className="w-10 h-full cursor-not-allowed hover:bg-gray-300 flex items-center justify-center text-gray-700 transition-colors">
                      <svg width="10" height="10" viewBox="0 0 10 10"><path fill="none" stroke="currentColor" d="M1.5 1.5h7v7h-7z"/></svg>
                    </button>
                    <button className="w-10 h-full cursor-not-allowed hover:bg-red-600 hover:text-white flex items-center justify-center text-gray-700 transition-colors">
                      <svg width="10" height="10" viewBox="0 0 10 10"><path fill="currentColor" d="M1.054 1.054l7.892 7.892-.741.741-7.892-7.892z"/><path fill="currentColor" d="M8.946 1.054L1.054 8.946l.741.741 7.892-7.892z"/></svg>
                    </button>
                  </div>
                </div>

                {/* CMD Body */}
                <div className="flex-grow p-4 overflow-y-auto text-[#cccccc] text-[13px] leading-relaxed custom-scrollbar font-mono">
                  <p>Algorhythm Code Execution Sandbox [Version 1.0.0]</p>
                  <br />
                  
                  <div className="whitespace-pre-wrap break-words">
                    <span>C:\Cloud\Developer&gt;</span>
                    
                    {loadingRes ? (
                      <span className="ml-1">
                        run_code.exe<br />
                        <span className="animate-pulse font-bold">_</span>
                      </span>
                    ) : output.output === "Run code to see results" ? (
                      <span className="animate-pulse font-bold ml-1">_</span>
                    ) : (
                      <>
                        <span className="ml-1">run_code.exe</span><br />
                        {output.output !== "Loading" && (
                          <div className="mt-1 text-[#ffffff]">
                            {output.output || "(no output)"}
                          </div>
                        )}
                        
                        {output.time !== null && output.time !== "Calculating" && (
                          <div className="mt-3 mb-1 text-[#888888]">
                            <p>Process returned 0 (0x0)</p>
                            <p>Execution Time: {output.time}s</p>
                            <p>Memory Peak: {output.memory} KB</p>
                          </div>
                        )}
                        <br />
                        <p>C:\Users\Developer&gt;<span className="animate-pulse font-bold">_</span></p>
                      </>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </main>
        </div>
      </div>
    </>
  );
}

export default Playground;