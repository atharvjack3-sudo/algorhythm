import React, { useEffect, useState } from "react";
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
      try {
        const res = await api.get(`/contests/problems/${problemId}`);
        setData(res.data);
      } catch (err) { 
        console.error("Problem fetch failed"); 
      }
    }
    if (user) loadProblem();
  }, [problemId, user]);

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
      <div className="min-h-screen bg-[#e4e4e4] dark:bg-[#121212] flex items-center justify-center font-['verdana','arial','sans-serif'] text-[13px]">
        <div className="text-[#3b5998] dark:text-[#8ab4f8] font-bold">Loading problem statement...</div>
      </div>
    );
  }

  const { problem, content, samples } = data;

  // Reusable Editor Component
  const CodeEditorSection = (
    <div className="mt-8 border border-[#b9b9b9] dark:border-[#444] bg-white dark:bg-[#1e1e1e] rounded-[3px] shadow-sm">
      <div className="bg-[#e1e1e1] dark:bg-[#2d2d30] border-b border-[#b9b9b9] dark:border-[#444] p-[5px_10px] font-bold text-[13px] text-[#3b5998] dark:text-[#8ab4f8]">
        Submit Code
      </div>
      <div className="p-4">
        <div className="mb-3 flex items-center gap-3">
          <label className="text-[13px] font-bold text-[#222] dark:text-[#d4d4d4]">Language:</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-white dark:bg-[#121212] border border-[#ccc] dark:border-[#555] text-[#222] dark:text-[#d4d4d4] px-2 py-1 text-[13px] outline-none focus:border-[#3b5998] dark:focus:border-[#8ab4f8]"
          >
            <option value="cpp">GNU C++</option>
            <option value="java">Java</option>
            <option value="python">Python 3</option>
            <option value="javascript">JavaScript (Node.js)</option>
          </select>
        </div>
        
        <div className="h-[400px] border border-[#ccc] dark:border-[#444]">
          <Editor
            height="100%"
            language={language}
            value={code}
            theme={theme === "dark" ? "vs-dark" : "vs-light"}
            options={{
              fontSize: 14,
              fontFamily: "Consolas, 'Courier New', monospace",
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
            }}
            onChange={(v) => setCode(v || "")}
          />
        </div>
        
        <div className="mt-4 flex gap-3">
          <button 
            onClick={handleRun} 
            disabled={runLoading}
            className="px-6 py-1.5 bg-[#e1e1e1] dark:bg-[#333] border border-[#ccc] dark:border-[#555] hover:bg-[#d1d1d1] dark:hover:bg-[#444] text-[#222] dark:text-[#d4d4d4] font-bold text-[13px] cursor-pointer disabled:opacity-50"
          >
            {runLoading ? "Running..." : "Run Code"}
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={submitting}
            className="px-6 py-1.5 bg-[#1874cd] border border-[#1874cd] hover:bg-[#0000a0] text-white font-bold text-[13px] cursor-pointer disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-[#e4e4e4] dark:bg-[#121212] text-[#222] dark:text-[#d4d4d4] font-['verdana','arial','sans-serif'] pb-10">
      <div className="max-w-[1050px] mx-auto bg-white dark:bg-[#1e1e1e] min-h-screen border-l border-r border-[#ccc] dark:border-[#333] p-6">
        
        {/* --- TABS MENU --- */}
        <div className="border-b border-[#b9b9b9] dark:border-[#444] mb-6 flex items-center justify-between">
          <ul className="flex m-0 p-0 list-none text-[13px] font-bold uppercase">
            {TABS.map((t) => (
              <li 
                key={t} 
                onClick={() => setActiveTab(t)}
                className={`mr-6 pb-2 cursor-pointer hover:text-[#1874cd] dark:hover:text-[#5ea2f0] transition-colors ${
                  activeTab === t 
                    ? "text-[#222] dark:text-[#fff] border-b-[3px] border-[#1874cd] dark:border-[#5ea2f0]" 
                    : "text-[#1874cd] dark:text-[#5ea2f0]"
                }`}
              >
                {t}
              </li>
            ))}
          </ul>
          <div className="text-[12px] text-[#888] dark:text-[#aaa] pb-2 font-bold cursor-pointer hover:underline" onClick={() => navigate(`/contests/${contestId}`)}>
            &laquo; Back to Contest
          </div>
        </div>

        {/* --- PROBLEM TAB --- */}
        {activeTab === "Problem" && (
          <div className="animate-in fade-in duration-300">
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-[21px] font-normal text-[#3b5998] dark:text-[#8ab4f8] mb-1">
                {problem.problem_index}. {problem.title}
              </h2>
              <div className="text-[13px]">time limit per test: 2 seconds</div>
              <div className="text-[13px]">memory limit per test: 256 megabytes</div>
            </div>

            {/* Markdown Content */}
            <div className="text-[14px] leading-relaxed markdown-content cf-markdown">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm, remarkMath]} 
                rehypePlugins={[rehypeKatex, rehypeHighlight]}
              >
                {content.statement}
              </ReactMarkdown>

              {content.input_format && (
                <>
                  <div className="font-bold text-[15px] mt-6 mb-2">Input</div>
                  <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {content.input_format}
                  </ReactMarkdown>
                </>
              )}

              {content.output_format && (
                <>
                  <div className="font-bold text-[15px] mt-6 mb-2">Output</div>
                  <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {content.output_format}
                  </ReactMarkdown>
                </>
              )}

              {content.constraints && (
                <>
                  <div className="font-bold text-[15px] mt-6 mb-2">Constraints</div>
                  <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {content.constraints}
                  </ReactMarkdown>
                </>
              )}

              {/* Examples Section */}
              <div className="font-bold text-[15px] mt-8 mb-2">Example</div>
              <div className="space-y-4">
                {samples.map((s, i) => (
                  <div key={i} className="border border-[#ccc] dark:border-[#444] rounded text-[13px] font-mono">
                    <div className="bg-[#efefef] dark:bg-[#2d2d30] p-1.5 font-bold border-b border-[#ccc] dark:border-[#444] text-[#222] dark:text-[#d4d4d4]">
                      Input
                    </div>
                    <pre className="p-3 bg-white dark:bg-[#1e1e1e] whitespace-pre-wrap leading-relaxed m-0 text-[#222] dark:text-[#d4d4d4]">
                      {s.input}
                    </pre>
                    
                    <div className="bg-[#efefef] dark:bg-[#2d2d30] p-1.5 font-bold border-b border-t border-[#ccc] dark:border-[#444] text-[#222] dark:text-[#d4d4d4]">
                      Output
                    </div>
                    <pre className="p-3 bg-white dark:bg-[#1e1e1e] whitespace-pre-wrap leading-relaxed m-0 text-[#222] dark:text-[#d4d4d4]">
                      {s.output}
                    </pre>
                  </div>
                ))}
              </div>
            </div>

            {/* Injected Code Editor at Bottom of Problem Page */}
            {CodeEditorSection}
          </div>
        )}

        {/* --- RUN TAB --- */}
        {activeTab === "Run" && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-[16px] mb-4 font-normal text-[#3b5998] dark:text-[#8ab4f8]">Execution Results</h2>
            {runError && (
              <div className="mb-4 font-bold text-[#ff0000] dark:text-[#ff6666] border border-[#ff0000] p-3 bg-[#ffe3e3] dark:bg-[#3d1818] rounded">
                Error: {runError}
              </div>
            )}
            
            {runResults.length === 0 && !runError ? (
              <div className="p-6 text-[#888] dark:text-[#aaa] italic border border-[#ccc] dark:border-[#444] bg-[#f8f8f8] dark:bg-[#252526]">
                No code executed yet. Run your code to see outputs here.
              </div>
            ) : (
              runResults.map((r, i) => (
                <div key={i} className="mb-6 border border-[#ccc] dark:border-[#444] rounded text-[13px] font-mono">
                  <div className="bg-[#e1e1e1] dark:bg-[#2d2d30] p-2 font-bold border-b border-[#ccc] dark:border-[#444] text-[#3b5998] dark:text-[#8ab4f8]">
                    Test #{r.sample || r.index}
                  </div>
                  
                  <div className="p-2 font-bold bg-[#f8f8f8] dark:bg-[#252526] border-b border-[#ccc] dark:border-[#444]">Output</div>
                  <pre className="p-3 bg-white dark:bg-[#1e1e1e] whitespace-pre-wrap m-0 text-[#008000] dark:text-[#00cc00]">
                    {r.output || "(null)"}
                  </pre>
                  
                  <div className="p-2 font-bold bg-[#f8f8f8] dark:bg-[#252526] border-y border-[#ccc] dark:border-[#444]">Expected</div>
                  <pre className="p-3 bg-white dark:bg-[#1e1e1e] whitespace-pre-wrap m-0 text-[#222] dark:text-[#d4d4d4]">
                    {r.expected}
                  </pre>
                </div>
              ))
            )}
            {CodeEditorSection}
          </div>
        )}

        {/* --- RESULT TAB --- */}
        {activeTab === "Result" && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-[16px] mb-4 font-normal text-[#3b5998] dark:text-[#8ab4f8]">Submission Verdict</h2>
            {!lastResult ? (
              <div className="p-6 text-[#888] dark:text-[#aaa] italic border border-[#ccc] dark:border-[#444] bg-[#f8f8f8] dark:bg-[#252526]">
                Submit your code to see the final verdict.
              </div>
            ) : (
              <div>
                <div className={`p-4 mb-6 border font-bold text-[16px] ${
                  lastResult.verdict === "AC" || lastResult.verdict === "Accepted" 
                  ? "bg-[#d4edc9] dark:bg-[#1a381a] border-[#00a900] dark:border-[#00cc00] text-[#00a900] dark:text-[#00cc00]" 
                  : "bg-[#ffe3e3] dark:bg-[#3d1818] border-[#ff0000] dark:border-[#ff6666] text-[#ff0000] dark:text-[#ff6666]"
                }`}>
                  Verdict: {lastResult.verdict}
                </div>

                <table className="w-full text-center border-collapse text-[12px] border border-[#b9b9b9] dark:border-[#444]">
                  <thead>
                    <tr>
                      <th className="border border-[#e1e1e1] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-2 font-bold text-[#222] dark:text-[#d4d4d4]">Test Case</th>
                      <th className="border border-[#e1e1e1] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-2 font-bold text-[#222] dark:text-[#d4d4d4]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lastResult.samples && lastResult.samples.map((s, i) => (
                      <tr key={s.index} className={i % 2 === 0 ? "bg-white dark:bg-[#1e1e1e]" : "bg-[#f8f8f8] dark:bg-[#252526]"}>
                        <td className="border border-[#e1e1e1] dark:border-[#444] p-2 font-bold">
                          Test #{s.index}
                        </td>
                        <td className={`border border-[#e1e1e1] dark:border-[#444] p-2 font-bold ${
                          s.verdict === "AC" || s.verdict === "Accepted" 
                            ? "text-[#00a900] dark:text-[#00cc00]" 
                            : "text-[#ff0000] dark:text-[#ff6666]"
                        }`}>
                          {s.verdict}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* --- SUBMISSIONS TAB --- */}
{/* --- SUBMISSIONS TAB --- */}
        {activeTab === "Submissions" && (
          <div className="animate-in fade-in duration-300">
            <div className="border border-[#b9b9b9] dark:border-[#444] bg-white dark:bg-[#1e1e1e] rounded-[3px] overflow-hidden overflow-x-auto shadow-sm">
              <table className="w-full text-center border-collapse text-[12px] min-w-[700px]">
                <thead>
                  <tr>
                    <th className="border border-[#e1e1e1] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-2 font-bold text-[#222] dark:text-[#d4d4d4]">#</th>
                    <th className="border border-[#e1e1e1] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-2 font-bold text-[#222] dark:text-[#d4d4d4]">When</th>
                    <th className="border border-[#e1e1e1] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-2 font-bold text-[#222] dark:text-[#d4d4d4]">Problem</th>
                    <th className="border border-[#e1e1e1] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-2 font-bold text-[#222] dark:text-[#d4d4d4]">Lang</th>
                    <th className="border border-[#e1e1e1] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-2 font-bold text-[#222] dark:text-[#d4d4d4]">Verdict</th>
                    <th className="border border-[#e1e1e1] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-2 font-bold text-[#222] dark:text-[#d4d4d4]">Time</th>
                    <th className="border border-[#e1e1e1] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] p-2 font-bold text-[#222] dark:text-[#d4d4d4]">Memory</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="border border-[#e1e1e1] dark:border-[#444] p-6 text-[#888] dark:text-[#aaa]">
                        You haven't submitted anything yet.
                      </td>
                    </tr>
                  ) : (
                    submissions.map((s, i) => (
                      <tr 
                        key={s.submission_id || i} 
                        // Codeforces tints your own submissions with a light blue
                        className={i % 2 === 0 ? "bg-[#f3f9ff] dark:bg-[#1a2333]" : "bg-white dark:bg-[#1e1e1e]"}
                      >
                        {/* ID */}
                        <td className="border border-[#e1e1e1] dark:border-[#444] p-2">
                          <span 
                            className="text-[#1874cd] dark:text-[#5ea2f0] hover:underline cursor-pointer font-bold"
                            onClick={() => setViewCode(s)}
                            title="Click to view source code"
                          >
                            {s.submission_id}
                          </span>
                        </td>
                        
                        {/* When */}
                        <td className="border border-[#e1e1e1] dark:border-[#444] p-2 text-[#888] dark:text-[#aaa] whitespace-nowrap">
                          {formatCFDate(s.submitted_at)}
                        </td>

                        {/* Problem */}
                        <td className="border border-[#e1e1e1] dark:border-[#444] p-2">
                          <span 
                            className="text-[#1874cd] dark:text-[#5ea2f0] hover:underline cursor-pointer"
                            onClick={() => navigate(`/contests/${contestId}/solve/${s.problem_id}`)}
                          >
                            {s.problem_index} - {s.problem_title}
                          </span>
                        </td>

                        {/* Language */}
                        <td className="border border-[#e1e1e1] dark:border-[#444] p-2">
                          {s.language}
                        </td>

                        {/* Verdict */}
                        <td className={`border border-[#e1e1e1] dark:border-[#444] p-2 font-bold ${
                          s.verdict === "AC" || s.verdict === "Accepted" 
                            ? "text-[#00a900] dark:text-[#00cc00]" 
                            : "text-[#ff0000] dark:text-[#ff6666]"
                        }`}>
                          {s.verdict === "AC" ? "Accepted" : s.verdict}
                        </td>

                        {/* Time */}
                        <td className="border border-[#e1e1e1] dark:border-[#444] p-2 text-[#222] dark:text-[#d4d4d4]">
                          {s.time_ms !== null && s.time_ms !== undefined ? `${s.time_ms} ms` : "0 ms"}
                        </td>

                        {/* Memory */}
                        <td className="border border-[#e1e1e1] dark:border-[#444] p-2 text-[#222] dark:text-[#d4d4d4]">
                          {s.memory_kb !== null && s.memory_kb !== undefined ? `${s.memory_kb} KB` : "0 KB"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

            {/* --- SOURCE CODE MODAL --- */}
      {viewCode && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e1e1e] w-full max-w-3xl rounded shadow-2xl border border-[#ccc] dark:border-[#444] flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-3 border-b border-[#ccc] dark:border-[#444] bg-[#e1e1e1] dark:bg-[#2d2d30] flex justify-between items-center text-[13px]">
              <div className="font-bold text-[#3b5998] dark:text-[#8ab4f8]">
                Submission #{viewCode.submission_id} - {viewCode.problem_index} ({viewCode.language})
              </div>
              <button 
                onClick={() => setViewCode(null)} 
                className="text-[#ff0000] dark:text-[#ff6666] font-bold hover:underline cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* Modal Body (Code Viewer) */}
            <div className="flex-1 overflow-auto p-4 bg-[#f8f8f8] dark:bg-[#121212]">
              <pre className="text-[13px] font-mono text-[#222] dark:text-[#d4d4d4] whitespace-pre-wrap m-0">
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
