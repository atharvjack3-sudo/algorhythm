import React, { useState } from "react";
import Editor from "@monaco-editor/react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useEffect } from "react";
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
        "Are you sure you want to reset the editor? All progress will be lost.",
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
    <div className="min-h-screen w-full bg-[#fdfeff] text-slate-900 font-sans selection:bg-sky-100 overflow-x-hidden">
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
              Code <span className="text-sky-500">Playground</span>
            </h1>
            <div className="flex gap-4 mt-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Time Limit: 2s
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Memory Limit: 128MB
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-white/80 backdrop-blur-md border border-slate-200/60 p-1.5 rounded-2xl shadow-sm w-full md:w-auto">
            {/* Action Buttons Group */}
            <div className="flex border-r border-slate-200 pr-2 gap-1">
              <button
                onClick={handleCopy}
                title="Copy Content"
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-sky-500 transition-colors"
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
                    strokeWidth="2.5"
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
              <button
                onClick={handleReset}
                title="Reset Editor"
                className="p-2 hover:bg-rose-50 rounded-xl text-slate-400 hover:text-rose-500 transition-colors"
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
                    strokeWidth="2.5"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            </div>

            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent px-2 md:px-4 py-1.5 text-xs md:text-sm font-bold text-slate-600 outline-none cursor-pointer"
            >
              <option value="cpp">C++ 17</option>
              <option value="python">Python 3</option>
              <option value="javascript">JavaScript</option>
            </select>

            <button
              onClick={() => handleSubmit(code, input, language)}
              disabled={loadingRes}
              className="flex-grow md:flex-grow-0 bg-slate-900 hover:bg-sky-500 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md active:scale-95"
            >
              Run Code
            </button>
          </div>
        </header>

        {/* --- MAIN WORKSPACE --- */}
        
        <main className="flex-grow flex flex-col lg:flex-row gap-6 min-h-0">
          {/* EDITOR SECTION */}
          <div className="flex-[3] bg-white rounded-2xl border border-slate-200/60 shadow-xl shadow-slate-200/40 overflow-hidden flex flex-col min-h-[400px] lg:min-h-0">
            <div className="px-8 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
                </div>
                <span className="ml-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Main Source File
                </span>
              </div>
            </div>

            <div className="flex-grow pt-4">
              <Editor
                height="100%"
                language={language}
                value={code}
                onChange={(val) => setCode(val ?? "")}
                options={{
                  fontSize: 15,
                  fontFamily: "'JetBrains Mono', monospace",
                  lineNumbers: "on",
                  minimap: { enabled: true },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 4,
                  wordWrap: "on",
                  padding: { top: 20 },
                  cursorBlinking: "smooth",
                  renderLineHighlight: "all",
                  fontWeight: "500",
                }}
              />
            </div>
          </div>

          {/* CONSOLE SECTION */}
          <div className="flex-[1] flex flex-col gap-6 h-full">
            {/* Input Card */}
            <div className="bg-white rounded-[2rem] border border-slate-200/60 p-6 shadow-lg shadow-slate-200/20">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">
                Input Stream
              </h3>
              <textarea
                className="w-full h-32 md:h-40 bg-slate-50 rounded-2xl p-4 text-sm font-medium outline-none focus:ring-2 ring-sky-100 transition-all resize-none placeholder:text-slate-300"
                placeholder="Standard Input..."
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  //  console.log(input);
                }}
              />
            </div>

            
            <div className="flex-grow min-h-[200px] bg-slate-900 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] opacity-20"></div>
              <div className="relative h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Output Stream
                  </h3>
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${loadingRes ? "bg-amber-500 animate-bounce" : "bg-emerald-500 animate-pulse"}`}
                  ></div>
                </div>

                {/* Main Result Area */}
                <div
                  className={`flex-grow font-mono text-sm leading-relaxed whitespace-pre-wrap ${loadingRes ? "text-slate-500 italic" : "text-sky-400/90"}`}
                >
                  {">"} {output.output}
                </div>

                {/* Metrics Footer */}
                {!loadingRes && output.time !== null && (
                  <div className="mt-4 pt-4 border-t border-slate-800/50 flex gap-6">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                        Execution Time
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {output.time}s
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                        Memory Peak
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {output.memory} KB
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* FOOTER STATS */}
        <footer className="flex items-center justify-between px-4 pb-2 opacity-40">
          <div className="flex gap-6 text-[9px] font-bold uppercase tracking-widest">
            <span>Uplink: Active</span>
            <span>Latency: Low</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default Playground;
