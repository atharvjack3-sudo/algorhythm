import React, { useEffect, useState, Suspense, lazy, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { api } from "../api/client";
import Editor, { DiffEditor } from "@monaco-editor/react";
import { InlineMath } from "react-katex";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import CustomTC from "../components/CustomTC";
import "highlight.js/styles/atom-one-dark.css";
import "katex/dist/katex.min.css";
import SubmissionAnim from "../components/submissionAnim";
import CollabTab from "../components/CollabTab";
import { Copy, RotateCcw, CloudUpload, History, Check, X } from "lucide-react";
import "./css/scrollbar.css";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";

const themeModules = import.meta.glob("../themes/*.json");
export const AVAILABLE_THEMES = Object.keys(themeModules)
  .map((path) => path.split("/").pop().replace(".json", ""))
  .sort();
const loadedThemes = new Set();

const DiscussionTab = lazy(
  () => import("../components/discussion/DiscussionTab"),
);

export async function loadMonacoTheme(monaco, themeName) {
  const path = `../themes/${themeName}.json`;
  const loader = themeModules[path];

  if (!loader) return;
  const theme = await loader();

  monaco.editor.defineTheme(themeName, theme.default);
  monaco.editor.setTheme(themeName);
}

const TABS = [
  "Problem",
  "Editorial",
  "Submissions",
  "Run",
  "Result",
  "Discussion",
  "Collab",
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
        prose-a:text-blue-600 dark:prose-a:text-blue-400
        
        /* 1. Target INLINE code only */
        [&_:not(pre)>code]:font-mono [&_:not(pre)>code]:text-[13px] [&_:not(pre)>code]:bg-slate-100 dark:[&_:not(pre)>code]:bg-slate-800 [&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:rounded-[3px]
        
        /* 2. Container PRE styles */
        prose-pre:p-0 prose-pre:bg-[#282c34] prose-pre:border prose-pre:border-slate-700 dark:prose-pre:border-slate-800 prose-pre:rounded-[5px]
        
        /* 3. Force highlight.js CODE block to use JetBrains Mono, 13px size, and better line height */
        [&_pre_code.hljs]:!bg-transparent [&_pre_code.hljs]:p-4 [&_pre_code.hljs]:!text-[#abb2bf] [&_pre_code.hljs]:!font-mono [&_pre_code.hljs]:!text-[13px] [&_pre_code.hljs]:!leading-[1.6]
        
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

export default function SolveProblem() {
  const { problemId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const { theme } = useTheme();
  const [editorTheme, setEditorTheme] = useState(
    theme === "dark" ? "vs-dark" : "light",
  );
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
  const [lastResult, setLastResult] = useState(null);
  const [complexity, setComplexity] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const monacoRef = useRef(null);
  const editorRef = useRef(null);
  const [showProblemTopics, setShowProblemTopics] = useState(true);
  const [ differentiate, setDifferentiate ] = useState(false);
  const [ cmpCode, setCmpCode ] = useState([]); // old, fin

  /* ==============
  Collab States
  ============= */
  const [collabActive, setCollabActive] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [collabData, setCollabData] = useState(null);
  const [collabTeam, setCollabTeam] = useState([]);
  const ydocRef = useRef(null);
  const providerRef = useRef(null);
  const bindingRef = useRef(null);
  const listenerRef = useRef(null);
  /* =========================
     RESIZER LOGIC
  ========================= */
  const [leftWidth, setLeftWidth] = useState(45); // Start at 45%
  const [isDragging, setIsDragging] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  ////////////////
  const [copySuccess, setCopySuccess] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  function handleEditorDidMount(editor, monaco) {
    editorRef.current = editor;
    monacoRef.current = monaco;
  }
  function handleBeforeMount(monaco) {
    monacoRef.current = monaco;
  }
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };
  function handleCollabEditorMount(editor, monaco) {
    if (!collabData || !collabData.wsRoomId) {
      console.error("Collab data is missing, cannot connect to WebSocket!");
      return;
    }
    editorRef.current = editor;
    monacoRef.current = monaco;

    const ydoc = new Y.Doc();
    const provider = new WebsocketProvider(
      "wss://algorhythm-6zhv.onrender.com/",
      collabData.wsRoomId,
      ydoc,
    );

    provider.awareness.setLocalStateField("user", {
      name: user.username,
      color: colors[Math.floor(Math.random() * colors.length)],
    });

    provider.awareness.on("change", () => {
      const users = Array.from(provider.awareness.getStates().values())
        .map((state) => state.user)
        .filter(Boolean);
      setCollabTeam(users);
    });

    const yText = ydoc.getText("code");
    const meta = ydoc.getMap("meta");

    if (isOwner && !meta.get("initialized")) {
      meta.set("initialized", true);
      yText.insert(0, code);
    }

    const binding = new MonacoBinding(
      yText,
      editor.getModel(),
      new Set([editor]),
      provider.awareness,
    );

    const listener = editor.onDidChangeModelContent(() => {
      setCode(editor.getValue());
    });

    ydocRef.current = ydoc;
    providerRef.current = provider;
    bindingRef.current = binding;
    listenerRef.current = listener;
  }
  const colors = [
    "#ef4444",
    "#3b82f6",
    "#22c55e",
    "#f59e0b",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
    "#84cc16",
  ];
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (collabActive) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [collabActive]);
  useEffect(() => {
    if (authLoading || !user) return;
    if (!collabActive) return;

    return () => {
      listenerRef.current?.dispose();

      if (isOwner && collabData) {
        api
          .post("/collab/terminate-room", {
            roomCode: collabData.roomCode,
          })
          .catch(console.error);
      }

      bindingRef.current?.destroy();
      providerRef.current?.destroy();
      ydocRef.current?.destroy();

      listenerRef.current = null;
      bindingRef.current = null;
      providerRef.current = null;
      ydocRef.current = null;

      setIsOwner(false);
      setCollabData(null);
    };
  }, [collabActive]);

  useEffect(() => {
    if (!monacoRef.current) return;
    if (editorTheme === "vs-dark") return;
    if (editorTheme === "light") return;

    loadMonacoTheme(monacoRef.current, editorTheme).then(() => {
      monacoRef.current.editor.setTheme(editorTheme);
    });
  }, [editorTheme]);

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

  async function handleSubmit() {
    if (!user) return;
    try {
      setActiveTab("Result");
      setSubmitting(true);
      setSubmitError(null);
      const res = await api.post("/submissions", {
        problemId: Number(problemId),
        language,
        code,
      });
      const result = res.data;
      setLastResult(result);
      setSubmissions((prev) => [
        {
          verdict: result.verdict,
          submitted_at: new Date().toISOString(),
          language,
        },
        ...prev,
      ]);
    } catch (err) {
      setSubmitError(err.response?.data?.error || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  const handleRun = async () => {
    if (!user) return;
    if (!code.trim()) return;
    try {
      setActiveTab("Run");
      setRunLoading(true);
      setRunError(null);
      setRunResults([]);
      const res = await api.post("/run", {
        problemId,
        language,
        code,
      });
      setRunResults(res.data.samples);
    } catch (err) {
      setRunError(err.response?.data?.error || "Run failed");
    } finally {
      setRunLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="w-full h-[calc(100vh-56px)] flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tracking-[0.15em] animate-pulse uppercase">
          LOADING WORKSPACE...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[calc(100vh-56px)] flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="bg-white dark:bg-slate-900 px-6 py-4 border border-slate-200 dark:border-slate-800 rounded-md text-center shadow-sm">
          <div className="font-mono text-[11px] font-bold text-red-600 dark:text-red-400 tracking-[0.1em] uppercase mb-1">
            Error
          </div>
          <p className="font-sans text-[14px] text-slate-800 dark:text-slate-200">
            {error}
          </p>
        </div>
      </div>
    );
  }

  const { problem, content, stats, topics, samples } = data;

  const handleEditorWillMount = async (monaco) => {
    monacoRef.current = monaco;

    await loadMonacoTheme(monaco, editorTheme);
  };

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

        
        .yRemoteSelectionHead {
          position: absolute;
          border-left-width: 2px !important;
          border-left-style: solid !important;
          height: 100%;
          box-sizing: border-box;
          z-index: 99;
        }

        .yRemoteSelectionHead::after {
          position: absolute;
          content: ' ';
          border-width: 3px !important;
          border-style: solid !important;
          border-radius: 4px;
          left: -4px;
          top: -5px;
        }
      `}</style>

      <div className="w-full h-[calc(100dvh-56px)] overflow-y-auto md:overflow-hidden bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row font-sans transition-colors duration-200 relative">
        {isDragging && (
          <div className="fixed inset-0 z-[200] cursor-col-resize" />
        )}

        {/* =========================
            LEFT PANEL
        ========================= */}
        <section
          className="w-full min-h-[calc(100dvh-56px)] shrink-0 md:shrink md:min-h-0 md:h-full bg-white dark:bg-slate-950 flex flex-col relative z-10 transition-colors overflow-hidden border-r border-slate-200 dark:border-slate-800"
          style={isDesktop ? { width: `${leftWidth}%` } : {}}
        >
          {/* Header */}
          <div className="px-5 pt-6 pb-2 flex-shrink-0">
            <h1 className="font-sans text-2xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">
              {problemId}. {problem.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`px-2 py-0.5 rounded-[3px] font-mono text-[10px] font-bold uppercase tracking-wider ${
                  problem?.difficulty === "easy"
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                    : problem?.difficulty === "medium"
                      ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                      : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                }`}
              >
                {problem?.difficulty}
              </span>

              <span className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Acceptance: {stats.acceptance_rate ?? "N/A"}%
              </span>

              {solved && (
                <span className="flex items-center gap-1 font-sans text-[10px] font-light text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-[3px] border border-green-200 dark:border-green-800/30 tracking-widest">
                  Solved
                </span>
              )}
            </div>
            {!showProblemTopics && (
              <span
                className="px-2 py-0.5 mt-3 rounded-[3px] bg-slate-100 dark:bg-slate-900 font-sans text-[10px] text-slate-600 dark:text-slate-300 tracking-widest border border-slate-200 dark:border-slate-800"
                onClick={() => setShowProblemTopics((prev) => !prev)}
              >
                Show Topics{" "}
              </span>
            )}
            {topics?.length > 0 && showProblemTopics && (
              <div className="mt-3 flex gap-2 flex-wrap">
                {topics.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded-[3px] bg-slate-100 dark:bg-slate-900 font-sans text-[10px] text-slate-600 dark:text-slate-300 tracking-widest border border-slate-200 dark:border-slate-800"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex overflow-x-auto overflow-y-hidden border-b border-slate-200 dark:border-slate-800 mt-2 custom-scrollbar px-2 flex-shrink-0 bg-slate-50 dark:bg-slate-950/50">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 font-sans text-[11px] font-semibold uppercase tracking-[0.08em] transition-all relative whitespace-nowrap border-b-[3px] top-[1px]
                  ${
                    activeTab === tab
                      ? "text-orange-600 dark:text-orange-500 border-orange-600 dark:border-orange-500"
                      : "text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto px-5 py-6 text-[14px] text-slate-800 dark:text-slate-200 custom-scrollbar bg-white dark:bg-slate-950">
            {/* ===== DISCUSSION ===== */}
            <div
              className={`${activeTab === "Discussion" ? "block" : "hidden"}`}
            >
              <Suspense
                fallback={
                  <div className="py-10 text-center font-mono text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-widest animate-pulse">
                    Loading discussions...
                  </div>
                }
              >
                <DiscussionTab />
              </Suspense>
            </div>
            {/* {activeTab === "Discussion" && (
              <Suspense
                fallback={
                  <div className="py-10 text-center font-mono text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-widest animate-pulse">
                    Loading discussions...
                  </div>
                }
              >
                <DiscussionTab />
              </Suspense>
            )} */}

            {/* ===== PROBLEM ===== */}
            {activeTab === "Problem" && (
              <div className="flex flex-col gap-8">
                <MarkdownRenderer content={content.statement} />

                {content.constraints && (
                  <div>
                    <h3 className="font-sans text-[15px] font-bold text-slate-900 dark:text-white mb-2">
                      Constraints
                    </h3>
                    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-md">
                      <MarkdownRenderer
                        content={content.constraints}
                        className="font-mono text-[12px] whitespace-pre-line"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <div className="flex flex-col h-full">
                    <h3 className="font-sans text-[15px] font-bold text-slate-900 dark:text-white mb-2">
                      Input Format
                    </h3>
                    <div className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-md">
                      <MarkdownRenderer
                        content={content.input_format}
                        className="text-[13px] whitespace-pre-line"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col h-full">
                    <h3 className="font-sans text-[15px] font-bold text-slate-900 dark:text-white mb-2">
                      Output Format
                    </h3>
                    <div className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-md">
                      <MarkdownRenderer
                        content={content.output_format}
                        className="text-[13px] whitespace-pre-line"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-5 pt-2">
                  <h3 className="font-sans text-[15px] font-bold text-slate-900 dark:text-white mb-0">
                    Examples
                  </h3>
                  {samples.map((s, i) => (
                    <div
                      key={i}
                      className="border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden shadow-sm"
                    >
                      <div className="bg-slate-100 dark:bg-slate-900 px-4 py-2 border-b border-slate-200 dark:border-slate-800">
                        <span className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                          Example {i + 1}
                        </span>
                      </div>
                      <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
                        <div className="flex-1 bg-slate-50 dark:bg-slate-950/50">
                          <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 font-mono text-[9px] font-bold text-slate-500 uppercase tracking-[0.1em]">
                            Input
                          </div>
                          <pre className="p-4 m-0 font-mono text-[13px] text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                            {s.input}
                          </pre>
                        </div>
                        <div className="flex-1 bg-white dark:bg-slate-950">
                          <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 font-mono text-[9px] font-bold text-slate-500 uppercase tracking-[0.1em]">
                            Output
                          </div>
                          <pre className="p-4 m-0 font-mono text-[13px] text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                            {s.output}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===== EDITORIAL ===== */}
            {activeTab === "Editorial" && (
              <MarkdownRenderer content={content.editorial} />
            )}

            {/* ===== RUN ===== */}
            <div className={`${activeTab === "Run" ? "block" : "hidden"}`}>
              <div className="flex flex-col gap-5">
                {runLoading ? (
                  <SubmissionAnim />
                ) : (
                  <>
                    {runError && (
                      <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-[3px] shadow-sm">
                        <div className="font-mono text-[11px] font-bold text-red-600 dark:text-red-400 tracking-[0.08em] uppercase mb-2">
                          Runtime / Compilation Error
                        </div>
                        <pre className="font-mono text-[11px] text-red-500 whitespace-pre-wrap">
                          {runError}
                        </pre>
                      </div>
                    )}

                    {runResults.length === 0 ? (
                      <div className="px-4 py-16 text-center border border-slate-200 dark:border-slate-800 rounded-md bg-slate-50 dark:bg-slate-900 shadow-sm font-mono text-[11px] tracking-[0.06em] text-slate-500 dark:text-slate-400 uppercase">
                        Run your code to evaluate sample test cases.
                      </div>
                    ) : (
                      <div className="flex flex-col gap-5">
                        {runResults.map((r, i) => {
                          const isMatch =
                            r.output?.trim() === r.expected?.trim();
                          return (
                            <div
                              key={i}
                              className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden shadow-sm"
                            >
                              <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                                <span className="font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-600 dark:text-slate-300 uppercase">
                                  Test Case {r.sample || r.index || i + 1}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-[3px] font-mono text-[10px] font-bold tracking-wide uppercase ${
                                    isMatch
                                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                      : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                                  }`}
                                >
                                  {isMatch ? "Matched" : "Mismatch"}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
                                <div>
                                  <div className="px-4 py-2 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 font-mono text-[9px] font-semibold text-slate-500 uppercase tracking-[0.1em]">
                                    Your Output
                                  </div>
                                  <pre
                                    className={`p-4 m-0 font-mono text-[12px] whitespace-pre-wrap ${isMatch ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                                  >
                                    {r.output || "(empty output)"}
                                  </pre>
                                </div>
                                <div>
                                  <div className="px-4 py-2 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 font-mono text-[9px] font-semibold text-slate-500 uppercase tracking-[0.1em]">
                                    Expected Output
                                  </div>
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
                  </>
                )}
                <div className={`${runLoading ? "hidden" : "block"}`}>
                  <CustomTC
                    setRunLoading={setRunLoading}
                    lang={language}
                    code={code}
                  />
                </div>
              </div>
            </div>

            {/* ===== RESULT ===== */}
            {activeTab === "Result" && (
              <div className="flex flex-col gap-5">
                {submitting ? (
                  <SubmissionAnim />
                ) : (
                  <>
                    {!lastResult ? (
                      <div className="px-4 py-16 text-center border border-slate-200 dark:border-slate-800 rounded-md bg-slate-50 dark:bg-slate-900 shadow-sm font-mono text-[11px] tracking-[0.06em] text-slate-500 dark:text-slate-400 uppercase">
                        Submit code to view final verdict.
                      </div>
                    ) : (
                      <>
                        <div
                          className={`p-5 rounded-md border shadow-sm ${
                            lastResult.verdict === "AC" ||
                            lastResult.verdict === "Accepted"
                              ? "bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900/50"
                              : "bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50"
                          }`}
                        >
                          <h3
                            className={`font-mono text-[18px] font-bold tracking-wide uppercase ${lastResult.verdict === "AC" || lastResult.verdict === "Accepted" ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"}`}
                          >
                            {lastResult.verdict === "AC"
                              ? "Accepted"
                              : lastResult.verdict}
                          </h3>
                          <p className="font-mono text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
                            Tested against all system cases
                          </p>
                        </div>

                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden shadow-sm">
                          <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
                            <span className="font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase">
                              Test Cases Breakdown
                            </span>
                          </div>
                          <div className="w-full overflow-x-auto custom-scrollbar">
                            <table className="w-full border-collapse whitespace-nowrap text-left">
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                {lastResult.samples &&
                                  lastResult.samples.map((s) => (
                                    <tr
                                      key={s.index}
                                      className="border-b border-slate-200 dark:border-slate-800 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                    >
                                      <td className="px-4 py-3 font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                                        Test #{s.index}
                                      </td>
                                      <td className="px-4 py-3 text-right">
                                        <span
                                          className={`inline-flex px-2 py-0.5 rounded-[3px] font-mono text-[10px] font-semibold tracking-wide uppercase ${
                                            s.verdict === "AC" ||
                                            s.verdict === "Accepted"
                                              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                              : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                                          }`}
                                        >
                                          {s.verdict === "AC"
                                            ? "Accepted"
                                            : s.verdict}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {lastResult.hidden_failed && (
                          <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-md shadow-sm">
                            <div className="font-mono text-[11px] font-bold text-red-600 dark:text-red-400 tracking-[0.08em] uppercase mb-1">
                              Hidden Test Failure
                            </div>
                            <p className="font-sans text-[13px] text-slate-800 dark:text-slate-200">
                              {lastResult.hidden_failed}
                            </p>
                          </div>
                        )}

                        {lastResult.verdict !== "AC" && lastResult.error && (
                          <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-md shadow-sm">
                            <div className="font-mono text-[11px] font-bold text-red-600 dark:text-red-400 tracking-[0.08em] uppercase mb-2">
                              Error Details
                            </div>
                            <pre className="font-mono text-[11px] text-red-500 whitespace-pre-wrap">
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
            <div className={activeTab === "Collab" ? "block" : "hidden"}>
              <CollabTab
                collabActive={collabActive}
                setCollabActive={setCollabActive}
                problemId={problemId}
                isOwner={isOwner}
                setIsOwner={setIsOwner}
                setCollabData={setCollabData}
                collabTeam={collabTeam}
              />
            </div>

            {/* ===== SUBMISSIONS ===== */}
            {activeTab === "Submissions" && (
              <div className="flex flex-col gap-4">
                {submissions.length === 0 ? (
                  <div className="px-4 py-16 text-center border border-slate-200 dark:border-slate-800 rounded-md bg-slate-50 dark:bg-slate-900 shadow-sm font-mono text-[11px] tracking-[0.06em] text-slate-500 dark:text-slate-400 uppercase">
                    No past submissions.
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
                    <div className="w-full overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
                          <tr>
                            <th className="px-5 py-3 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase w-20">
                              ID
                            </th>
                            <th className="px-5 py-3 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase">
                              Time Submitted
                            </th>
                            <th className="px-5 py-3 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase text-center">
                              Language
                            </th>
                            <th className="px-5 py-3 font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase text-right">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                          {submissions.map((s, i) => (
                            <tr
                              key={i}
                              onClick={() => setOpenSubmission(s)}
                              className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
                            >
                              <td className="px-5 py-3 font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400 group-hover:text-blue-500 transition-colors">
                                #{submissions.length - i}
                              </td>
                              <td className="px-5 py-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                                {new Date(s.submitted_at).toLocaleString(
                                  undefined,
                                  {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </td>
                              <td className="text-center text-xs font-mono font-extralight text-gray-600 dark:text-slate-400">
                                {s.language}
                              </td>
                              <td className="px-5 py-3 text-right">
                                <span
                                  className={`inline-flex px-2 py-0.5 rounded-[3px] font-mono text-[10px] font-bold tracking-wide uppercase ${
                                    s.verdict === "AC"
                                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                      : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                                  }`}
                                >
                                  {s.verdict}
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
          </div>
        </section>

        {/* ===== DESKTOP DRAG RESIZER ===== */}
        <div
          className="hidden md:flex w-[1px] bg-slate-200 dark:bg-slate-800 cursor-col-resize hover:bg-orange-500 dark:hover:bg-gray-300 transition-colors z-50 items-center justify-center flex-shrink-0 relative group"
          onMouseDown={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
        >
          <div className="absolute inset-y-0 -left-1 -right-1 z-10" />
        </div>

        {/* ===== RIGHT PANEL EDITOR ===== */}
        <section className="w-full min-h-[calc(100dvh-56px)] shrink-0 md:shrink md:min-h-0 md:h-full md:flex-1 flex flex-col bg-white dark:bg-[#1e1e1e] overflow-hidden transition-colors border-t md:border-t-0 border-slate-200 dark:border-slate-800">
          {/* Editor Toolbar */}
          <div className="min-h-12 py-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between px-4 z-10 gap-4 flex-shrink-0 transition-colors">
            <div className="flex items-center gap-2">
              <label className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest hidden sm:block">
                Theme
              </label>

              <select
                value={editorTheme}
                onChange={async (e) => {
                  setEditorTheme(e.target.value);
                }}
                className="bg-slate-50 custom-scrollbar dark:bg-slate-950 border border-slate-900 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-[3px] pl-2 py-1 text-[11px] font-mono outline-none focus:border-orange-500 transition-colors cursor-pointer"
              >
                {AVAILABLE_THEMES.map((theme) => (
                  <option key={theme} value={theme}>
                    {theme}
                  </option>
                ))}
                <option key={"vs-dark"} value={"vs-dark"}>
                  VS Dark
                </option>
                <option key={"light"} value={"light"}>
                  VS Light
                </option>
              </select>
              <label className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest hidden sm:block">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-[3px] px-2 py-1 text-[11px] font-mono outline-none focus:border-orange-500 transition-colors cursor-pointer uppercase tracking-widest"
              >
                <option value="cpp">C++17</option>
                <option value="java">Java</option>
                <option value="python">Python 3</option>
                <option value="javascript">JavaScript</option>
              </select>
            </div>

            <div className="flex gap-2.5 items-center">
              {authLoading ? (
                <span className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-widest animate-pulse">
                  AUTH...
                </span>
              ) : user ? (
                <>
                  <button
                    onClick={handleRun}
                    disabled={runLoading || submitting}
                    className="text-[12px] cursor-pointer font-semibold tracking-[0.06em] rounded-[3px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 px-4 py-2 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {runLoading ? "Running..." : "Run Code"}
                  </button>

                  <button
                    onClick={handleSubmit}
                    disabled={submitting || runLoading}
                    className="text-[12px] font-bold tracking-[0.12em] rounded-[3px] transition-opacity duration-150 cursor-pointer bg-orange-500 text-white border-none px-6 py-2 hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Submitting..." : "Submit"}
                  </button>
                </>
              ) : (
                <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  <a
                    href="/auth"
                    className="text-blue-600 dark:text-blue-400 hover:underline font-bold"
                  >
                    SIGN IN
                  </a>{" "}
                  TO SUBMIT
                </span>
              )}
            </div>
          </div>
          <div className="h-8 w-full px-5 pb-1 dark:bg-slate-900 border-b dark:border-slate-800 border-slate-200 flex items-center gap-5 justify-around">
            <button
              onClick={handleCopy}
              className="flex cursor-pointer items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:brightness-120 transition-colors"
            >
              {copySuccess ? (
                <Check size={15} className="text-green-500" />
              ) : (
                <Copy size={15} />
              )}
              <span className="text-xs font-semibold tracking-wide hidden md:block">
                {copySuccess ? "Copied" : "Copy"}
              </span>
            </button>

            <button
              onClick={() => {
                const r = window.confirm(
                  "Are you sure you want to reset the IDE?",
                );
                if (!r) return;
                setCode("");
                editorRef.current?.setValue("");
              }}
              className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:brightness-120 transition-colors"
            >
              <RotateCcw size={15} />
              <span className="cursor-pointer text-xs font-semibold tracking-wide hidden md:block">
                Reset
              </span>
            </button>

            <button
              onClick={() => window.confirm("Coming Soon...")}
              className="flex cursor-pointer items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:brightness-120 transition-colors"
            >
              <CloudUpload size={15} />
              <span className="text-xs font-semibold tracking-wide hidden md:block">
                Cloud Save
              </span>
            </button>

            <button
              onClick={() => setShowRestoreModal(true)}
              className="flex cursor-pointer items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:brightness-120 transition-colors"
            >
              <History size={15} />
              <span className="text-xs font-semibold tracking-wide hidden md:block">
                History
              </span>
            </button>
          </div>

          {submitError && (
            <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 px-4 py-2 text-[11px] font-mono font-bold uppercase tracking-widest border-b border-red-200 dark:border-red-900/50 flex-shrink-0">
              [ERROR] {submitError}
            </div>
          )}

          {/* Monaco Editor Container */}
          <div className="flex-1 w-full relative">
            {collabActive && collabData ? (
              <Editor
                key="collab"
                height="100%"
                theme={editorTheme}
                beforeMount={handleBeforeMount}
                onMount={handleCollabEditorMount}
                language={language}
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
            ) : (
              <Editor
                key="regular"
                height="100%"
                theme={editorTheme}
                beforeMount={handleBeforeMount}
                onMount={handleEditorDidMount}
                language={language}
                defaultValue={code}
                onChange={(value) => setCode(value ?? "")}
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
            )}
          </div>
        </section>
        {/* ===== SUBMISSION MODAL ===== */}
        {openSubmission && (
          <div className="fixed inset-0 bg-slate-900/80 z-[150] backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-950 w-full max-w-4xl h-[85vh] rounded-md shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 transition-colors">
              {/* Modal Header */}
              <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    SUBMISSION DETAILS
                  </div>
                  <span
                    className={`font-mono text-[10px] px-2 py-0.5 -translate-x-2 rounded-[3px] font-bold uppercase tracking-widest border ${
                      openSubmission.verdict === "AC"
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/30"
                        : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/30"
                    }`}
                  >
                    {openSubmission.verdict}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {openSubmission.verdict === "AC" && (
                    <button
                      onClick={() => evaluate_complexity(openSubmission.id)}
                      disabled={complexity?.id === openSubmission.id}
                      className="font-mono text-[10px] font-bold tracking-[0.06em] rounded-[3px] bg-transparent text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 px-3 py-1 hover:bg-blue-50 dark:hover:bg-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed uppercase transition-colors"
                    >
                      {complexity?.id === openSubmission.id
                        ? "ANALYZED"
                        : "AI ANALYSIS"}
                    </button>
                  )}

                  <button
                    onClick={() => setOpenSubmission(null)}
                    className="font-mono text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer bg-transparent border-none p-1"
                  >
                    CLOSE [X]
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-5 py-2 dark:border-slate-800 dark:bg-slate-900">
                <button
                  onClick={() => {
                    setCmpCode([openSubmission.code, code]);
                    setDifferentiate(true);
                    setOpenSubmission(null);
                  }}
                  className="rounded-md border border-orange-500 bg-orange-500 px-4 py-2 text-xs font-semibold tracking-wide text-white transition-all hover:bg-orange-600 active:scale-95"
                >
                  Diff with Current
                </button>

                <button onClick={()=> window.confirm("coming soon...")} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-semibold tracking-wide text-slate-700 transition-all hover:bg-slate-100 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                  Diff with Other
                </button>

                <button
                  onClick={() => {
                    setCode(openSubmission.code);
                    editorRef?.current?.setValue(openSubmission.code);
                    setLanguage(openSubmission.language);
                    setOpenSubmission(null);
                  }}
                  className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-semibold tracking-wide text-slate-700 transition-all hover:bg-slate-100 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  Restore Code
                </button>
              </div>

              {/* AI Complexity Dropdown */}
              <div
                className={`flex-shrink-0 overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  complexity && complexity.id === openSubmission.id
                    ? "max-h-40 opacity-100 border-b border-blue-200 dark:border-blue-900/30"
                    : "max-h-0 opacity-0"
                }`}
              >
                <div className="px-5 py-4 bg-blue-50 dark:bg-slate-900/50 flex flex-col gap-2 transition-colors">
                  <div className="font-mono text-[10px] font-bold tracking-widest text-blue-600 dark:text-blue-400 uppercase">
                    AI Analysis Insight
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-3 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <span className="font-bold uppercase tracking-wider">
                        Time:
                      </span>
                      <span className="bg-white dark:bg-slate-950 px-2 py-0.5 rounded-[3px] border border-slate-200 dark:border-slate-800">
                        <InlineMath math={complexity?.time || "O(1)"} />
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold uppercase tracking-wider">
                        Space:
                      </span>
                      <span className="bg-white dark:bg-slate-950 px-2 py-0.5 rounded-[3px] border border-slate-200 dark:border-slate-800">
                        <InlineMath math={complexity?.space || "O(1)"} />
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Readonly Editor */}
              <div className="flex-1 relative bg-slate-50 dark:bg-[#0d1117]">
                <Editor
                  height="100%"
                  language={openSubmission.language || "cpp"}
                  value={openSubmission.code}
                  theme={theme === "dark" ? "vs-dark" : "light"}
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
      {showRestoreModal && (
        <div className="fixed inset-0 custom-scrollbar z-50 flex items-center justify-center bg-black/30 backdrop-blur-md">
          <div className="w-[92%] md:w-[65%] lg:w-[55%] h-[80%] overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl">
            <div className="flex h-14 items-center justify-between border-b border-slate-200 dark:border-slate-800 px-5">
              <h2 className="text-lg font-bold tracking-wide text-slate-800 dark:text-white">
                Restore Submission
              </h2>

              <button
                onClick={() => setShowRestoreModal(false)}
                className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="h-[calc(100%-56px)] overflow-y-auto">
              {submissions.map((sub, i) => (
                <div
                  onClick={() => {
                    setCode(sub.code);
                    editorRef?.current?.setValue(sub.code);
                    setLanguage(sub.language);
                    setShowRestoreModal(false);
                  }}
                  key={sub._id ?? i}
                  className="flex h-12 cursor-pointer items-center justify-between border-b border-slate-200 px-5 transition hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-900"
                >
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Sub. #{i + 1}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {sub.language}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(sub.submitted_at).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>

                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      sub.verdict === "AC"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {sub.verdict}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {differentiate && (
        <div className="absolute top-0 left-0 flex flex-col justify-center items-center w-full h-full z-100 bg-slate-950/20 backdrop-blur-3xl">
          
          <button className="mb-2 py-2 px-2 flex text-xs cursor-pointer hover:bg-orange-500 bg-orange-400 font-semibold font-sans gap-1 tracking-wide text-white rounded-sm" onClick={() => setDifferentiate(false)}> <X size={15}/> <span>Close</span></button>
          <DiffEditor className="border-2 dark:border-slate-700 border-slate-500"
            height="80vh"
            width="80vw"
            language="cpp"
            theme={theme === "light" ? "vs-light" : "vs-dark" }
            original={cmpCode[0]}
            modified={cmpCode[1]}
            options={{
              readOnly: true, 
              renderSideBySide: false,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
            }}
          />
        </div>
      )}
    </>
  );
}
