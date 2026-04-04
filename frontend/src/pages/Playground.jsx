import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

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

  useEffect(() => {
    if (authLoading) return;
    if (!user) navigate("/auth");
  }, [user, authLoading]);

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

  return (
    <div className="min-h-screen w-full bg-[#f8f9fa] text-slate-900 font-sans selection:bg-sky-100 overflow-x-hidden">
      {/* BACKGROUND Effect */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-sky-100/50 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-indigo-50/50 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto min-h-screen flex flex-col p-4 md:p-6 gap-6">
        {/* --- TOP NAVIGATION --- */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-2">
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-800">
              Code <span className="text-[#1a73e8]">Playground</span>
            </h1>
            <div className="flex gap-4 mt-1">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Time Limit: 2s
              </p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Memory Limit: 128MB
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-white border border-slate-200 p-1.5 rounded-lg shadow-sm w-full md:w-auto">
            {/* Action Buttons Group */}
            <div className="flex border-r border-slate-200 pr-2 gap-1">
              <button
                onClick={handleCopy}
                title="Copy Content"
                className="p-2 hover:bg-slate-100 rounded-md text-slate-500 hover:text-[#1a73e8] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                onClick={handleReset}
                title="Reset Editor"
                className="p-2 hover:bg-rose-50 rounded-md text-slate-500 hover:text-rose-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent px-2 md:px-4 py-1.5 text-xs md:text-sm font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="cpp">C++ 17</option>
              <option value="python">Python 3</option>
              <option value="javascript">JavaScript</option>
            </select>

            <button
              onClick={() => handleSubmit(code, input, language)}
              disabled={loadingRes}
              className="flex-grow md:flex-grow-0 bg-[#1a73e8] hover:bg-[#1557b0] text-white px-6 py-2 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              Run Code
            </button>
          </div>
        </header>

        {/* --- MAIN WORKSPACE --- */}
        <main className="flex-grow flex flex-col gap-6">
          
          {/* TOP: FULL WIDTH EDITOR SECTION */}
          <div className="w-full h-[55vh] min-h-[400px] bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-shrink-0">
            <div className="px-6 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Main Source File
                </span>
              </div>
            </div>

            <div className="flex-grow pt-2">
              <Editor
                height="100%"
                language={language}
                value={code}
                onChange={(val) => setCode(val ?? "")}
                theme="vs-light"
                options={{
                  fontSize: 14,
                  fontFamily: "'JetBrains Mono', 'Roboto Mono', monospace",
                  lineNumbers: "on",
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 4,
                  wordWrap: "on",
                  padding: { top: 16 },
                  cursorBlinking: "smooth",
                  renderLineHighlight: "all",
                  fontWeight: "400",
                }}
              />
            </div>
          </div>

          {/* BOTTOM: INPUT & CMD TERMINAL SECTION */}
          <div className="w-full flex flex-col lg:flex-row gap-6 mb-4">
            
            {/* Input Card (Left on Desktop, Top on Mobile) */}
            <div className="w-full lg:w-1/3 flex flex-col bg-white rounded-xl border border-slate-200 p-5 shadow-sm min-h-[300px]">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-3">
                Standard Input
              </h3>
              <textarea
                className="w-full flex-grow bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm font-mono outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] transition-all resize-none placeholder:text-slate-400"
                placeholder="Enter standard input here..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </div>

            {/* WINDOWS CMD TERMINAL REPLICA (Right on Desktop, Bottom on Mobile) */}
            <div className="w-full lg:w-2/3 flex flex-col bg-[#0c0c0c] rounded-md shadow-2xl overflow-hidden border border-[#2a2a2a] min-h-[300px]">
              
              {/* CMD Title Bar */}
              <div className="flex items-center justify-between px-3 py-0 bg-white text-black select-none h-8 border-b border-gray-300 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-[14px] h-[14px] bg-black border border-gray-500 flex items-center justify-center">
                    <span className="text-[#cccccc] text-[6px] font-mono leading-none font-bold">C:\_</span>
                  </div>
                  <span className="text-xs" style={{ fontFamily: '"Segoe UI", sans-serif' }}>Command Prompt</span>
                </div>
                <div className="flex items-center h-full -mr-3">
                  <button className="w-11 h-full hover:bg-[#e5e5e5] flex items-center justify-center text-gray-700 transition-colors">
                    <svg width="10" height="10" viewBox="0 0 10 10"><path fill="currentColor" d="M0 4h10v1H0z"/></svg>
                  </button>
                  <button className="w-11 h-full hover:bg-[#e5e5e5] flex items-center justify-center text-gray-700 transition-colors">
                    <svg width="10" height="10" viewBox="0 0 10 10"><path fill="none" stroke="currentColor" d="M1.5 1.5h7v7h-7z"/></svg>
                  </button>
                  <button className="w-11 h-full hover:bg-[#e81123] hover:text-white flex items-center justify-center text-gray-700 transition-colors">
                    <svg width="10" height="10" viewBox="0 0 10 10"><path fill="currentColor" d="M1.054 1.054l7.892 7.892-.741.741-7.892-7.892z"/><path fill="currentColor" d="M8.946 1.054L1.054 8.946l.741.741 7.892-7.892z"/></svg>
                  </button>
                </div>
              </div>

              {/* CMD Body */}
              <div className="flex-grow p-3 overflow-y-auto text-[#cccccc] text-[14px] leading-relaxed" style={{ fontFamily: 'Consolas, "Lucida Console", monospace' }}>
                <p>Microsoft Windows [Version 10.0.22621.3007]</p>
                <p>(c) Microsoft Corporation. All rights reserved.</p>
                <br />
                
                <div className="whitespace-pre-wrap break-words">
                  <span>C:\Users\Developer&gt;</span>
                  
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
  );
}

export default Playground;