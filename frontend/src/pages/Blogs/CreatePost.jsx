import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import MarkdownRenderer from "../../components/MarkdownRenderer";
import "katex/dist/katex.min.css";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading,
  Quote,
  List,
  ListOrdered,
  Link,
  Image as ImageIcon,
  Code,
  Terminal,
} from "lucide-react";

export default function CreateBlog() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mode, setMode] = useState("write"); // write | preview
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const textareaRef = useRef(null);

  const insertMarkdown = (before, after = "") => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setContent((prev) => prev + before + after);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    const newText =
      text.substring(0, start) +
      before +
      selectedText +
      after +
      text.substring(end);
    setContent(newText);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const submitBlog = async () => {
    if (!title.trim() || !content.trim()) {
      alert("Title and content are required");
      return;
    }
    try {
      setLoading(true);
      await api.post("/blogs", { title, content });
      navigate("/blogs");
    } catch {
      alert("Failed to publish blog");
    } finally {
      setLoading(false);
    }
  };

  const toolbarBtnClass =
    "font-sans text-[11px] font-semibold tracking-wider flex items-center gap-1.5 px-2.5 py-1.5 rounded-[3px] border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-[#0d1117] cursor-pointer";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .font-sans { font-family: 'DM Sans', sans-serif; }
      `}</style>

      <div className="min-h-screen bg-slate-100 dark:bg-[#0a0a0f] text-slate-800 dark:text-slate-200 pb-16">
        <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col gap-8">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <span className="inline-block w-[3px] h-[14px] rounded-sm bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
              <span className="font-mono text-[11px] font-semibold tracking-[0.12em] text-slate-500 dark:text-slate-400 uppercase">
                Editor
              </span>
            </div>
            <h1 className="font-sans text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
              Write a Blog
            </h1>
          </div>

          {/* Title Input */}
          <div className="bg-white dark:bg-[#12141c] border border-slate-300 dark:border-slate-800/70 rounded-sm p-6 shadow-sm dark:shadow-none transition-colors">
            <label className="block font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
              Blog Title
            </label>
            <input
              className="w-full px-4 py-3 bg-white dark:bg-[#0a0a0f] border border-slate-300 dark:border-slate-800/80 rounded-md font-sans text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-orange-500 dark:focus:border-orange-500 transition-colors shadow-sm shadow-slate-200/50 dark:shadow-none"
              placeholder="Enter an engaging title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <div className="mt-2 font-mono text-[10px] font-semibold tracking-wider uppercase text-right">
              <span
                className={
                  title.length > 0
                    ? "text-orange-600 dark:text-orange-500"
                    : "text-slate-400 dark:text-slate-600"
                }
              >
                {title.length > 0 ? `${title.length} chars` : "0 chars"}
              </span>
            </div>
          </div>

          {/* Editor Card */}
          <div className="bg-white dark:bg-[#12141c] border border-slate-300 dark:border-slate-800/70 rounded-md shadow-sm dark:shadow-none flex flex-col overflow-hidden transition-colors">
            {/* Tabs */}
            <div className="border-b border-slate-300 dark:border-slate-800/70 bg-slate-50 dark:bg-slate-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 pt-6 sm:pt-0">
              <div className="flex gap-4">
                <button
                  onClick={() => setMode("write")}
                  className={`py-3 font-mono text-[11px] font-semibold tracking-[0.08em] uppercase transition-all duration-200 border-b-[3px] relative top-[1px] bg-transparent flex items-center gap-2 ${
                    mode === "write"
                      ? "text-orange-600 dark:text-orange-500 border-orange-600 dark:border-orange-500"
                      : "text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-400 dark:hover:border-slate-600"
                  }`}
                >
                  <svg
                    className="w-3.5 h-3.5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Write
                </button>
                <button
                  onClick={() => setMode("preview")}
                  className={`py-3 font-mono text-[11px] font-semibold tracking-[0.08em] uppercase transition-all duration-200 border-b-[3px] relative top-[1px] bg-transparent flex items-center gap-2 ${
                    mode === "preview"
                      ? "text-orange-600 dark:text-orange-500 border-orange-600 dark:border-orange-500"
                      : "text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-400 dark:hover:border-slate-600"
                  }`}
                >
                  <svg
                    className="w-3.5 h-3.5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  Preview
                </button>
              </div>
              <p className="font-mono text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-widest pb-3 sm:pb-0">
                {mode === "write"
                  ? "Editor"
                  : "Live Preview"}
              </p>
            </div>

            {/* Editor / Preview Content */}
            {mode === "write" ? (
              <div className="flex flex-col">
                {/* TOOLBAR */}
                <div className="border-b border-slate-300 dark:border-slate-800/70 bg-slate-50 dark:bg-[#12141c]/50 px-6 py-3 flex flex-wrap gap-2 items-center">
                  <button
                    onClick={() => insertMarkdown("**", "**")}
                    className={toolbarBtnClass}
                    title="Bold"
                  >
                    <Bold className="w-3 h-3 text-orange-500" />
                  </button>
                  <button
                    onClick={() => insertMarkdown("*", "*")}
                    className={toolbarBtnClass}
                    title="Italic"
                  >
                    <Italic className="w-3 h-3 text-pink-500" />
                  </button>
                  <button
                    onClick={() => insertMarkdown("~~", "~~")}
                    className={toolbarBtnClass}
                    title="Strikethrough"
                  >
                    <Strikethrough className="w-3 h-3 text-red-400" />
                  </button>
                  <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-700 mx-1"></div>
                  <button
                    onClick={() => insertMarkdown("### ", "")}
                    className={toolbarBtnClass}
                    title="Heading"
                  >
                    <Heading className="w-3 h-3 text-purple-500" />
                  </button>
                  <button
                    onClick={() => insertMarkdown("> ", "")}
                    className={toolbarBtnClass}
                    title="Quote"
                  >
                    <Quote className="w-3 h-3 text-indigo-500" />
                  </button>
                  <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-700 mx-1"></div>
                  <button
                    onClick={() => insertMarkdown("- ", "")}
                    className={toolbarBtnClass}
                    title="Bullet List"
                  >
                    <List className="w-3 h-3 text-cyan-500" />
                  </button>
                  <button
                    onClick={() => insertMarkdown("1. ", "")}
                    className={toolbarBtnClass}
                    title="Numbered List"
                  >
                    <ListOrdered className="w-3 h-3 text-sky-500" />
                  </button>
                  <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-700 mx-1"></div>
                  <button
                    onClick={() => insertMarkdown("[", "](url)")}
                    className={toolbarBtnClass}
                    title="Link"
                  >
                    <Link className="w-3 h-3 text-blue-400" />
                  </button>
                  <button
                    onClick={() => insertMarkdown("![alt text](", ")")}
                    className={toolbarBtnClass}
                    title="Image"
                  >
                    <ImageIcon className="w-3 h-3 text-yellow-500" />
                  </button>
                  <button
                    onClick={() => insertMarkdown("```cpp\n", "\n```")}
                    className={toolbarBtnClass}
                    title="Code Block"
                  >
                    <Code className="w-3 h-3 text-blue-500" />
                  </button>
                  <button
                    onClick={() => insertMarkdown("`", "`")}
                    className={toolbarBtnClass}
                    title="Inline Code"
                  >
                    <Terminal className="w-3 h-3 text-teal-500" />
                  </button>
                  <div className="w-[1px] h-4 bg-slate-300 dark:bg-slate-700 mx-1"></div>
                  <button
                    onClick={() => insertMarkdown("$", "$")}
                    className={`${toolbarBtnClass} text-emerald-600 dark:text-emerald-500 font-mono`}
                    title="Inline Math"
                  >
                    <span className="text-green-400 font-bold">$</span> Inline
                    Math
                  </button>
                  <button
                    onClick={() => insertMarkdown("\n$$\n", "\n$$\n")}
                    className={`${toolbarBtnClass} text-emerald-600 dark:text-emerald-500 font-mono`}
                    title="Block Math"
                  >
                    <span className="text-red-400 font-bold">$$</span> Block
                    Math
                  </button>
                </div>

                {/* TEXTAREA */}
                <div className="p-6">
                  <textarea
                    ref={textareaRef}
                    className="w-full px-4 py-4 bg-white dark:bg-[#0a0a0f] border border-slate-300 dark:border-slate-800/80 rounded-md font-mono text-[13px] leading-relaxed text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition-colors resize-y min-h-[400px] shadow-sm shadow-slate-200/50 dark:shadow-none"
                    placeholder={`Write your content using Markdown...`}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows="18"
                  />
                  <div className="flex justify-between items-center mt-4">
                    <p className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-widest">
                      {content.length > 0
                        ? `${content.length} chars • ${content.split(/\s+/).filter((w) => w).length} words`
                        : "0 words"}
                    </p>
                    <div>
                    <button className="font-mono text-[10px] cursor-pointer font-semibold tracking-[0.06em] rounded-md bg-transparent text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700 px-4 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 transition-colors uppercase">
                      Save Draft
                    </button>
                    <button className="font-mono cursor-pointer ml-4 text-[10px] font-semibold tracking-[0.06em] rounded-md bg-transparent text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700 px-4 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-800 dark:hover:text-slate-200 transition-colors uppercase">
                      Restore
                    </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 md:p-10 min-h-[450px]">
                {content.trim() ? (
                  <div className="prose prose-slate dark:prose-invert max-w-none font-sans text-[14px] leading-relaxed prose-headings:font-sans prose-headings:tracking-tight prose-a:text-orange-600 dark:prose-a:text-orange-400 [&_:not(pre)>code]:font-mono [&_:not(pre)>code]:text-[13px] [&_:not(pre)>code]:bg-slate-100 dark:[&_:not(pre)>code]:bg-slate-800 [&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:rounded-[3px] prose-pre:p-0 prose-pre:bg-transparent prose-pre:border-0 prose-code:before:hidden prose-code:after:hidden">
                    <MarkdownRenderer content={content} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[350px] text-center border border-dashed border-slate-300 dark:border-slate-800/70 rounded-md bg-slate-50 dark:bg-[#0a0a0f]">
                    <div className="font-mono text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Nothing to preview yet
                    </div>
                    <p className="font-sans text-sm text-slate-500 dark:text-slate-400 mt-2">
                      Switch to the Write tab and start typing to see your
                      content here.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons & Status */}
          <div className="bg-white dark:bg-[#12141c] border border-slate-300 dark:border-slate-800/70 rounded-md shadow-sm p-6 flex flex-col sm:flex-row items-center justify-between gap-6 transition-colors">
            <div className="flex w-full sm:w-auto items-center gap-4">
              <button
                onClick={submitBlog}
                disabled={loading || !title.trim() || !content.trim()}
                className="flex-1 sm:flex-none font-mono text-[11px] font-bold tracking-[0.12em] uppercase rounded-[3px] transition-all duration-200 cursor-pointer bg-orange-500 text-white border-none px-8 py-2.5 hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? "PUBLISHING..." : "PUBLISH BLOG →"}
              </button>

              <button
                onClick={() => {
                  if (content || title) {
                    let r = window.confirm("Are you sure you want to exit the editor, all unsaved data will be lost.");
                    if (!r) return;
                  }
                 navigate("/blogs");
                }}
                className="flex-1 sm:flex-none font-mono text-[11px] font-semibold tracking-[0.06em] rounded-[3px] bg-transparent text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 px-6 py-2 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-red-500 hover:border-red-500 dark:hover:text-red-400 dark:hover:border-red-500/70 transition-colors uppercase text-center"
              >
                Cancel
              </button>
            </div>

            <div className="w-full sm:w-auto text-center sm:text-right">
              {!title.trim() || !content.trim() ? (
                <span className="inline-flex items-center justify-center sm:justify-end gap-2 text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 rounded-[3px] border border-amber-200 dark:border-amber-500/20 font-mono text-[10px] font-bold uppercase tracking-widest">
                  Title & content required
                </span>
              ) : (
                <span className="inline-flex items-center justify-center sm:justify-end gap-2 text-green-600 dark:text-emerald-400 bg-green-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-[3px] border border-green-200 dark:border-emerald-500/20 font-mono text-[10px] font-bold uppercase tracking-widest">
                  Ready to publish
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
