import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { api } from "../api/client";
import Editor from "@monaco-editor/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import CustomTC from "../components/CustomTC";
import "katex/dist/katex.min.css";
import SubmissionAnim from "../components/submissionAnim";
import {
  ClipboardCopy,
  RefreshCcw,
  CheckCheck,
  XSquare,
  HelpCircle,
  CodeXml,
  PlaySquare,
  ListChecks,
  SendHorizonal,
  Terminal,
  ChevronDown,
  GitCommit
} from "lucide-react";
import "./css/scrollbar.css";

const themeModules = import.meta.glob("../themes/*.json");
export const AVAILABLE_THEMES = Object.keys(themeModules)
  .map((path) => path.split("/").pop().replace(".json", ""))
  .sort();

export async function loadMonacoTheme(monaco, themeName) {
  const path = `../themes/${themeName}.json`;
  const loader = themeModules[path];

  if (!loader) return;
  const theme = await loader();

  monaco.editor.defineTheme(themeName, theme.default);
  monaco.editor.setTheme(themeName);
}

const TABS = [
  { id: "Problem", icon: CodeXml },
  { id: "Submissions", icon: GitCommit },
  { id: "Run", icon: PlaySquare },
  { id: "Result", icon: ListChecks },
];

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
        prose-a:text-blue-600 dark:prose-a:text-blue-500
        
        [&_:not(pre)>code]:font-mono [&_:not(pre)>code]:text-[12px] [&_:not(pre)>code]:bg-slate-200/50 dark:[&_:not(pre)>code]:bg-[#1e1e1e] [&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:rounded-[3px] [&_:not(pre)>code]:border [&_:not(pre)>code]:border-slate-300/50 dark:[&_:not(pre)>code]:border-slate-700/50
        
        [&_:not(pre)>code::before]:content-none [&_:not(pre)>code::after]:content-none
        
        prose-pre:p-0 prose-pre:bg-slate-50 dark:prose-pre:bg-[#050608] prose-pre:border prose-pre:border-slate-200 dark:prose-pre:border-slate-800 prose-pre:rounded-[3px]
        
        [&_pre_code.hljs]:!bg-transparent [&_pre_code.hljs]:p-4 [&_pre_code.hljs]:!font-mono [&_pre_code.hljs]:!text-[13px] [&_pre_code.hljs]:!leading-[1.6]
        
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

const boilerPlate = {
  "cpp" : "#include<bits/stdc++.h>\nusing namespace std;\n\nint main() {\n\t// Start Coding Here\n}",  
  "java" : "public class Solution {\n\tpublic static void main(String args[]) {\n\t\t// Start Coding Here\n\t}\n}",
  "python" : "# Start Coding Here",
  "javascript" : "// Start Coding Here"
}

export default function ContestSolveProblem() {
  const { contestId, problemId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [editorTheme, setEditorTheme] = useState(
    theme === "dark" ? "vs-dark" : "light",
  );
  const [activeTab, setActiveTab] = useState("Problem");
  const [data, setData] = useState(null);
  const [language, setLanguage] = useState(localStorage.getItem("default_language") || "cpp");
  const [code, setCode] = useState(localStorage.getItem(`last_local_save_${problemId}_${language}`) || boilerPlate[language]);

  const [runLoading, setRunLoading] = useState(false);
  const [runResults, setRunResults] = useState([]);
  const [runError, setRunError] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [submissions, setSubmissions] = useState([]);

  const [viewCode, setViewCode] = useState(null);
  const [isEnded, setIsEnded] = useState(false);
  
  const monacoRef = useRef(null);
  const editorRef = useRef(null);
  const handleSubmitRef = useRef(handleSubmit);
  const handleRunRef = useRef(handleRun);

  /* =========================
     RESIZER LOGIC
  ========================= */
  const [leftWidth, setLeftWidth] = useState(48);
  const [isDragging, setIsDragging] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  
  const [copySuccess, setCopySuccess] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [langOpen, setLanguageOpen] = useState(false);
  const themeDropdownRef = useRef(null);
  const langDropdownRef = useRef(null);

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

  function handleEditorDidMount(editor, monaco) {
    editorRef.current = editor;
    monacoRef.current = monaco;
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      handleSubmitRef.current();
    });
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter,
      () => {
        handleRunRef.current();
      },
    );
    applyTheme();
  }

  function handleBeforeMount(monaco) {
    monacoRef.current = monaco;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {}
  };

  const handleTestCopy = async (content) => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
    handleRunRef.current = handleRun;
  }, [handleSubmit, handleRun]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(e.target)) {
        setThemeOpen(false);
      }
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target)) {
        setLanguageOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (theme === "light") setEditorTheme("light");
    else if (editorTheme !== "vs-dark") setEditorTheme("Algorhythm-Dark");
  }, [theme]);

  useEffect(() => {
    if (!monacoRef.current || editorTheme === "vs-dark" || editorTheme === "light") return;
    loadMonacoTheme(monacoRef.current, editorTheme).then(() => {
      monacoRef.current.editor.setTheme(editorTheme);
    });
  }, [editorTheme]);

  async function applyTheme() {
    if (theme === "light") {
      setEditorTheme("light");
    } else {
      await loadMonacoTheme(monacoRef.current, "Algorhythm-Dark");
      setEditorTheme("Algorhythm-Dark");
    }
  }

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
        const end = new Date(problemData.contest.end_time).getTime();
        setIsEnded(Date.now() > end);
      };

      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setProblemState(JSON.parse(cached));
        return;
      }

      try {
        const res = await api.get(
          `/contests/${contestId}/problems/${problemId}`,
        );
        sessionStorage.setItem(cacheKey, JSON.stringify(res.data));
        setProblemState(res.data);
      } catch (err) {
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
      if (newWidth > 20 && newWidth < 57) {
        setLeftWidth(newWidth);
      }
    };

    const handleMouseUp = () => setIsDragging(false);

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

  async function handleRun() {
    if (!code.trim()) return;
    try {
      setActiveTab("Run");
      setRunLoading(true);
      setRunError(null);
      setRunResults([]);
      const res = await api.post("/run", { problemId, language, code });
      setRunResults(res.data.samples);
    } catch (err) {
      setRunError(err.response?.data?.error || "Run failed");
    } finally {
      setRunLoading(false);
    }
  }

  async function handleSubmit() {
    if (!user) return navigate("/auth");
    try {
      setActiveTab("Result");
      setSubmitting(true);
      const res = await api.post(`/contests/${contestId}/submit`, {
        problemId,
        language,
        code,
      });
      setLastResult(res.data);
      if (res.data.samples) setRunResults(res.data.samples);

      sessionStorage.removeItem(`dashboard_data_${user.id}`);
      await loadSubmissions();
    } catch (err) {
      console.error("Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (!data || authLoading) {
    return (
      <div className="w-full h-[calc(100vh-56px)] flex items-center justify-center bg-slate-50 dark:bg-[#050608] relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,theme(colors.gray.400/20%)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.gray.400/20%)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,theme(colors.slate.900/50%)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.slate.900/50%)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0"></div>
        <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tracking-[0.2em] animate-pulse uppercase relative z-10">
          INITIALIZING WORKSPACE...
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
        
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 3px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }

        .hljs { color: #24292e; }
        .hljs-keyword, .hljs-built_in { color: #d73a49; font-weight: 600; }
        .hljs-string, .hljs-meta { color: #032f62; }
        .hljs-number, .hljs-literal { color: #005cc5; }
        .hljs-title, .hljs-function { color: #6f42c1; font-weight: 600; }
        .hljs-comment { color: #6a737d; font-style: italic; }
        .hljs-type { color: #005cc5; font-weight: 600; }
        .hljs-operator, .hljs-punctuation { color: #24292e; }
        .dark .hljs { color: #c9d1d9; }
        .dark .hljs-keyword, .dark .hljs-built_in { color: #ff7b72; font-weight: 600; }
        .dark .hljs-string, .dark .hljs-meta { color: #a5d6ff; }
        .dark .hljs-number, .dark .hljs-literal { color: #79c0ff; }
        .dark .hljs-title, .dark .hljs-function { color: #d2a8ff; font-weight: 600; }
        .dark .hljs-comment { color: #8b949e; font-style: italic; }
        .dark .hljs-type { color: #79c0ff; font-weight: 600; }
        .dark .hljs-operator, .dark .hljs-punctuation { color: #c9d1d9; }
      `}</style>

      <div className="w-full h-[calc(100dvh-56px)] overflow-y-auto md:overflow-hidden bg-slate-50 dark:bg-[#050608] flex flex-col md:flex-row font-sans transition-colors duration-200 relative">
        
        <div className="absolute inset-0 bg-[linear-gradient(to_right,theme(colors.gray.400/20%)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.gray.400/20%)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,theme(colors.slate.900/50%)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.slate.900/50%)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0"></div>

        {isDragging && <div className="fixed inset-0 z-[200] cursor-col-resize" />}

        {/* =========================
            LEFT PANEL (Problem & Data)
        ========================= */}
        <section
          className="w-full min-h-[calc(100dvh-56px)] shrink-0 md:shrink md:min-h-0 md:h-full bg-white dark:bg-[#0d1117] flex flex-col relative z-10 transition-colors overflow-hidden border-r border-slate-200 dark:border-slate-800"
          style={isDesktop ? { width: `${leftWidth}%` } : {}}
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 flex-shrink-0 bg-slate-50 dark:bg-[#0a0c10] border-slate-200 dark:border-slate-800">
            <h1 className="font-sans text-2xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight flex items-center justify-between">
              <span>
                {problem.index}. {problem.title}
              </span>
            </h1>

            <div className="flex flex-wrap items-center gap-3">
              <span className="px-2.5 py-1 rounded-[3px] font-mono text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700">
                Time Limit: 2.0s
              </span>
              <span className="px-2.5 py-1 rounded-[3px] font-mono text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700">
                Memory Limit: 256MB
              </span>
            </div>
          </div>

          {/* IDE-Style Tabs */}
          <div className="flex justify-between items-center overflow-x-auto overflow-y-hidden bg-[#f3f4f6] dark:bg-[#0a0c10] custom-scrollbar flex-shrink-0 pr-4">
            <div className="flex">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-sans text-[12px] font-semibold tracking-wide transition-colors relative whitespace-nowrap cursor-pointer outline-none
                      ${isActive 
                        ? "bg-white dark:bg-[#0a0c10] text-slate-900 dark:text-orange-400 border-orange-400" 
                        : "bg-[#f8fafc] dark:bg-[#0a0c10] border-transparent text-slate-500 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-[#0d1117] border-t-transparent"
                      }`}
                  >
                    <Icon size={14} className={isActive ? "text-orange-400" : "text-slate-400"} />
                    {tab.id}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => navigate(`/contests/${contestId}/problems`)}
              className="px-4 py-1.5 rounded-[3px] font-mono text-[10px] cursor-pointer font-bold uppercase tracking-[0.1em] text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 dark:hover:text-slate-200 dark:hover:bg-slate-800/50 transition-colors bg-transparent border border-slate-300 dark:border-slate-700"
            >
              Back to Contest
            </button>
          </div>

          {/* Tab Content Area */}
          <div className="flex-1 overflow-y-auto p-6 text-[14px] text-slate-800 dark:text-slate-200 custom-scrollbar bg-white dark:bg-[#0d1117]">
            
            {/* ===== PROBLEM ===== */}
            {activeTab === "Problem" && (
              <div className="flex flex-col gap-8 pb-10">
                <MarkdownRenderer content={content.statement} />

                {content.constraints && (
                  <div className="flex flex-col gap-2">
                    <div className="font-mono text-[11px] font-bold tracking-[0.15em] text-slate-500 uppercase flex items-center gap-2">
                      <Terminal size={14} className="text-orange-500" /> Constraints
                    </div>
                    <div className="bg-slate-50 dark:bg-[#050608] border border-slate-200 dark:border-slate-800 p-4 rounded-[3px] shadow-sm">
                      <MarkdownRenderer content={content.constraints} className="font-mono text-[12px] whitespace-pre-line" />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  {content.input_format && (
                    <div className="flex flex-col gap-2 h-full">
                      <div className="font-mono text-[11px] font-bold tracking-[0.15em] text-slate-500 uppercase flex items-center gap-2">
                         Input Format
                      </div>
                      <div className="flex-1 bg-slate-50 dark:bg-[#050608] border border-slate-200 dark:border-slate-800 p-4 rounded-[3px] shadow-sm">
                        <MarkdownRenderer content={content.input_format} className="text-[13px] whitespace-pre-line" />
                      </div>
                    </div>
                  )}

                  {content.output_format && (
                    <div className="flex flex-col gap-2 h-full">
                      <div className="font-mono text-[11px] font-bold tracking-[0.15em] text-slate-500 uppercase flex items-center gap-2">
                         Output Format
                      </div>
                      <div className="flex-1 bg-slate-50 dark:bg-[#050608] border border-slate-200 dark:border-slate-800 p-4 rounded-[3px] shadow-sm">
                        <MarkdownRenderer content={content.output_format} className="text-[13px] whitespace-pre-line" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-5 pt-4">
                  <div className="font-mono text-[11px] font-bold tracking-[0.15em] text-slate-500 uppercase flex items-center gap-2">
                    <CodeXml size={14} className="text-orange-500" /> Examples
                  </div>
                  {samples.map((s, i) => (
                    <div key={i} className="border border-slate-200 dark:border-slate-800 rounded-[3px] overflow-hidden shadow-sm flex flex-col">
                      <div className="bg-slate-100 dark:bg-[#161b22] px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center">
                        <span className="font-mono text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                          Example {i + 1}
                        </span>
                      </div>
                      <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
                        <div className="flex-1 bg-white dark:bg-[#0d1117] flex flex-col">
                          <div className="px-4 py-1.5 border-b border-slate-100 dark:border-slate-800/50 font-mono text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em] bg-slate-50 flex justify-between dark:bg-[#0a0c10]">
                            <span>Input</span> <span><ClipboardCopy onClick={() => handleTestCopy(s.input)} className="text-slate-400 cursor-pointer dark:text-slate-600" size={13}/></span> 
                          </div>
                          <pre className="p-4 m-0 font-mono text-[13px] text-slate-800 dark:text-slate-300 whitespace-pre-wrap flex-1">
                            {s.input}
                          </pre>
                        </div>
                        <div className="flex-1 bg-white dark:bg-[#0d1117] flex flex-col">
                          <div className="px-4 py-1.5 border-b border-slate-100 flex justify-between dark:border-slate-800/50 font-mono text-[9px] font-bold text-slate-400 uppercase tracking-[0.1em] bg-slate-50 dark:bg-[#0a0c10]">
                            <span>Output</span> <span><ClipboardCopy onClick={() => handleTestCopy(s.output)} className="text-slate-400 cursor-pointer dark:text-slate-600" size={13}/></span> 
                          </div>
                          <pre className="p-4 m-0 font-mono text-[13px] text-slate-800 dark:text-slate-300 whitespace-pre-wrap flex-1">
                            {s.output}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===== RUN RESULTS ===== */}
            <div className={`${activeTab === "Run" ? "block" : "hidden"}`}>
              <div className="flex flex-col gap-6">
                {runLoading ? (
                  <SubmissionAnim />
                ) : (
                  <>
                    {runError && (
                      <div className="p-5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-[3px] shadow-sm">
                        <div className="font-mono text-[11px] font-bold text-red-600 dark:text-red-500 tracking-[0.15em] uppercase mb-2 flex items-center gap-2">
                          <Terminal size={14} /> Compilation / Runtime Error
                        </div>
                        <pre className="font-mono text-[12px] text-red-600 dark:text-red-400 whitespace-pre-wrap mt-3 bg-red-100/50 dark:bg-red-950/30 p-4 rounded-[3px]">
                          {runError}
                        </pre>
                      </div>
                    )}

                    {runResults.length === 0 ? (
                      <div className="px-4 py-20 text-center border border-slate-200 dark:border-slate-800 rounded-[3px] bg-slate-50 dark:bg-[#050608] shadow-sm font-sans text-[12px] font-semibold tracking-wide text-slate-500 dark:text-slate-400">
                        Run code to evaluate test cases
                      </div>
                    ) : (
                      <div className="flex flex-col gap-5">
                        {runResults.map((r, i) => {
                          const isMatch = r.verdict === "AC";
                          const isWA = r.verdict === "WA";
                          const verdictDisplay = isMatch ? "Matched" : isWA ? "Mismatch" : r.verdict;

                          return (
                            <div key={i} className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 rounded-[3px] overflow-hidden shadow-sm flex flex-col">
                              <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-[#161b22]">
                                <div className="flex items-center gap-3">
                                  <span className="font-mono text-[11px] font-bold tracking-[0.15em] text-slate-700 dark:text-slate-300 uppercase">
                                    Test Case {r.sample || r.index || i + 1}
                                  </span>
                                  <span className={`px-2.5 py-0.5 rounded-[3px] border font-sans text-[10px] font-semibold tracking-wide uppercase ${
                                      isMatch ? "bg-orange-50 dark:bg-orange-500/10 text-orange-500 dark:text-orange-400 border-orange-200 dark:border-orange-500/30"
                                      : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-500 border-red-200 dark:border-red-500/30"
                                    }`}>
                                    {verdictDisplay}
                                  </span>
                                </div>
                                <div className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-widest uppercase">
                                  {r.time !== undefined ? `${r.time} ms` : "- ms"}
                                  <span className="mx-2 text-slate-300 dark:text-slate-700">|</span>
                                  {r.memory !== undefined ? `${r.memory} KB` : "- KB"}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
                                <div>
                                  <div className="px-4 py-2 bg-slate-50 dark:bg-[#0a0c10] border-b border-slate-100 dark:border-slate-800/50 font-mono text-[9px] font-bold text-slate-500 uppercase tracking-[0.1em]">
                                    Your Output
                                  </div>
                                  <pre className={`p-4 m-0 font-mono text-[13px] whitespace-pre-wrap ${isMatch ? "text-orange-500 dark:text-orange-400" : "text-red-600 dark:text-red-500"}`}>
                                    {r.output || <span className="italic text-slate-400 dark:text-slate-600">No output</span>}
                                  </pre>
                                </div>
                                <div>
                                  <div className="px-4 py-2 bg-slate-50 dark:bg-[#0a0c10] border-b border-slate-100 dark:border-slate-800/50 font-mono text-[9px] font-bold text-slate-500 uppercase tracking-[0.1em]">
                                    Expected Output
                                  </div>
                                  <pre className="p-4 m-0 font-mono text-[13px] text-slate-800 dark:text-slate-300 whitespace-pre-wrap">
                                    {r.expected}
                                  </pre>
                                </div>
                              </div>

                              {r.error && (
                                <div className="border-t border-slate-200 dark:border-slate-800">
                                  <div className="px-4 py-2 bg-red-50 dark:bg-red-500/10 border-b border-red-200 dark:border-red-500/20 font-mono text-[9px] font-bold text-red-600 dark:text-red-500 uppercase tracking-[0.1em]">
                                    Stderr
                                  </div>
                                  <pre className="p-4 m-0 font-mono text-[12px] text-red-600 dark:text-red-400 whitespace-pre-wrap bg-white dark:bg-[#050608] max-h-48 overflow-y-auto">
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
                  <CustomTC setRunLoading={setRunLoading} lang={language} code={code} />
                </div>
              </div>
            </div>

            {/* ===== RESULT (Final Verdict) ===== */}
            {activeTab === "Result" && (
              <div className="flex flex-col gap-6">
                {submitting ? (
                  <div className="flex flex-col items-center justify-center py-20 px-4 bg-slate-50 dark:bg-[#050608] border border-slate-200 dark:border-slate-800 rounded-[3px] shadow-sm">
                    <RefreshCcw size={32} className="animate-spin text-orange-500 mb-4" />
                    <div className="font-mono text-[14px] font-bold text-slate-700 dark:text-slate-300 tracking-widest uppercase">
                      Judging submission...
                    </div>
                    <div className="mt-2 text-[10px] font-sans font-semibold text-slate-500 tracking-wide">
                      Please wait while your solution is being evaluated
                    </div>
                  </div>
                ) : (
                  <>
                    {!lastResult ? (
                      <div className="px-4 py-20 text-center border border-slate-200 dark:border-slate-800 rounded-[3px] bg-slate-50 dark:bg-[#050608] shadow-sm font-sans text-[12px] font-semibold tracking-wide text-slate-500 dark:text-slate-400">
                       Submit code to view final verdict 
                      </div>
                    ) : (
                      <>
                        <div className={`p-6 rounded-[3px] border shadow-sm flex flex-col items-center justify-center text-center ${
                            lastResult.verdict === "AC" || lastResult.verdict === "Accepted"
                              ? "bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/30"
                              : "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30"
                          }`}>
                          <h3 className={`font-mono text-3xl font-bold tracking-tight uppercase ${
                              lastResult.verdict === "AC" || lastResult.verdict === "Accepted" ? "text-orange-500 dark:text-orange-400" : "text-red-600 dark:text-red-500"
                            }`}>
                            {lastResult.verdict === "AC" ? "Accepted" : lastResult.verdict}
                          </h3>
                          <p className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-2">
                            Tested against all system cases
                          </p>
                        </div>

                        <div className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 rounded-[3px] overflow-hidden shadow-sm">
                          <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#161b22]">
                            <span className="font-mono text-[10px] font-bold tracking-[0.15em] text-slate-600 dark:text-slate-300 uppercase">
                              Test Cases Breakdown
                            </span>
                          </div>
                          <div className="w-full overflow-x-auto custom-scrollbar">
                            <table className="w-full border-collapse whitespace-nowrap text-left">
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                {lastResult.samples && lastResult.samples.map((s) => (
                                  <tr key={s.index} className="transition-colors odd:bg-white even:bg-slate-50 dark:odd:bg-[#0d1117] dark:even:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/80">
                                    <td className="px-5 py-3.5 font-mono text-[12px] font-bold text-slate-700 dark:text-slate-300">
                                      Test #{s.index}
                                    </td>
                                    <td className="px-5 py-3.5 text-right">
                                      <span className={`inline-flex px-2.5 py-1 rounded-[3px] border font-sans text-[10px] font-semibold tracking-wide ${
                                          s.verdict === "AC" || s.verdict === "Accepted"
                                            ? "bg-orange-50 dark:bg-orange-500/10 text-orange-500 dark:text-orange-400 border-orange-200 dark:border-orange-500/30"
                                            : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-500 border-red-200 dark:border-red-500/30"
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

                        {lastResult.verdict !== "AC" && lastResult.error && (
                          <div className="p-5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-[3px] shadow-sm">
                            <div className="font-mono text-[11px] font-bold text-red-600 dark:text-red-500 tracking-[0.15em] uppercase mb-2 flex items-center gap-2">
                              <Terminal size={14} /> Error Details
                            </div>
                            <pre className="font-mono text-[12px] text-red-600 dark:text-red-400 whitespace-pre-wrap mt-3 bg-red-100/50 dark:bg-red-950/30 p-4 rounded-[3px]">
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

            {/* ===== SUBMISSIONS (History) ===== */}
            {activeTab === "Submissions" && (
              <div className="flex flex-col gap-6">
                {submissions.length === 0 ? (
                  <div className="px-4 py-20 text-center border border-slate-200 dark:border-slate-800 rounded-[3px] bg-slate-50 dark:bg-[#050608] shadow-sm font-sans text-[12px] font-semibold tracking-wide text-slate-500 dark:text-slate-400">
                    You haven't submitted anything yet in the contest.
                  </div>
                ) : (
                  <div className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 rounded-[3px] overflow-hidden shadow-sm flex flex-col">
                    <div className="w-full overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead className="bg-slate-50 dark:bg-[#161b22] border-b border-slate-200 dark:border-slate-800">
                          <tr>
                            <th className="px-5 py-3.5 font-mono text-[10px] font-bold tracking-[0.15em] text-slate-500 dark:text-slate-400 uppercase w-20">ID</th>
                            <th className="px-5 py-3.5 font-mono text-[10px] font-bold tracking-[0.15em] text-slate-500 dark:text-slate-400 uppercase">When</th>
                            <th className="px-5 py-3.5 font-mono text-[10px] font-bold tracking-[0.15em] text-slate-500 dark:text-slate-400 uppercase">Problem</th>
                            <th className="px-5 py-3.5 font-mono text-[10px] font-bold tracking-[0.15em] text-slate-500 dark:text-slate-400 uppercase text-center">Lang</th>
                            <th className="px-5 py-3.5 font-mono text-[10px] font-bold tracking-[0.15em] text-slate-500 dark:text-slate-400 uppercase text-center">Verdict</th>
                            <th className="px-5 py-3.5 font-mono text-[10px] font-bold tracking-[0.15em] text-slate-500 dark:text-slate-400 uppercase text-right">Time</th>
                            <th className="px-5 py-3.5 font-mono text-[10px] font-bold tracking-[0.15em] text-slate-500 dark:text-slate-400 uppercase text-right">Memory</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                          {submissions.map((s, i) => (
                            <tr key={s.submission_id || i} className="transition-colors group odd:bg-white even:bg-slate-50 dark:odd:bg-[#0d1117] dark:even:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/80">
                              <td className="px-5 py-4 font-mono text-[12px] font-bold text-slate-500 dark:text-slate-500 group-hover:text-blue-500 transition-colors">
                                <span className="cursor-pointer" onClick={() => setViewCode(s)}>
                                  #{s.submission_id}
                                </span>
                              </td>
                              <td className="px-5 py-4 font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                                {formatCFDate(s.submitted_at)}
                              </td>
                              <td className="px-5 py-4">
                                <span className="font-sans text-[13px] font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 cursor-pointer transition-colors" onClick={() => navigate(`/contests/${contestId}/solve/${s.problem_id}`)}>
                                  {s.problem_index} - {s.problem_title}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-center font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                {s.language}
                              </td>
                              <td className="px-5 py-4 text-center">
                                <span className={`inline-flex px-2.5 py-1 rounded-[3px] border font-mono text-[9px] font-bold tracking-widest uppercase ${
                                    s.verdict === "AC" || s.verdict === "Accepted"
                                      ? "bg-orange-50 dark:bg-orange-500/10 text-orange-500 dark:text-orange-400 border-orange-200 dark:border-orange-500/30"
                                      : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-500 border-red-200 dark:border-red-500/30"
                                  }`}>
                                  {s.verdict}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-right font-mono text-[11px] text-slate-600 dark:text-slate-400">
                                {s.time_ms !== null && s.time_ms !== undefined ? `${s.time_ms} ms` : "0 ms"}
                              </td>
                              <td className="px-5 py-4 text-right font-mono text-[11px] text-slate-600 dark:text-slate-400">
                                {s.memory_kb !== null && s.memory_kb !== undefined ? `${s.memory_kb} KB` : "0 KB"}
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
          className="hidden md:flex w-[1px] bg-slate-300 dark:bg-slate-800 cursor-col-resize hover:bg-orange-500 dark:hover:bg-orange-500 transition-colors z-50 items-center justify-center flex-shrink-0 relative group"
          onMouseDown={(e) => { e.preventDefault(); setIsDragging(true); }}
        >
          <div className="absolute inset-y-0 -left-2 -right-2 z-10" />
        </div>

        {/* =========================
            RIGHT PANEL (Editor)
        ========================= */}
        <section className="w-full min-h-[calc(100dvh-56px)] shrink-0 md:shrink md:min-h-0 md:h-full md:flex-1 flex flex-col bg-white dark:bg-[#1e1e1e] overflow-hidden transition-colors border-t md:border-t-0 border-slate-200 dark:border-slate-800 relative z-10">
          
          {/* Editor Action Toolbar */}
          <div className="min-h-[48px] py-3 bg-[#f3f4f6] dark:bg-[#0a0c10] border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between px-4 z-10 gap-4 flex-shrink-0 transition-colors">
            
            <div className="flex items-center gap-3">
              <span className="text-xs font-sans font-semibold text-slate-600 hidden md:block">Theme: </span>
              
              {/* Custom Theme Dropdown */}
              <div className="relative" ref={themeDropdownRef}>
                <button
                  type="button"
                  onClick={() => { setThemeOpen(!themeOpen); setLanguageOpen(false); }}
                  className="flex items-center justify-between gap-2 px-3 py-1.5 text-[11px] font-sans font-semibold rounded-[3px] bg-white dark:bg-[#0d1117] border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-700 transition-colors min-w-[110px] text-left cursor-pointer select-none"
                >
                  <span className="capitalize">{editorTheme === "vs-dark" ? "VS Dark" : editorTheme === "light" ? "VS Light" : editorTheme}</span>
                  <ChevronDown size={12} className={`text-slate-400 transition-transform duration-200 ${themeOpen ? "rotate-180" : ""}`} />
                </button>
                
                {themeOpen && (
                  <div className="absolute left-0 mt-1 w-40 bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 rounded-[3px] shadow-xl z-50 py-1 max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-1 duration-150">
                    {AVAILABLE_THEMES.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => { setEditorTheme(t); setThemeOpen(false); }}
                        className={`w-full text-left px-3 py-1.5 text-[11px] font-sans font-semibold transition-colors cursor-pointer block capitalize ${editorTheme === t ? "text-orange-500 bg-slate-50 dark:bg-slate-900/50" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/30 hover:text-slate-900 dark:hover:text-slate-200"}`}
                      >
                        {t}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => { setEditorTheme("vs-dark"); setThemeOpen(false); }}
                      className={`w-full text-left px-3 py-1.5 text-[11px] font-sans font-semibold transition-colors cursor-pointer block ${editorTheme === "vs-dark" ? "text-orange-500 bg-slate-50 dark:bg-slate-900/50" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/30 hover:text-slate-900 dark:hover:text-slate-200"}`}
                    >
                      VS Dark
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEditorTheme("light"); setThemeOpen(false); }}
                      className={`w-full text-left px-3 py-1.5 text-[11px] font-sans font-semibold transition-colors cursor-pointer block ${editorTheme === "light" ? "text-orange-500 bg-slate-50 dark:bg-slate-900/50" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/30 hover:text-slate-900 dark:hover:text-slate-200"}`}
                    >
                      VS Light
                    </button>
                  </div>
                )}
              </div>

              <span className="text-xs font-sans font-semibold text-slate-600 hidden md:block">Language: </span>
              
              {/* Custom Language Dropdown */}
              <div className="relative" ref={langDropdownRef}>
                <button
                  type="button"
                  onClick={() => { setLanguageOpen(!langOpen); setThemeOpen(false); }}
                  className="flex items-center justify-between gap-2 px-3 py-1.5 text-[11px] font-sans font-semibold rounded-[3px] bg-white dark:bg-[#0d1117] border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-700 transition-colors min-w-[110px] text-left cursor-pointer select-none"
                >
                  <span>{language === "cpp" ? "C++20" : language === "java" ? "Java" : language === "python" ? "Python 3" : language === "javascript" ? "JavaScript" : language}</span>
                  <ChevronDown size={12} className={`text-slate-400 transition-transform duration-200 ${langOpen ? "rotate-180" : ""}`} />
                </button>
                
                {langOpen && (
                  <div className="absolute left-0 mt-1 w-36 bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 rounded-[3px] shadow-xl z-50 py-1 animate-in fade-in slide-in-from-top-1 duration-150">
                    {[
                      { val: "cpp", label: "C++20" },
                      { val: "java", label: "Java" },
                      { val: "python", label: "Python 3" },
                      { val: "javascript", label: "JavaScript" },
                    ].map((langItem) => (
                      <button
                        key={langItem.val}
                        type="button"
                        onClick={() => { 
                          setLanguage(langItem.val); setLanguageOpen(false);
                          localStorage.setItem("default_language", langItem.val);
                          editorRef.current?.setValue(localStorage.getItem(`last_local_save_${problemId}_${langItem.val}`) || boilerPlate[langItem.val]);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-[11px] font-sans font-semibold transition-colors cursor-pointer block ${language === langItem.val ? "text-orange-500 bg-slate-50 dark:bg-slate-900/50" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/30 hover:text-slate-900 dark:hover:text-slate-200"}`}
                      >
                        {langItem.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 items-center">
              {authLoading ? (
                <span className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-widest animate-pulse">
                  AUTH...
                </span>
              ) : user ? (
                <>
                  <button
                    onClick={handleRun}
                    disabled={runLoading || submitting}
                    className="flex items-center gap-1.5 text-[12px] font-sans font-semibold cursor-pointer rounded-[3px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 px-4 py-1.5 hover:bg-slate-300 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <PlaySquare size={12} fill="currentColor" /> {runLoading ? "Running" : "Run"}
                  </button>

                  <button
                    onClick={handleSubmit}
                    disabled={submitting || runLoading || isEnded}
                    className="flex items-center gap-1.5 text-[12px] font-sans font-semibold cursor-pointer rounded-[3px] bg-orange-500 text-white border border-orange-500 px-5 py-1.5 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    <SendHorizonal size={12} /> {submitting ? "Submitting" : "Submit"}
                  </button>
                </>
              ) : (
                <span className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest bg-slate-200 dark:bg-slate-800 px-3 py-1.5 rounded-[3px]">
                  <a href="/auth" className="text-orange-600 dark:text-orange-500 hover:underline">SIGN IN</a> TO SUBMIT
                </span>
              )}
            </div>
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-1 w-full relative">
            <Editor
              height="100%"
              theme={editorTheme}
              beforeMount={handleBeforeMount}
              onMount={handleEditorDidMount}
              language={language}
              defaultValue={code}
              onChange={(value) => {
                setCode(value ?? "");
                localStorage.setItem(`last_local_save_${problemId}_${localStorage.getItem('default_language') || "cpp"}`, value ?? "");
              }}
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
          
          {/* VS-Code Style Bottom Status Bar */}
          <div className="h-7 w-full bg-[#f3f4f6] dark:bg-[#0D0D0D] border-t border-slate-300 dark:border-[#0D0D0D] flex items-center justify-between px-3 font-mono text-[9px] font-bold text-slate-500 uppercase tracking-widest select-none flex-shrink-0">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-slate-400">
                <HelpCircle size={10} /> 
                <span className="hidden md:inline">CMD+SHIFT+ENTER TO RUN</span>
              </span>
              <span className="hidden md:inline text-slate-400 border-l border-slate-300 dark:border-slate-700 pl-4">
                CMD+ENTER TO SUBMIT
              </span>
            </div>
            
            <div className="flex items-center gap-4 h-full">
              {isEnded && (
                <span className="font-mono text-[9px] font-bold text-red-500 tracking-[0.08em] uppercase px-2 py-0.5 rounded-[3px] border border-red-500/30 bg-red-500/10">
                  Contest Concluded (Submissions Closed)
                </span>
              )}
              <button onClick={handleCopy} className="flex h-full items-center gap-1.5 px-2 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">
                {copySuccess ? <CheckCheck size={10} className="text-green-500" /> : <ClipboardCopy size={10} />}
                <span className="hidden md:block">{copySuccess ? "COPIED" : "COPY"}</span>
              </button>
              <button onClick={() => { if(window.confirm("Reset IDE?")) { 
                  editorRef.current?.setValue(boilerPlate[language]);
                  localStorage.setItem(`last_local_save_${problemId}_${language}`, boilerPlate[language]);
                } }} className="flex h-full items-center gap-1.5 px-2 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-red-500 transition-colors cursor-pointer">
                <RefreshCcw size={10} /> <span className="hidden md:block">RESET</span>
              </button>
            </div>
          </div>

        </section>

        {/* ===== SUBMISSION CODE VIEW MODAL ===== */}
        {viewCode && (
          <div className="fixed inset-0 bg-slate-900/80 z-[150] backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#0d1117] w-full max-w-4xl h-[85vh] rounded-[3px] shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 transition-colors">
              {/* Modal Header */}
              <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#050608] transition-colors">
                <div className="flex items-center gap-4">
                  <div className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-[0.15em] flex items-center gap-2">
                    <Terminal size={14} className="text-orange-500" />
                    SUBMISSION #{viewCode.submission_id}
                  </div>
                  <span className={`font-mono text-[9px] -translate-x-2 px-2 py-0.5 rounded-[3px] border font-bold uppercase tracking-widest ${
                      viewCode.verdict === "AC"
                        ? "bg-orange-50 dark:bg-orange-500/10 text-orange-500 dark:text-orange-400 border-orange-200 dark:border-orange-500/30"
                        : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-500 border-red-200 dark:border-red-500/30"
                    }`}>
                    {viewCode.verdict}
                  </span>
                </div>
                <button onClick={() => setViewCode(null)} className="font-mono text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer bg-transparent border-none p-1">
                  <XSquare size={16} />
                </button>
              </div>

              {/* Readonly Editor */}
              <div className="flex-1 relative bg-slate-50 dark:bg-[#1e1e1e]">
                <Editor
                  height="100%"
                  language={viewCode.language || "cpp"}
                  value={viewCode.code}
                  theme={editorTheme}
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