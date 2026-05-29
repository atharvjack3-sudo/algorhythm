import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import axios from "axios";
import { api } from "../api/client"; // Adjust path as necessary

import "highlight.js/styles/atom-one-dark.css";
import "katex/dist/katex.min.css";

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
        prose-code:font-mono prose-code:text-[13px] prose-code:bg-slate-100 dark:prose-code:bg-slate-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-[3px]
        prose-pre:font-mono prose-pre:text-[13px] prose-pre:bg-slate-50 dark:prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-200 dark:prose-pre:border-slate-800 prose-pre:rounded-[3px] prose-pre:text-slate-800 dark:prose-pre:text-slate-200
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

/* =========================
   REUSABLE MARKDOWN EDITOR
========================= */
function MarkdownEditor({ label, value, onChange, placeholder, minHeight = "120px" }) {
  const [mode, setMode] = useState("write"); // write | preview

  return (
    <div className="flex flex-col border border-slate-300 dark:border-slate-700 rounded-[3px] overflow-hidden bg-white dark:bg-slate-950">
      <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 border-b border-slate-300 dark:border-slate-700 px-3 py-2">
        <span className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          {label}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setMode("write")}
            className={`font-mono text-[9px] font-bold tracking-wider px-2.5 py-0.5 rounded-[2px] uppercase transition-colors ${
              mode === "write"
                ? "bg-blue-600 text-white"
                : "bg-transparent text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
            }`}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => setMode("preview")}
            className={`font-mono text-[9px] font-bold tracking-wider px-2.5 py-0.5 rounded-[2px] uppercase transition-colors ${
              mode === "preview"
                ? "bg-blue-600 text-white"
                : "bg-transparent text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
            }`}
          >
            Preview
          </button>
        </div>
      </div>
      {mode === "write" ? (
        <textarea
          className="w-full p-3 font-mono text-[13px] bg-transparent text-slate-800 dark:text-slate-200 outline-none resize-y break-words whitespace-pre-wrap custom-scrollbar"
          style={{ minHeight }}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <div 
          className="p-4 bg-transparent overflow-y-auto break-words whitespace-pre-wrap custom-scrollbar" 
          style={{ minHeight, maxHeight: "400px" }}
        >
          {value.trim() ? (
            <MarkdownRenderer content={value} />
          ) : (
            <div className="text-center font-mono text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-4">
              Nothing to preview
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* =========================
   FILE UPLOAD BUTTON
========================= */
function FileUploadButton({ onFileRead }) {
  return (
    <label className="cursor-pointer font-mono text-[9px] font-bold tracking-[0.1em] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-[2px] hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors uppercase shrink-0 flex items-center gap-2">
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
      UPLOAD .TXT
      <input
        type="file"
        accept=".txt"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => onFileRead(ev.target.result);
          reader.readAsText(file);
          e.target.value = null; // Reset to allow uploading the same file again
        }}
      />
    </label>
  );
}

/* =========================
   MAIN COMPONENT
========================= */
export default function AdminControlPanel({ user }) {
  // Existing Fetch User State
  const [fetchUsername, setFetchUsername] = useState("");
  const [fetchedUser, setFetchedUser] = useState(null);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchedUserNewRole, setFetchedUserNewRole] = useState("user");
  const [updateBanStatus, setUpdateBanStatus] = useState(false);
  const [detailUpdateLoading, setDetailUpdateLoading] = useState(false);

  // Tab State
  const [adminTab, setAdminTab] = useState("users"); // "users" | "problem"

  // Create Problem State
  const [probTitle, setProbTitle] = useState("");
  const [probDifficulty, setProbDifficulty] = useState("medium");
  const [probStatement, setProbStatement] = useState("");
  const [probConstraints, setProbConstraints] = useState("");
  const [probInputFormat, setProbInputFormat] = useState("");
  const [probOutputFormat, setProbOutputFormat] = useState("");
  const [probEditorial, setProbEditorial] = useState("");
  const [probTopics, setProbTopics] = useState(""); // Comma-separated string
  const [samples, setSamples] = useState([{ input: "", output: "" }]);
  const [hiddens, setHiddens] = useState([{ input: "", output: "" }]);
  const [isSubmittingProblem, setIsSubmittingProblem] = useState(false);

  // --- Handlers for Fetch User (Mocks for your existing logic) ---
  async function fetchExternal() {
    try {
      setFetchLoading(true);
      const res = await api.get(`/user-information/${fetchUsername}`);
      setFetchedUser(res.data);
      setFetchedUserNewRole(res.data.role);
      setUpdateBanStatus(res.data.is_banned);
    } catch (err) {
      console.error(err);
    } finally {
      setFetchLoading(false);
    }
  }

  async function updateUserDetails() {
    try {
      setDetailUpdateLoading(true);
      const payload = {
        role: fetchedUserNewRole,
        is_banned: updateBanStatus,
      };
      await api.post(`/update-user-information/${fetchedUser.id}`, payload);
      setFetchedUser((prev) => ({
        ...prev,
        role: fetchedUserNewRole,
        is_banned: updateBanStatus,
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setDetailUpdateLoading(false);
    }
  }

  // --- Handlers for Problem Creation ---
  const updateTestcase = (type, index, field, value) => {
    if (type === "sample") {
      const newSamples = [...samples];
      newSamples[index][field] = value;
      setSamples(newSamples);
    } else {
      const newHiddens = [...hiddens];
      newHiddens[index][field] = value;
      setHiddens(newHiddens);
    }
  };

  const addTestcase = (type) => {
    if (type === "sample") setSamples([...samples, { input: "", output: "" }]);
    else setHiddens([...hiddens, { input: "", output: "" }]);
  };

  const removeTestcase = (type, index) => {
    if (type === "sample") {
      setSamples(samples.filter((_, i) => i !== index));
    } else {
      setHiddens(hiddens.filter((_, i) => i !== index));
    }
  };

  const handleCreateProblem = async (e) => {
    e.preventDefault();
    if (!probTitle.trim() || !probStatement.trim()) {
      alert("Title and Statement are required.");
      return;
    }

    const payload = {
      title: probTitle.trim(),
      difficulty: probDifficulty,
      statement: probStatement.trim(),
      constraints: probConstraints.trim(),
      input_format: probInputFormat.trim(),
      output_format: probOutputFormat.trim(),
      editorial: probEditorial.trim(),
      topics: probTopics
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      sample_testcases: samples,
      hidden_testcases: hiddens,
    };

    try {
      setIsSubmittingProblem(true);
      console.log("Submitting Payload:", JSON.stringify(payload, null, 2));
      const res = await axios.post("http://localhost:5000/api/add-problem", payload);
      alert("Problem created successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to create problem.");
    } finally {
      setIsSubmittingProblem(false);
    }
  };

  if (user?.role !== "owner") return null;

  return (
    <>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 4px; width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #475569; border-radius: 2px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
        
        .cf-markdown p { margin-bottom: 1rem; line-height: 1.6; word-wrap: break-word; overflow-wrap: break-word; }
        .cf-markdown code { font-family: 'JetBrains Mono', monospace; font-size: 0.9em; padding: 0.15rem 0.3rem; background: var(--code-bg); border-radius: 0.25rem; }
        .cf-markdown pre { background: var(--pre-bg); padding: 1rem; border-radius: 0.375rem; overflow-x: auto; font-family: 'JetBrains Mono', monospace; font-size: 0.85em; border: 1px solid var(--border-color); }
        .cf-markdown pre code { background: transparent; padding: 0; white-space: pre-wrap; word-break: break-all; }
        :root { --code-bg: #f1f5f9; --pre-bg: #f8fafc; --border-color: #e2e8f0; }
        .dark { --code-bg: rgba(30, 41, 59, 0.5); --pre-bg: #0f172a; --border-color: #1e293b; }
      `}</style>

      <div className="w-full flex flex-col bg-slate-50 dark:bg-slate-950 justify-center items-center pb-16 pt-10 transition-colors duration-200">
        
        {/* Container */}
        <div className="w-[90%] max-w-5xl bg-white dark:bg-slate-900 rounded-md shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col mb-6">
          
          {/* Panel Header & Tabs */}
          <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50 rounded-t-md">
            <div className="flex items-center gap-2.5">
              <span className="inline-block w-[3px] h-[14px] rounded-sm bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
              <span className="font-mono text-[11px] font-semibold tracking-[0.12em] text-slate-500 dark:text-slate-400 uppercase">
                Control Panel ({user?.role})
              </span>
            </div>

            {/* Admin Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setAdminTab("users")}
                className={`font-mono text-[10px] font-bold tracking-widest px-3 py-1 rounded-[3px] uppercase transition-colors ${
                  adminTab === "users"
                    ? "bg-slate-800 text-white dark:bg-white dark:text-slate-900"
                    : "bg-transparent text-slate-500 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                Manage Users
              </button>
              <button
                onClick={() => setAdminTab("problem")}
                className={`font-mono text-[10px] font-bold tracking-widest px-3 py-1 rounded-[3px] uppercase transition-colors ${
                  adminTab === "problem"
                    ? "bg-orange-500 text-white dark:text-slate-950 border border-orange-500"
                    : "bg-transparent text-slate-500 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
              >
                Create Problem
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* ================================================== */}
            {/* MANAGE USERS TAB                 */}
            {/* ================================================== */}
            {adminTab === "users" && (
              <div className="flex flex-col gap-6 animate-in fade-in duration-200">
                {/* Fetch Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    fetchExternal();
                  }}
                  className="flex flex-col sm:flex-row items-start sm:items-end gap-3"
                >
                  <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                    <label className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      Fetch User
                    </label>
                    <input
                      className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-[3px] px-3 py-1.5 text-[12px] font-mono outline-none focus:border-orange-500 dark:focus:border-orange-500 transition-colors w-full sm:w-64"
                      value={fetchUsername}
                      onChange={(e) => setFetchUsername(e.target.value)}
                      required
                      type="text"
                      placeholder="Enter username..."
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={fetchLoading}
                    className="font-mono text-[11px] font-bold tracking-[0.12em] rounded-[3px] transition-opacity duration-150 cursor-pointer bg-slate-800 dark:bg-white text-white dark:text-slate-900 border-none px-6 py-1.5 hover:opacity-85 h-[32px] disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                  >
                    {fetchLoading ? "FETCHING..." : "FETCH →"}
                  </button>
                </form>

                {/* Fetched User Results */}
                {fetchedUser != null && (
                  <div className="bg-slate-50 dark:bg-slate-950/30 rounded-md border border-slate-200 dark:border-slate-800 flex flex-col mt-2">
                    <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 rounded-t-md">
                      <div className="flex items-center gap-2.5">
                        <span className="inline-block w-[3px] h-[14px] rounded-sm bg-blue-500" />
                        <span className="font-mono text-[10px] font-semibold tracking-[0.12em] text-slate-500 dark:text-slate-400 uppercase">
                          User Details
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setFetchedUser(null);
                          setFetchUsername("");
                          setFetchedUserNewRole("user");
                        }}
                        className="font-mono text-[10px] font-semibold tracking-[0.06em] bg-transparent text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 border border-slate-300 dark:border-slate-700 px-3 py-1 rounded-[3px] hover:border-red-500 transition-colors uppercase cursor-pointer"
                      >
                        Clear [X]
                      </button>
                    </div>

                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                      <div className="flex flex-col gap-1 border-b border-slate-200 dark:border-slate-800/60 pb-2">
                        <span className="font-mono text-[9px] font-semibold text-slate-500 uppercase tracking-[0.1em]">ID</span>
                        <span className="font-mono text-[12px] text-slate-800 dark:text-slate-200">{fetchedUser.id}</span>
                      </div>
                      <div className="flex flex-col gap-1 border-b border-slate-200 dark:border-slate-800/60 pb-2">
                        <span className="font-mono text-[9px] font-semibold text-slate-500 uppercase tracking-[0.1em]">Username</span>
                        <span className="font-sans text-[14px] font-bold text-slate-900 dark:text-white">{fetchedUser.username}</span>
                      </div>
                      <div className="flex flex-col gap-1 border-b border-slate-200 dark:border-slate-800/60 pb-2">
                        <span className="font-mono text-[9px] font-semibold text-slate-500 uppercase tracking-[0.1em]">Email</span>
                        <span className="font-mono text-[11px] text-slate-800 dark:text-slate-200">{fetchedUser.email}</span>
                      </div>
                      <div className="flex flex-col gap-1 border-b border-slate-200 dark:border-slate-800/60 pb-2">
                        <span className="font-mono text-[9px] font-semibold text-slate-500 uppercase tracking-[0.1em]">Role</span>
                        <span className="font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase">{fetchedUser.role}</span>
                      </div>
                      <div className="flex flex-col gap-1 border-b border-slate-200 dark:border-slate-800/60 pb-2">
                        <span className="font-mono text-[9px] font-semibold text-slate-500 uppercase tracking-[0.1em]">Contest Rating</span>
                        <span className="font-mono text-[11px] text-slate-800 dark:text-slate-200">{fetchedUser.contest_rating || 1200}</span>
                      </div>
                      <div className="flex flex-col gap-1 border-b border-slate-200 dark:border-slate-800/60 pb-2">
                        <span className="font-mono text-[9px] font-semibold text-slate-500 uppercase tracking-[0.1em]">Contest Global Rank</span>
                        <span className="font-mono text-[11px] text-slate-800 dark:text-slate-200">{fetchedUser.contest_global_rank || "--"}</span>
                      </div>
                      <div className="flex flex-col gap-1 border-b border-slate-200 dark:border-slate-800/60 pb-2">
                        <span className="font-mono text-[9px] font-semibold text-slate-500 uppercase tracking-[0.1em]">Banned Status</span>
                        {fetchedUser.is_banned ? (
                          <span className="inline-flex w-max items-center gap-1.5 px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-mono text-[10px] font-bold rounded-[3px] border border-red-200 dark:border-red-800/30 uppercase tracking-[0.1em]">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]"></span>
                            Yes
                          </span>
                        ) : (
                          <span className="font-mono text-[11px] text-slate-800 dark:text-slate-200">No</span>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 border-b border-slate-200 dark:border-slate-800/60 pb-2">
                        <span className="font-mono text-[9px] font-semibold text-slate-500 uppercase tracking-[0.1em]">Created At</span>
                        <span className="font-mono text-[11px] text-slate-800 dark:text-slate-200">{new Date(fetchedUser.created_at).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Actions Form */}
                    <div className="p-5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-b-md">
                      <div className="font-mono text-[10px] font-semibold tracking-[0.1em] text-slate-500 dark:text-slate-400 uppercase mb-4">
                        Administrative Actions
                      </div>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          updateUserDetails();
                        }}
                        className="flex flex-col sm:flex-row items-start sm:items-center gap-6"
                      >
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <div className="relative flex items-center justify-center">
                            <input
                              type="checkbox"
                              className="peer sr-only"
                              checked={updateBanStatus}
                              onChange={(e) => setUpdateBanStatus(e.target.checked)}
                            />
                            <div className="w-4 h-4 border border-slate-300 dark:border-slate-600 rounded-[3px] bg-slate-50 dark:bg-slate-950 peer-checked:bg-red-500 peer-checked:border-red-500 transition-colors" />
                            <svg className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-widest group-hover:text-red-500 transition-colors">
                            Ban User
                          </span>
                        </label>

                        <div className="flex items-center gap-3">
                          <label className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                            Update Role
                          </label>
                          <select
                            value={fetchedUserNewRole}
                            onChange={(e) => setFetchedUserNewRole(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-[3px] px-3 py-1 text-[11px] font-mono outline-none focus:border-orange-500 transition-colors cursor-pointer uppercase tracking-widest"
                          >
                            <option value="user">User</option>
                            <option value="moderator">Moderator</option>
                            <option disabled value="owner">Owner</option>
                          </select>
                        </div>
                        <button
                          type="submit"
                          disabled={detailUpdateLoading}
                          className="font-mono text-[11px] font-bold tracking-[0.12em] rounded-[3px] transition-opacity duration-150 cursor-pointer bg-red-600 text-white border-none px-6 py-1.5 hover:opacity-85 h-[30px] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {detailUpdateLoading ? "UPDATING..." : "UPDATE →"}
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ================================================== */}
            {/* CREATE PROBLEM TAB                 */}
            {/* ================================================== */}
            {adminTab === "problem" && (
              <form
                onSubmit={handleCreateProblem}
                className="flex flex-col gap-6 animate-in fade-in duration-200"
              >
                {/* Header Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                      Problem Title *
                    </label>
                    <input
                      className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-[3px] px-4 py-2 font-sans text-[14px] font-bold outline-none focus:border-orange-500 transition-colors"
                      value={probTitle}
                      onChange={(e) => setProbTitle(e.target.value)}
                      placeholder="e.g., Next Farthest Smaller Element"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                      Difficulty
                    </label>
                    <select
                      className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-[3px] px-4 py-2 font-mono text-[12px] font-bold uppercase outline-none focus:border-orange-500 transition-colors cursor-pointer tracking-wider"
                      value={probDifficulty}
                      onChange={(e) => setProbDifficulty(e.target.value)}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

                {/* Topics */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                    Topics <span className="text-slate-400 lowercase font-sans font-normal tracking-normal">(comma separated)</span>
                  </label>
                  <input
                    className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-[3px] px-4 py-2 font-mono text-[12px] outline-none focus:border-orange-500 transition-colors"
                    value={probTopics}
                    onChange={(e) => setProbTopics(e.target.value)}
                    placeholder="e.g., Greedy, Sorting, Binary Search"
                  />
                </div>

                {/* Markdown Editors */}
                <MarkdownEditor
                  label="Problem Statement *"
                  value={probStatement}
                  onChange={setProbStatement}
                  placeholder="Describe the problem clearly. LaTeX allowed with $$ or $."
                  minHeight="200px"
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <MarkdownEditor
                    label="Input Format"
                    value={probInputFormat}
                    onChange={setProbInputFormat}
                    placeholder="Format of the standard input..."
                  />
                  <MarkdownEditor
                    label="Output Format"
                    value={probOutputFormat}
                    onChange={setProbOutputFormat}
                    placeholder="Format of the expected output..."
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <MarkdownEditor
                    label="Constraints"
                    value={probConstraints}
                    onChange={setProbConstraints}
                    placeholder="e.g., $$1 \le N \le 10^5$$"
                  />
                  <MarkdownEditor
                    label="Editorial / Solution"
                    value={probEditorial}
                    onChange={setProbEditorial}
                    placeholder="Explain how to solve it..."
                  />
                </div>

                <hr className="border-slate-200 dark:border-slate-800 my-2" />

                {/* --- SAMPLE TEST CASES --- */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-widest">
                      Sample Testcases (Visible)
                    </span>
                    <button
                      type="button"
                      onClick={() => addTestcase("sample")}
                      className="font-mono text-[10px] font-bold tracking-wider px-3 py-1 rounded-[3px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors uppercase border border-slate-300 dark:border-slate-700"
                    >
                      + Add Sample
                    </button>
                  </div>

                  {samples.map((tc, idx) => (
                    <div
                      key={`sample-${idx}`}
                      className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3px] p-4 flex flex-col gap-3 shadow-sm"
                    >
                      <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2.5">
                        <span className="font-mono text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                          Sample #{idx + 1}
                        </span>
                        {samples.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTestcase("sample", idx)}
                            className="font-mono text-[10px] text-red-500 hover:text-red-600 uppercase font-bold tracking-widest"
                          >
                            Remove [X]
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between items-center">
                            <label className="font-mono text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                              Standard Input
                            </label>
                            <FileUploadButton
                              onFileRead={(text) => updateTestcase("sample", idx, "input", text)}
                            />
                          </div>
                          <textarea
                            className="w-full font-mono text-[12px] bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-[3px] p-3 text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition-colors resize-y min-h-[100px] whitespace-pre custom-scrollbar"
                            value={tc.input}
                            onChange={(e) => updateTestcase("sample", idx, "input", e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between items-center">
                            <label className="font-mono text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                              Expected Output
                            </label>
                            <FileUploadButton
                              onFileRead={(text) => updateTestcase("sample", idx, "output", text)}
                            />
                          </div>
                          <textarea
                            className="w-full font-mono text-[12px] bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-[3px] p-3 text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 transition-colors resize-y min-h-[100px] whitespace-pre custom-scrollbar"
                            value={tc.output}
                            onChange={(e) => updateTestcase("sample", idx, "output", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* --- HIDDEN TEST CASES --- */}
                <div className="flex flex-col gap-3 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-widest">
                      Hidden Testcases (System Testing)
                    </span>
                    <button
                      type="button"
                      onClick={() => addTestcase("hidden")}
                      className="font-mono text-[10px] font-bold tracking-wider px-3 py-1 rounded-[3px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors uppercase border border-slate-300 dark:border-slate-700"
                    >
                      + Add Hidden
                    </button>
                  </div>

                  {hiddens.map((tc, idx) => (
                    <div
                      key={`hidden-${idx}`}
                      className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3px] p-4 flex flex-col gap-3 shadow-sm"
                    >
                      <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2.5">
                        <span className="font-mono text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                          Hidden #{idx + 1}
                        </span>
                        {hiddens.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTestcase("hidden", idx)}
                            className="font-mono text-[10px] text-red-500 hover:text-red-600 uppercase font-bold tracking-widest"
                          >
                            Remove [X]
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between items-center">
                            <label className="font-mono text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                              Standard Input
                            </label>
                            <FileUploadButton
                              onFileRead={(text) => updateTestcase("hidden", idx, "input", text)}
                            />
                          </div>
                          <textarea
                            className="w-full font-mono text-[12px] bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-[3px] p-3 text-slate-800 dark:text-slate-200 outline-none focus:border-red-500/50 transition-colors resize-y min-h-[100px] whitespace-pre custom-scrollbar"
                            value={tc.input}
                            onChange={(e) => updateTestcase("hidden", idx, "input", e.target.value)}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between items-center">
                            <label className="font-mono text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                              Expected Output
                            </label>
                            <FileUploadButton
                              onFileRead={(text) => updateTestcase("hidden", idx, "output", text)}
                            />
                          </div>
                          <textarea
                            className="w-full font-mono text-[12px] bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-[3px] p-3 text-slate-800 dark:text-slate-200 outline-none focus:border-red-500/50 transition-colors resize-y min-h-[100px] whitespace-pre custom-scrollbar"
                            value={tc.output}
                            onChange={(e) => updateTestcase("hidden", idx, "output", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Submit Wrapper */}
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <p className="font-semibold text-xs tracking-wider text-red-500 font-sans">
                    * Only use when running on localhost & DB is on cloud
                  </p>
                  <button
                    type="submit"
                    // disabled={isSubmittingProblem}
                    disabled={true}
                    className="font-mono text-[12px] font-bold tracking-[0.12em] rounded-[3px] transition-opacity duration-150 cursor-pointer bg-orange-500 text-slate-950 border-none px-8 py-3 hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingProblem ? "PUBLISHING..." : "PUBLISH PROBLEM →"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}