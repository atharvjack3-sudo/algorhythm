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
import "katex/dist/katex.min.css";
import SubmissionAnim from "../components/submissionAnim";
import CollabTab from "../components/CollabTab";
import {
  ClipboardCopy,
  RefreshCcw,
  CloudSync,
  GitCommit,
  CheckCheck,
  XSquare,
  HelpCircle,
  CodeXml,
  BookMarked,
  PlaySquare,
  ListChecks,
  MessagesSquare,
  Network,
  SendHorizonal,
  Terminal,
  ChevronDown
} from "lucide-react";
import "./css/scrollbar.css";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";
import DiscussionTab from "../components/discussion/DiscussionTab";

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
  { id: "Editorial", icon: BookMarked },
  { id: "Submissions", icon: GitCommit },
  { id: "Run", icon: PlaySquare },
  { id: "Result", icon: ListChecks },
  { id: "Discussion", icon: MessagesSquare },
  { id: "Collab", icon: Network },
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
  const [submissionProgress, setSubmissionProgress] = useState("");
  const [submitError, setSubmitError] = useState(null);
  const submissionWsRef = useRef(null);

  const [solved, setSolved] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [complexity, setComplexity] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const monacoRef = useRef(null);
  const editorRef = useRef(null);
  const [showProblemTopics, setShowProblemTopics] = useState(false);
  const [differentiate, setDifferentiate] = useState(false);
  const [cmpCode, setCmpCode] = useState([]);

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
  const yTextRef = useRef(null);
  
  /* =========================
     RESIZER LOGIC
  ========================= */
  const [leftWidth, setLeftWidth] = useState(48);
  const [isDragging, setIsDragging] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  
  const [copySuccess, setCopySuccess] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showCloudModal, setShowCloudModal] = useState(false);
  const [cloudModalInit, setCloudModalInit] = useState(false);
  const [cloudSaves, setCloudSaves] = useState([]);

  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingSave, setIsCreatingSave] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const handleSubmitRef = useRef(handleSubmit);
  const handleRunRef = useRef(handleRun);

  const [themeOpen, setThemeOpen] = useState(false);
  const [langOpen, setLanguageOpen] = useState(false);
  const themeDropdownRef = useRef(null);
  const langDropdownRef = useRef(null);

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
    applyTheme(monaco);
  }
  
  function handleBeforeMount(monaco) {
    monacoRef.current = monaco;
  }
  
  const handleFetchSaves = async () => {
    setIsFetching(true);
    try {
      const response = await api.get(`/cloud-saves/${problemId}`);
      const data = response.data;
      if (data.errorPresent) return;
      setCloudSaves(data.saves);
      setCloudModalInit(true);
    } catch (error) {
      console.error(error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleCreateSave = async () => {
    if (!saveTitle.trim()) return;
    setIsSaving(true);
    try {
      const response = await api.post("/cloud-saves", { problemId, title: saveTitle, code, language });
      if (response.data.errorPresent) return;
      setSaveTitle("");
      setIsCreatingSave(false);
      await handleFetchSaves();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

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
      console.log(err);}
  }
  function handleCollabEditorMount(editor, monaco) {
    if (!collabData || !collabData.wsRoomId) return;
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
    
    yTextRef.current = yText;
    ydocRef.current = ydoc;
    providerRef.current = provider;
    bindingRef.current = binding;
    listenerRef.current = listener;
  }
  
  const colors = ["#ef4444", "#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];
  
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
    const handleBeforeUnload = (e) => {
      if (collabActive) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [collabActive]);

  useEffect(() => {
    if (authLoading || !user || !collabActive) return;

    return () => {
      listenerRef.current?.dispose();
      if (isOwner && collabData) {
        api.post("/collab/terminate-room", { roomCode: collabData.roomCode }).catch(console.error);
      }
      bindingRef.current?.destroy();
      providerRef.current?.destroy();
      ydocRef.current?.destroy();
      setIsOwner(false);
      setCollabData(null);
    };
  }, [collabActive]);

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

  useEffect(() => {
    async function fetchProblem() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/problems/${problemId}`);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.error || "Problem not found");
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
      } catch (err) {}
    }
    fetchSubmissions();
  }, [problemId, user]);

  useEffect(() => {
    if (!submissions) return;
    setSolved(submissions.some((s) => s.verdict === "AC"));
  }, [submissions]);

  // Clean up WebSockets on component unmount
  useEffect(() => {
    return () => {
      if (submissionWsRef.current) {
        submissionWsRef.current.close();
      }
    };
  }, []);

  async function handleSubmit() {
    if (!user) return;
    
    // Close existing connection if user spam clicks
    if (submissionWsRef.current) {
        submissionWsRef.current.close();
    }
    
    try {
      setActiveTab("Result");
      setSubmitting(true);
      setSubmitError(null);
      setSubmissionProgress("Initializing...");

      // Hit the async endpoint
      const res = await api.post("/async-submission", {
        problemId: Number(problemId),
        language,
        code,
      });
      
      const { submissionId } = res.data;
      setSubmissionProgress("Queued...");

      // Establish WebSocket Connection
      const wsUrl = `wss://algorhythm-6zhv.onrender.com/submission?submissionId=${submissionId}`;
      const ws = new WebSocket(wsUrl);
      submissionWsRef.current = ws;

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.status === 'PROCESSING') {
          if (data.totalCases) {
            setSubmissionProgress(`Evaluating Test Cases... (${data.completedCases}/${data.totalCases})`);
          } else {
            setSubmissionProgress("Processing...");
          }
        } 
        else if (data.status === 'COMPLETED' || data.status === 'ERROR') {
          setLastResult(data.result);
          
          setSubmissions((prev) => [
            {
              id: submissionId,
              verdict: data.result.verdict,
              submitted_at: new Date().toISOString(),
              language,
              code: code,
            },
            ...prev,
          ]);

          if (!solved && data.result.verdict === "AC") setSolved(true);
          
          setSubmitting(false);
          setSubmissionProgress("");
          ws.close();
        }
      };

      ws.onerror = () => {
        setSubmitError("WebSocket connection error");
        setSubmitting(false);
      };

      ws.onclose = () => {
        // Only set error if it closed unexpectedly without completing
        setSubmitting((prev) => {
          if (prev) {
            setSubmitError("Connection to evaluation server lost.");
            return false;
          }
          return prev;
        });
      };

    } catch (err) {
      setSubmitError(err.response?.data?.error || "Submission failed");
      setTimeout(() => setSubmitError(null), 2000);
      setSubmitting(false);
    }
  }

  async function handleRun() {
    if (!user || !code.trim()) return;
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

  async function evaluate_complexity(id) {
    try {
      const res = await api.get(`/submissions/analyze/${id}`);
      setComplexity({
        time: res.data.time_complexity,
        space: res.data.space_complexity,
        id: id,
      });
    } catch (err) {}
  }

  if (loading) {
    return (
      <div className="w-full h-[calc(100vh-56px)] flex items-center justify-center bg-slate-50 dark:bg-[#050608] relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,theme(colors.gray.400/20%)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.gray.400/20%)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,theme(colors.slate.900/50%)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.slate.900/50%)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0"></div>
        <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tracking-[0.2em] animate-pulse uppercase relative z-10">
          INITIALIZING WORKSPACE...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[calc(100vh-56px)] flex items-center justify-center bg-slate-50 dark:bg-[#050608] relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,theme(colors.gray.400/20%)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.gray.400/20%)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,theme(colors.slate.900/50%)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.slate.900/50%)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0"></div>
        <div className="bg-white dark:bg-[#0d1117] px-8 py-6 border border-red-200 dark:border-red-900/50 rounded-[3px] text-center shadow-2xl relative z-10 max-w-md">
          <Terminal size={32} className="text-red-500 mx-auto mb-4" />
          <div className="font-mono text-[12px] font-bold text-red-600 dark:text-red-500 tracking-[0.15em] uppercase mb-2">
            System Error
          </div>
          <p className="font-sans text-[14px] font-semibold text-slate-800 dark:text-slate-200">
            {error}
          </p>
        </div>
      </div>
    );
  }

  const { problem, content, stats, topics, samples } = data;

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

        .yRemoteSelectionHead { position: absolute; border-left-width: 2px !important; border-left-style: solid !important; height: 100%; box-sizing: border-box; z-index: 99; }
        .yRemoteSelectionHead::after { position: absolute; content: ' '; border-width: 3px !important; border-style: solid !important; border-radius: 4px; left: -4px; top: -5px; }
        
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
        
        {/* Workspace Background Grid */}
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
            <h1 className="font-sans text-2xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight leading-tight">
              {problemId}. {problem.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3">
              <span className={`px-2.5 py-1 rounded-[3px] font-mono text-[10px] font-bold uppercase tracking-widest border ${
                  problem?.difficulty === "easy" ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-500 border-green-200 dark:border-green-500/30"
                  : problem?.difficulty === "medium" ? "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-500 border-amber-200 dark:border-amber-500/30"
                  : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-500 border-red-200 dark:border-red-500/30"
                }`}>
                {problem?.difficulty}
              </span>

              <span className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest px-2.5 py-1 rounded-[3px] ">
                Acceptance: {stats.acceptance_rate ?? "N/A"}%
              </span>

              {solved && (
                <span className="flex items-center gap-1 font-mono text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2.5 py-1 rounded-[3px] border border-orange-200 dark:border-orange-800/30 tracking-widest">
                  <CheckCheck size={12} strokeWidth={3} /> SOLVED
                </span>
              )}
            </div>
            
            {!showProblemTopics && (
              <button
                className="px-2 py-0.5 rounded-[3px] bg-slate-200/50 dark:bg-slate-800/50 font-sans font-semibold tracking-wide text-[10px] text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 cursor-pointer"
                onClick={() => setShowProblemTopics(true)}
              >
                Click to Show Topics
              </button>
            )}
            
            {topics?.length > 0 && showProblemTopics && (
              <div className="mt-4 flex gap-2 flex-wrap">
                {topics.map((t) => (
                  <span key={t} className="px-2 py-0.5 rounded-[3px] bg-slate-200/50 dark:bg-slate-800/50 font-sans font-semibold tracking-wide text-[10px] text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* IDE-Style Tabs */}
          <div className="flex overflow-x-auto overflow-y-hidden bg-[#f3f4f6] dark:bg-[#0a0c10] custom-scrollbar flex-shrink-0">
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
                    <CodeXml size={14} className="text-orange-500" /> Pretests
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

            {/* ===== EDITORIAL ===== */}
            <div className={`${activeTab === "Editorial" ? "block" : "hidden"}`}>
              <MarkdownRenderer content={content.editorial} />
            </div>

            {/* ===== DISCUSSION ===== */}
            <div className={`${activeTab === "Discussion" ? "block" : "hidden"}`}>
              <Suspense fallback={
                <div className="py-10 text-center font-mono text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-widest animate-pulse">
                  Loading discussions...
                </div>
              }>
                <DiscussionTab />
              </Suspense>
            </div>

            {/* ===== COLLAB ===== */}
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
                          const verdictDisplay = isMatch ? "AC" : isWA ? "WA" : r.verdict;

                          return (
                            <div key={i} className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 rounded-[3px] overflow-hidden shadow-sm flex flex-col">
                              <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-[#161b22]">
                                <div className="flex items-center gap-3">
                                  <span className="font-mono text-[11px] font-bold tracking-[0.15em] text-slate-700 dark:text-slate-300 uppercase">
                                    Test Case {r.sample || r.index || i + 1}
                                  </span>
                                  <span className={`px-2.5 py-0.5 rounded-[3px] border font-sans text-[10px] font-semibold tracking-wide ${
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
                                    Output
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

            {/* ===== RESULT (Final Verdict / Live Status) ===== */}
            {activeTab === "Result" && (
              <div className="flex flex-col gap-6">
                {submitting ? (
                  <div className="flex flex-col items-center justify-center py-20 px-4 bg-slate-50 dark:bg-[#050608] border border-slate-200 dark:border-slate-800 rounded-[3px] shadow-sm">
                    <RefreshCcw size={32} className="animate-spin text-orange-500 mb-4" />
                    <div className="font-mono text-[14px] font-bold text-slate-700 dark:text-slate-300 tracking-widest uppercase">
                      {submissionProgress}
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
                            System Execution Complete
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

                        {lastResult.hidden_failed && (
                          <div className="p-5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-[3px] shadow-sm">
                            <div className="font-mono text-[11px] font-bold text-red-600 dark:text-red-500 tracking-[0.15em] uppercase mb-2 flex items-center gap-2">
                              <Terminal size={14} /> Hidden Test Failure
                            </div>
                            <p className="font-sans text-[13px] font-semibold text-red-800 dark:text-red-200 mt-2">
                              {lastResult.hidden_failed}
                            </p>
                          </div>
                        )}

                        {lastResult.verdict !== "AC" && lastResult.error && (
                          <div className="p-5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-[3px] shadow-sm">
                            <div className="font-mono text-[11px] font-bold text-red-600 dark:text-red-500 tracking-[0.15em] uppercase mb-2 flex items-center gap-2">
                              <Terminal size={14} /> System Error Details
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
                    No Past Submissions
                  </div>
                ) : (
                  <div className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 rounded-[3px] overflow-hidden shadow-sm flex flex-col">
                    <div className="w-full overflow-x-auto custom-scrollbar">
                      <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead className="bg-slate-50 dark:bg-[#161b22] border-b border-slate-200 dark:border-slate-800">
                          <tr>
                            <th className="px-5 py-3.5 font-mono text-[10px] font-bold tracking-[0.15em] text-slate-500 dark:text-slate-400 uppercase w-20">ID</th>
                            <th className="px-5 py-3.5 font-mono text-[10px] font-bold tracking-[0.15em] text-slate-500 dark:text-slate-400 uppercase">Timestamp</th>
                            <th className="px-5 py-3.5 font-mono text-[10px] font-bold tracking-[0.15em] text-slate-500 dark:text-slate-400 uppercase text-center">Lang</th>
                            <th className="px-5 py-3.5 font-mono text-[10px] font-bold tracking-[0.15em] text-slate-500 dark:text-slate-400 uppercase text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                          {submissions.map((s, i) => (
                            <tr key={i} onClick={() => setOpenSubmission(s)} className="transition-colors cursor-pointer group odd:bg-white even:bg-slate-50 dark:odd:bg-[#0d1117] dark:even:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/80">
                              <td className="px-5 py-4 font-mono text-[12px] font-bold text-slate-500 dark:text-slate-500 group-hover:text-blue-500 transition-colors">
                                #{submissions.length - i}
                              </td>
                              <td className="px-5 py-4 font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                                {new Date(s.submitted_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </td>
                              <td className="px-5 py-4 text-center font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                {s.language}
                              </td>
                              <td className="px-5 py-4 text-right">
                                <span className={`inline-flex px-2.5 py-1 rounded-[3px] border font-mono text-[9px] font-bold tracking-widest uppercase ${
                                    s.verdict === "AC"
                                      ? "bg-orange-50 dark:bg-orange-500/10 text-orange-500 dark:text-orange-400 border-orange-200 dark:border-orange-500/30"
                                      : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-500 border-red-200 dark:border-red-500/30"
                                  }`}>
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
                        onClick={() => { setLanguage(langItem.val); setLanguageOpen(false); }}
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
                    disabled={submitting || runLoading}
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

          {submitError && (
            <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 px-4 py-2 text-[10px] font-mono font-bold uppercase tracking-widest border-b border-red-200 dark:border-red-500/30 flex-shrink-0 flex items-center gap-2">
              <Terminal size={12} /> [ERROR] {submitError}
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
              <button onClick={handleCopy} className="flex h-full items-center gap-1.5 px-2 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">
                {copySuccess ? <CheckCheck size={10} className="text-green-500" /> : <ClipboardCopy size={10} />}
                <span className="hidden md:block">{copySuccess ? "COPIED" : "COPY"}</span>
              </button>
              <button onClick={() => { if(window.confirm("Reset IDE?")) { if (collabActive) yTextRef.current?.delete(0, yTextRef.current.length); else editorRef.current?.setValue(""); } }} className="flex h-full items-center gap-1.5 px-2 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-red-500 transition-colors cursor-pointer">
                <RefreshCcw size={10} /> <span className="hidden md:block">RESET</span>
              </button>
              <button onClick={() => setShowCloudModal(true)} className="flex h-full items-center gap-1.5 px-2 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-blue-500 transition-colors cursor-pointer">
                <CloudSync size={10} /> <span className="hidden md:block">CLOUD</span>
              </button>
              <button onClick={() => setShowRestoreModal(true)} className="flex h-full items-center gap-1.5 px-2 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-purple-500 transition-colors cursor-pointer">
                <GitCommit size={10} /> <span className="hidden md:block">HISTORY</span>
              </button>
            </div>
          </div>

        </section>

        {/* ===== SUBMISSION MODAL ===== */}
        {openSubmission && (
          <div className="fixed inset-0 bg-slate-900/80 z-[150] backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#0d1117] w-full max-w-4xl h-[85vh] rounded-[3px] shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 transition-colors">
              {/* Modal Header */}
              <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#050608] transition-colors">
                <div className="flex items-center gap-4">
                  <div className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-[0.15em] flex items-center gap-2">
                    <Terminal size={14} className="text-orange-500" />
                    SUBMISSION RECORD
                  </div>
                  <span className={`font-mono text-[9px] -translate-x-2 px-2 py-0.5 rounded-[3px] border font-bold uppercase tracking-widest ${
                      openSubmission.verdict === "AC"
                        ? "bg-orange-50 dark:bg-orange-500/10 text-orange-500 dark:text-orange-400 border-orange-200 dark:border-orange-500/30"
                        : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-500 border-red-200 dark:border-red-500/30"
                    }`}>
                    {openSubmission.verdict}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {openSubmission.verdict === "AC" && (
                    <button
                      onClick={() => evaluate_complexity(openSubmission.id)}
                      disabled={true || complexity?.id === openSubmission.id}
                      className="font-mono text-[9px] font-bold tracking-widest rounded-[3px] bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-500 border border-purple-200 dark:border-purple-500/30 px-3 py-1.5 hover:bg-purple-100 dark:hover:bg-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed uppercase transition-colors"
                    >
                      {complexity?.id === openSubmission.id ? "ANALYZED" : "AI ANALYSIS"}
                    </button>
                  )}
                  <button onClick={() => setOpenSubmission(null)} className="font-mono text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer bg-transparent border-none p-1">
                    <XSquare size={16} />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1117] px-5 py-3">
                <button
                  onClick={() => { setCmpCode([openSubmission.code, code]); setDifferentiate(true); setOpenSubmission(null); }}
                  className="rounded-[3px] border border-orange-500 bg-orange-500 px-4 py-1.5 font-mono text-[10px] font-bold tracking-widest text-white uppercase transition-all hover:bg-orange-600 cursor-pointer"
                >
                  DIFF WITH CURRENT
                </button>
                <button
                  onClick={() => window.confirm("coming soon...")}
                  className="rounded-[3px] border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-1.5 font-mono text-[10px] font-bold tracking-widest text-slate-600 dark:text-slate-400 uppercase transition-all hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  DIFF WITH OTHER
                </button>
                <button
                  onClick={() => {
                    if (collabActive) { yTextRef.current?.delete(0, yTextRef.current.length); yTextRef.current?.insert(0, openSubmission.code); } 
                    else editorRef?.current?.setValue(openSubmission.code);
                    setLanguage(openSubmission.language);
                    setOpenSubmission(null);
                  }}
                  className="rounded-[3px] border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-1.5 font-mono text-[10px] font-bold tracking-widest text-slate-600 dark:text-slate-400 uppercase transition-all hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer ml-auto"
                >
                  RESTORE CODE
                </button>
              </div>

              {/* AI Complexity Dropdown */}
              <div className={`flex-shrink-0 overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${complexity && complexity.id === openSubmission.id ? "max-h-40 opacity-100 border-b border-slate-200 dark:border-slate-800" : "max-h-0 opacity-0"}`}>
                <div className="px-5 py-4 bg-slate-50 dark:bg-[#050608] flex flex-col gap-2 transition-colors">
                  <div className="font-mono text-[10px] font-bold tracking-widest text-slate-500 uppercase">
                    AI Complexity Analysis
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-3 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-2">
                      <span className="font-bold uppercase tracking-wider text-slate-400">Time:</span>
                      <span className="bg-white dark:bg-[#0d1117] px-2 py-0.5 rounded-[3px] border border-slate-200 dark:border-slate-800 text-purple-500">
                        <InlineMath math={complexity?.time || "O(1)"} />
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold uppercase tracking-wider text-slate-400">Space:</span>
                      <span className="bg-white dark:bg-[#0d1117] px-2 py-0.5 rounded-[3px] border border-slate-200 dark:border-slate-800 text-emerald-500">
                        <InlineMath math={complexity?.space || "O(1)"} />
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Readonly Editor */}
              <div className="flex-1 relative bg-slate-50 dark:bg-[#1e1e1e]">
                <Editor
                  height="100%"
                  language={openSubmission.language || "cpp"}
                  value={openSubmission.code}
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
      
      {showRestoreModal && (
        <div className="fixed inset-0 custom-scrollbar z-[200] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
          <div className="w-[92%] md:w-[65%] lg:w-[55%] h-[80%] overflow-hidden rounded-[3px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1117] shadow-2xl flex flex-col">
            <div className="flex h-14 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#050608] px-5 flex-shrink-0">
              <h2 className="font-mono text-[12px] font-bold tracking-[0.15em] text-slate-800 dark:text-white uppercase flex items-center gap-2">
                <Terminal size={14} className="text-orange-400"/> Restore History
              </h2>
              <button onClick={() => setShowRestoreModal(false)} className="rounded-[3px] cursor-pointer p-1.5 text-slate-500 transition hover:bg-slate-200 dark:hover:bg-slate-800">
                <XSquare size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {submissions.map((sub, i) => (
                    <tr
                      key={sub._id ?? i}
                      onClick={() => {
                        if (collabActive) { yTextRef.current?.delete(0, yTextRef.current.length); yTextRef.current?.insert(0, sub.code); } 
                        else editorRef?.current?.setValue(sub.code);
                        setLanguage(sub.language);
                        setShowRestoreModal(false);
                      }}
                      className="cursor-pointer transition-colors group odd:bg-white even:bg-slate-50 dark:odd:bg-[#0d1117] dark:even:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/80"
                    >
                      <td className="px-5 py-3.5 font-mono text-[12px] font-bold text-slate-700 dark:text-slate-300 group-hover:text-orange-500 transition-colors">
                        Sub. #{submissions.length - i}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                        {sub.language}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        {new Date(sub.submitted_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className={`inline-flex px-2 py-0.5 rounded-[3px] border font-mono text-[9px] font-bold tracking-widest uppercase ${
                            sub.verdict === "AC"
                              ? "bg-orange-50 dark:bg-orange-500/10 text-orange-500 dark:text-orange-400 border-orange-200 dark:border-orange-500/30"
                              : "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-500 border-red-200 dark:border-red-500/30"
                          }`}>
                          {sub.verdict}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {differentiate && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm">
          <div className="w-[90vw] h-[90vh] bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 rounded-[3px] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#050608]">
              <div className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest flex items-center gap-2">
                <Terminal size={14} className="text-blue-500"/> DIFF VIEWER
              </div>
              <button className="flex items-center gap-1.5 px-3 py-1 font-mono text-[10px] font-bold text-white uppercase tracking-widest bg-blue-600 hover:bg-blue-700 rounded-[3px] cursor-pointer" onClick={() => setDifferentiate(false)}>
                <XSquare size={14} /> CLOSE
              </button>
            </div>
            <div className="flex-1 relative">
              <DiffEditor
                height="100%"
                width="100%"
                language="cpp"
                theme={editorTheme}
                original={cmpCode[0]}
                modified={cmpCode[1]}
                options={{
                  readOnly: true,
                  renderSideBySide: true,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 13,
                }}
              />
            </div>
          </div>
        </div>
      )}

      <div className={`${showCloudModal ? "flex" : "hidden"} fixed inset-0 z-[150] items-center justify-center bg-slate-900/80 backdrop-blur-sm transition-opacity duration-300`}>
        <div className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 rounded-[3px] shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
          <div className="flex justify-between items-center px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#050608]">
            <h2 className="font-mono text-[12px] font-bold text-slate-900 dark:text-white uppercase tracking-[0.15em] flex items-center gap-2">
              <CloudSync size={14} className="text-orange-400" /> Cloud Sync
            </h2>
            <button className="text-slate-400 cursor-pointer hover:text-orange-500 transition-all duration-300 ease-out" onClick={() => { setShowCloudModal(false); setIsCreatingSave(false); setSaveTitle(""); }}>
              <XSquare size={16} />
            </button>
          </div>

          {!cloudModalInit ? (
            <div className="flex flex-col items-center justify-center p-10">
              <p className="text-center text-slate-500 dark:text-slate-400 mb-6 font-sans text-[12px] tracking-wide font-semibold">
                Access your cloud repository to restore previously saved code.
              </p>
              <button onClick={handleFetchSaves} disabled={isFetching} className="flex items-center justify-center gap-2 border border-orange-500 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-white font-mono font-bold tracking-widest py-2 px-6 rounded-[3px] transition-all text-[11px] uppercase">
                {isFetching ? <RefreshCcw size={14} className="animate-spin" /> : <CloudSync size={14} />}
                {isFetching ? "SYNCING..." : "FETCH SAVES"}
              </button>
            </div>
          ) : (
            <div className="p-5 flex flex-col gap-5">
              {!isCreatingSave ? (
                <button onClick={() => setIsCreatingSave(true)} className="w-full bg-slate-50 dark:bg-[#050608] hover:bg-blue-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-orange-400 text-slate-600 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-500 py-2.5 rounded-[3px] transition-colors font-sans text-[11px] font-semibold cursor-pointer flex items-center justify-center gap-2">
                  <PlaySquare size={12} /> Make New Save
                </button>
              ) : (
                <div className="flex gap-2">
                  <input type="text" placeholder="Enter save signature..." value={saveTitle} onChange={(e) => setSaveTitle(e.target.value)} className="flex-1 bg-white dark:bg-[#050608] border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white px-3 py-2 rounded-[3px] outline-none focus:border-orange-500 transition-colors font-mono text-[11px]" autoFocus />
                  <button onClick={handleCreateSave} disabled={isSaving || !saveTitle.trim()} className="flex items-center justify-center font-sans font-semibold tracking-wide bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-[3px] text-[10px] uppercase transition-colors cursor-pointer border border-orange-600">
                    {isSaving ? <RefreshCcw size={12} className="animate-spin mr-1" /> : "Create"}
                  </button>
                  <button onClick={() => setIsCreatingSave(false)} disabled={isSaving} className="font-sans font-semibold tracking-wide bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-3 py-2 rounded-[3px] text-[10px] transition-colors cursor-pointer">
                    Cancel
                  </button>
                </div>
              )}

              <div className="flex flex-col border border-slate-200 dark:border-slate-800 rounded-[3px] max-h-64 overflow-y-auto custom-scrollbar relative">
                {isFetching && (
                  <div className="absolute inset-0 bg-white/80 dark:bg-[#0d1117]/80 backdrop-blur-sm z-10 flex items-center justify-center">
                    <RefreshCcw className="animate-spin text-orange-400" size={24} />
                  </div>
                )}
                {cloudSaves.length > 0 ? (
                  cloudSaves.map((cs) => (
                    <div
                      key={cs.id}
                      onClick={() => {
                        if (collabActive) { yTextRef.current?.delete(0, yTextRef.current.length); yTextRef.current?.insert(0, cs.code); } 
                        else editorRef?.current?.setValue(cs.code);
                        setLanguage(cs.language);
                        setShowCloudModal(false);
                      }}
                      className="flex justify-between items-center px-4 py-3 border-b last:border-b-0 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1117] cursor-pointer transition-colors hover:border-l-2 hover:border-l-blue-500 hover:bg-slate-50 dark:hover:bg-slate-900/50 group"
                    >
                      <div className="flex flex-col">
                        <span className="font-sans text-[14px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-500 transition-colors">
                          {cs.title}
                        </span>
                        <span className="font-mono text-[9px] text-slate-400 dark:text-slate-500 tracking-widest uppercase mt-1">
                          {new Date(cs.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-mono font-bold tracking-widest text-[9px] px-2 py-0.5 rounded-[3px] uppercase">
                        {cs.language}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center font-mono text-[10px] font-bold tracking-[0.15em] text-slate-400 uppercase bg-slate-50 dark:bg-[#050608]">
                    NO CLOUD SAVES
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

    </>
  );
}