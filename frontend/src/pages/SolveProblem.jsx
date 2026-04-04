import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import Editor from "@monaco-editor/react";
import { InlineMath } from "react-katex";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { lazy, Suspense } from "react";

const DiscussionTab = lazy(() =>
  import("../components/discussion/DiscussionTab")
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
  // stores result of latest submission
  const [lastResult, setLastResult] = useState(null);
  const [complexity, setComplexity] = useState(null);

  // submission history
  const [submissions, setSubmissions] = useState([]);

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

      // save result for Result tab
      setLastResult(result);

      // push into submissions tab (local)
      setSubmissions((prev) => [
        {
          verdict: result.verdict,
          submitted_at: new Date().toISOString(),
          language,
        },
        ...prev,
      ]);

      // auto switch to Result tab
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

  // Fetch problem details
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

  // ---------- States ----------
  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-[#f8f9fa] text-[#5f6368]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-t-[#1a73e8] border-b-[#1a73e8] border-l-transparent border-r-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Loading problem...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-[#f8f9fa]">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-[#dadce0] text-center max-w-sm">
          <svg className="w-12 h-12 text-[#d93025] mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-[#202124] font-medium">{error}</p>
        </div>
      </div>
    );
  }

  const { problem, content, stats, topics, samples } = data;

  return (
    <div className="w-full h-[200vh] md:h-screen bg-[#f8f9fa] flex flex-col md:flex-row font-sans">
      
      {/* ===== LEFT PANEL ===== */}
      <section className="w-full md:w-[45%] md:min-w-[450px] h-[100vh] md:h-full bg-white border-b md:border-b-0 md:border-r border-[#dadce0] flex flex-col relative z-10 shadow-sm">
        
        {/* Header */}
        <div className="px-6 pt-6 pb-2">
          <h1 className="text-[22px] leading-tight font-medium text-[#202124] mb-3">
            {problemId}. {problem.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span
              className={`px-2.5 py-0.5 rounded-md text-xs font-medium border ${
                problem?.difficulty === "easy"
                  ? "bg-[#e6f4ea] text-[#1e8e3e] border-[#ceead6]"
                  : problem?.difficulty === "medium"
                  ? "bg-[#fef7e0] text-[#b06000] border-[#fde293]"
                  : "bg-[#fce8e6] text-[#d93025] border-[#fad2cf]"
              }`}
            >
              {problem?.difficulty.charAt(0).toUpperCase() + problem?.difficulty.slice(1)}
            </span>

            <span className="text-[#5f6368] text-xs font-medium">
              Acceptance: {stats.acceptance_rate ?? "—"}%
            </span>

            {solved && (
              <span className="flex items-center text-xs font-medium text-[#1e8e3e] bg-[#e6f4ea] px-2.5 py-0.5 rounded-md border border-[#ceead6]">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
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
                  className="px-2 py-1 rounded bg-[#f1f3f4] text-[11px] font-medium text-[#5f6368]"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-[#dadce0] mt-2 scrollbar-hide px-2">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-medium transition-colors relative whitespace-nowrap
                ${
                  activeTab === tab
                    ? "text-[#1a73e8]"
                    : "text-[#5f6368] hover:text-[#202124] hover:bg-[#f8f9fa] rounded-t-md"
                }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1a73e8] rounded-t-sm"></div>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 text-sm text-[#3c4043]">
          
          {/* Discussion */}
          {activeTab === "Discussion" && (
            <Suspense
              fallback={
                <div className="py-10 text-center text-sm text-[#5f6368]">
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
              <div className="prose prose-sm max-w-none text-[#202124]">
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {content.statement}
                </ReactMarkdown>
              </div>

              {content.constraints && (
                <div>
                  <h3 className="text-[15px] font-medium text-[#202124] mb-3">
                    Constraints
                  </h3>
                  <div className="bg-[#f8f9fa] border border-[#dadce0] p-4 rounded-md">
                    <div className="prose prose-sm max-w-none font-mono text-[13px] text-[#3c4043] whitespace-pre-line">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-[15px] font-medium text-[#202124] mb-3">
                    Input Format
                  </h3>
                  <div className="bg-[#f8f9fa] border border-[#dadce0] p-4 rounded-md h-full">
                    <pre className="text-[13px] whitespace-pre-line text-[#3c4043] font-sans">
                      {content.input_format}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-[15px] font-medium text-[#202124] mb-3">
                    Output Format
                  </h3>
                  <div className="bg-[#f8f9fa] border border-[#dadce0] p-4 rounded-md h-full">
                    <pre className="text-[13px] whitespace-pre-line text-[#3c4043] font-sans">
                      {content.output_format}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="space-y-6 pt-2">
                {samples.map((s, i) => (
                  <div key={i} className="border border-[#dadce0] rounded-lg overflow-hidden bg-white">
                    <div className="bg-[#f1f3f4] px-4 py-2 border-b border-[#dadce0] flex justify-between items-center">
                      <h3 className="text-[13px] font-medium text-[#202124]">Example {i + 1}</h3>
                    </div>
                    <div className="flex flex-col md:flex-row">
                      <div className="flex-1 border-b md:border-b-0 md:border-r border-[#dadce0] p-4 bg-[#f8f9fa]">
                        <div className="text-[11px] uppercase tracking-wider font-semibold text-[#5f6368] mb-2">Input</div>
                        <pre className="text-[13px] font-mono text-[#202124] whitespace-pre-wrap">{s.input}</pre>
                      </div>
                      <div className="flex-1 p-4 bg-white">
                        <div className="text-[11px] uppercase tracking-wider font-semibold text-[#5f6368] mb-2">Output</div>
                        <pre className="text-[13px] font-mono text-[#202124] whitespace-pre-wrap">{s.output}</pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== EDITORIAL ===== */}
          {activeTab === "Editorial" && (
            <div className="prose prose-sm max-w-none">
              <p className="text-[#3c4043] leading-relaxed">
                {data.content.editorial}
              </p>
            </div>
          )}

          {/* ===== RUN ===== */}
          {activeTab === "Run" && (
            <div className="space-y-4">
              {runError && (
                <div className="p-4 text-sm bg-[#fce8e6] border border-[#fad2cf] text-[#d93025] rounded-md flex items-start gap-3">
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{runError}</span>
                </div>
              )}

              {runResults.length === 0 ? (
                <div className="text-center py-16 flex flex-col items-center">
                  <svg className="w-12 h-12 text-[#dadce0] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-[#5f6368] font-medium">Run your code to evaluate sample test cases</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {runResults.map((r) => (
                    <div key={r.sample} className="border border-[#dadce0] rounded-lg overflow-hidden bg-white">
                      <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#dadce0]">
                        <span className="font-medium text-[#202124]">Test Case {r.sample}</span>
                      </div>
                      <div className="p-4 space-y-4">
                        <div>
                          <p className="text-[12px] font-semibold text-[#5f6368] mb-1.5">Your Output</p>
                          <pre className="bg-[#f8f9fa] border border-[#dadce0] p-3 rounded-md text-[13px] font-mono text-[#202124]">
                            {r.output || "(empty)"}
                          </pre>
                        </div>
                        <div>
                          <p className="text-[12px] font-semibold text-[#5f6368] mb-1.5">Expected Output</p>
                          <pre className="bg-[#f8f9fa] border border-[#dadce0] p-3 rounded-md text-[13px] font-mono text-[#202124]">
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
                  <svg className="w-12 h-12 text-[#dadce0] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-[#5f6368] font-medium">No active submission found.</p>
                </div>
              ) : (
                <>
                  <div className={`p-5 rounded-md border flex items-center gap-4 ${
                    lastResult.verdict === "AC"
                      ? "bg-[#e6f4ea] border-[#ceead6] text-[#1e8e3e]"
                      : "bg-[#fce8e6] border-[#fad2cf] text-[#d93025]"
                  }`}>
                    {lastResult.verdict === "AC" ? (
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    ) : (
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                    )}
                    <div>
                      <h2 className="text-xl font-medium">
                        {lastResult.verdict === "AC" ? "Accepted" : "Wrong Answer / Error"}
                      </h2>
                      <p className="text-sm opacity-90 font-medium">Verdict: {lastResult.verdict}</p>
                    </div>
                  </div>

                  <div className="border border-[#dadce0] rounded-md bg-white overflow-hidden">
                    <div className="bg-[#f8f9fa] px-4 py-3 border-b border-[#dadce0]">
                      <span className="font-medium text-[#202124]">Test Cases Breakdown</span>
                    </div>
                    <ul className="divide-y divide-[#dadce0]">
                      {lastResult.samples.map((s) => (
                        <li key={s.index} className="px-4 py-3 flex items-center justify-between">
                          <span className="text-[13px] font-medium text-[#3c4043]">Sample #{s.index}</span>
                          <span className={`text-[13px] font-bold ${s.verdict === "AC" ? "text-[#1e8e3e]" : "text-[#d93025]"}`}>
                            {s.verdict}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {lastResult.hidden_failed && (
                    <div className="p-4 bg-[#fce8e6] border border-[#fad2cf] rounded-md text-[#d93025] text-sm font-medium">
                      Hidden Test Failure: {lastResult.hidden_failed}
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
                  <svg className="w-12 h-12 text-[#dadce0] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-[#5f6368] font-medium">No past submissions</p>
                </div>
              ) : (
                <div className="border border-[#dadce0] rounded-md bg-white overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#f8f9fa] border-b border-[#dadce0] text-[12px] uppercase text-[#5f6368]">
                        <th className="px-4 py-3 font-medium">ID</th>
                        <th className="px-4 py-3 font-medium">Time Submitted</th>
                        <th className="px-4 py-3 font-medium text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#dadce0]">
                      {submissions.map((s, i) => (
                        <tr 
                          key={i} 
                          onClick={() => setOpenSubmission(s)}
                          className="hover:bg-[#f8f9fa] cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-3 text-[13px] font-medium text-[#1a73e8]">
                            #{submissions.length - i}
                          </td>
                          <td className="px-4 py-3 text-[13px] text-[#5f6368]">
                            {new Date(s.submitted_at).toLocaleString(undefined, { 
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                            })}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[12px] font-bold ${
                              s.verdict === "AC" 
                                ? "bg-[#e6f4ea] text-[#1e8e3e]" 
                                : "bg-[#fce8e6] text-[#d93025]"
                            }`}>
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

      {/* ===== RIGHT PANEL EDITOR ===== */}
      <section className="w-full md:flex-1 h-[100vh] md:h-full flex flex-col bg-[#f8f9fa] overflow-hidden">
        
        {/* Editor Toolbar */}
        <div className="h-14 bg-white border-b border-[#dadce0] flex items-center justify-between px-4 shadow-sm z-10 flex-shrink-0">
          <div className="flex items-center gap-4">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-[#f8f9fa] border border-[#dadce0] text-[#3c4043] text-sm rounded px-3 py-1.5 focus:outline-none focus:border-[#1a73e8] hover:bg-[#f1f3f4] transition-colors cursor-pointer"
            >
              <option value="cpp">C++17</option>
              <option value="java">Java</option>
              <option value="python">Python 3</option>
              <option value="javascript">JavaScript</option>
            </select>
          </div>

          <div className="flex gap-3 items-center">
            {authLoading ? (
              <span className="text-sm text-[#5f6368]">Checking auth...</span>
            ) : user ? (
              <>
                <button
                  onClick={handleRun}
                  disabled={runLoading || submitting}
                  className="px-5 py-1.5 text-[13px] font-medium rounded border border-[#dadce0] text-[#202124] hover:bg-[#f8f9fa] disabled:opacity-50 transition-colors"
                >
                  {runLoading ? "Running..." : "Run Code"}
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={submitting || runLoading}
                  className="px-5 py-1.5 text-[13px] font-medium rounded bg-[#1a73e8] text-white hover:bg-[#1557b0] shadow-sm disabled:opacity-60 transition-colors"
                >
                  {submitting ? "Submitting..." : "Submit"}
                </button>
              </>
            ) : (
              <span className="text-sm text-[#5f6368]">
                Please{" "}
                <a href="/auth" className="text-[#1a73e8] font-medium hover:underline">
                  sign in
                </a>{" "}
                to submit.
              </span>
            )}
          </div>
        </div>

        {submitError && (
          <div className="bg-[#fce8e6] text-[#d93025] px-4 py-2 text-sm border-b border-[#fad2cf] flex-shrink-0">
            {submitError}
          </div>
        )}

        {/* Monaco Editor Container */}
        <div className="flex-1 w-full bg-white relative">
          <Editor
            height="100%"
            language={language}
            theme="vs-light"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white w-[90%] max-w-4xl h-[85vh] rounded-xl shadow-2xl overflow-hidden flex flex-col border border-[#dadce0]">
            
            {/* Modal Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-[#dadce0] bg-[#f8f9fa]">
              <div className="flex items-center gap-4">
                <h2 className="text-[18px] font-medium text-[#202124]">Submission Details</h2>
                <span
                  className={`text-[12px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider ${
                    openSubmission.verdict === "AC"
                      ? "bg-[#e6f4ea] text-[#1e8e3e] border border-[#ceead6]"
                      : "bg-[#fce8e6] text-[#d93025] border border-[#fad2cf]"
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
                    className="text-[13px] font-medium px-4 py-1.5 rounded bg-white border border-[#dadce0] text-[#1a73e8] hover:bg-[#f8f9fa] disabled:opacity-60 transition-colors shadow-sm"
                  >
                    {complexity?.id === openSubmission.id ? "Analyzed" : "AI Complexity Analysis"}
                  </button>
                )}

                <button
                  onClick={() => setOpenSubmission(null)}
                  className="text-[#5f6368] hover:text-[#202124] p-1 rounded-full hover:bg-[#f1f3f4] transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* AI Complexity Dropdown */}
            <div
              className={`flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${
                complexity && complexity.id === openSubmission.id ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="px-6 py-4 border-b border-[#dadce0] bg-[#e8f0fe] text-sm flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#1a73e8]" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                  <span className="font-medium text-[#1a73e8]">AI Analysis Insight</span>
                </div>
                
                <div className="flex gap-8 text-[#3c4043] pl-7">
                  <p>
                    <span className="font-medium text-[#202124]">Time:</span>{" "}
                    <span className="bg-white px-2 py-0.5 rounded border border-[#dadce0] ml-1"><InlineMath math={complexity?.time} /></span>
                  </p>
                  <p>
                    <span className="font-medium text-[#202124]">Space:</span>{" "}
                    <span className="bg-white px-2 py-0.5 rounded border border-[#dadce0] ml-1"><InlineMath math={complexity?.space} /></span>
                  </p>
                </div>
              </div>
            </div>

            {/* Readonly Editor */}
            <div className="flex-1 bg-white relative">
              <Editor
                height="100%"
                language={openSubmission.language || "cpp"}
                value={openSubmission.code}
                theme="vs-light"
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
                  padding: { top: 16 }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}