import { useState } from "react";
import {
  X,
  Code,
  Bold,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Terminal,
  Eye,
  Edit3
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { createPortal } from "react-dom";

export default function CreateDiscussionModal({
  open,
  onClose,
  title,
  setTitle,
  body,
  setBody,
  onSubmit,
  isSubmitting,
}) {
  const [showPreview, setShowPreview] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 768,
  );

  if (!open) return null;

  const isValid = title.trim().length > 0 && body.trim().length > 0;

  const insertCodeBlock = () => {
    setBody(body + "\n```cpp\n// your code here\n```\n");
  };

  const previewContent = body.trim() ? (
    <div className="prose prose-slate dark:prose-invert max-w-none font-sans text-[14px] leading-relaxed prose-headings:font-sans prose-headings:tracking-tight prose-a:text-orange-600 dark:prose-a:text-orange-400 [&_:not(pre)>code]:font-mono [&_:not(pre)>code]:text-[13px] [&_:not(pre)>code]:bg-slate-100 dark:[&_:not(pre)>code]:bg-slate-800 [&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:rounded-[3px] prose-pre:p-0 prose-pre:bg-transparent prose-pre:border-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code({ inline, className, children }) {
            const match = /language-(\w+)/.exec(className || "");
            return !inline && match ? (
              <div className="border border-slate-200 dark:border-slate-800 rounded-[3px] overflow-hidden my-4 bg-[#282c34]">
                <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 font-mono text-[10px] text-slate-500  tracking-wide">
                  {match[1]}
                </div>
                <SyntaxHighlighter
                  style={oneDark}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{
                    margin: 0,
                    padding: "1rem",
                    background: "transparent",
                    fontSize: "13px",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code className={className}>{children}</code>
            );
          },
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  ) : (
    <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 font-semibold font-sans text-[13px]">
      Markdown preview will appear here.
    </div>
  );

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-900/80 dark:bg-black/80 flex items-center justify-center backdrop-blur-sm p-4 transition-colors">
      <div className="w-full max-w-5xl h-[90vh] bg-white dark:bg-[#0d1117] rounded-[3px] shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 transition-colors">
        
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#161b22] transition-colors flex-shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="font-mono text-[11px] font-bold text-slate-700 uppercase dark:text-slate-300  tracking-[0.15em] flex items-center gap-2">
              <Terminal size={14} className="text-orange-500" /> Create Discussion Thread
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="font-sans text-[11px] font-bold  text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer bg-transparent border-none p-1 disabled:opacity-50 tracking-wider flex items-center gap-1"
          >
            <X size={14} /> Close
          </button>
        </div>

        {/* Title Input Area */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1117] transition-colors flex-shrink-0">
          <label className="block font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-wide  mb-1.5">
            Discussion Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="E.g., Optimized O(N log N) Dynamic Programming approach"
            disabled={isSubmitting}
            className="w-full bg-slate-50 dark:bg-[#050608] border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white rounded-[3px] px-3 py-2.5 text-[14px] font-sans outline-none focus:border-orange-500 dark:focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 disabled:opacity-50"
          />
        </div>

        {/* Desktop Split Layout */}
        <div className="flex flex-1 overflow-hidden relative">
          <div className="hidden md:flex w-full h-full divide-x divide-slate-200 dark:divide-slate-800">
            
            {/* Editor Workspace */}
            <div className={`flex flex-col bg-slate-50 dark:bg-[#0a0c10] transition-all duration-300 ${showPreview ? "w-1/2" : "w-full"}`}>
              <div className="flex justify-between items-center px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-[#161b22]/50 transition-colors flex-shrink-0">
                <div className="flex gap-2">
                  <button
                    onClick={() => setBody(body + "**bold**")}
                    disabled={isSubmitting}
                    className="font-sans text-[11px] font-bold  tracking-wider flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-[#0d1117] cursor-pointer"
                  >
                    <Bold className="w-3 h-3 text-orange-500" /> Bold
                  </button>
                  <button
                    onClick={insertCodeBlock}
                    disabled={isSubmitting}
                    className="font-sans text-[11px] font-bold  tracking-wider flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-[#0d1117] cursor-pointer"
                  >
                    <Code className="w-3 h-3 text-blue-500" /> Code Block
                  </button>
                  <button
                    onClick={() => setBody(body + " $x = 2$ ")}
                    disabled={isSubmitting}
                    className="font-sans text-[11px] font-bold  tracking-wider flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-[#0d1117] cursor-pointer text-emerald-600 dark:text-emerald-500 font-mono"
                  >
                    $ Math
                  </button>
                </div>

                <button
                  onClick={() => setShowPreview(!showPreview)}
                  disabled={isSubmitting}
                  className="font-sans text-[11px] font-bold  tracking-wider flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-[#0d1117] cursor-pointer"
                >
                  {showPreview ? (
                    <>
                      Hide Pane <ChevronRight className="w-3 h-3" />
                    </>
                  ) : (
                    <>
                      <ChevronLeft className="w-3 h-3" /> Show Preview
                    </>
                  )}
                </button>
              </div>

              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                disabled={isSubmitting}
                className="flex-1 w-full p-5 resize-none outline-none font-sans tracking-wide text-[13px] leading-relaxed bg-transparent text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 custom-scrollbar disabled:opacity-50"
                placeholder="Compose content (Markdown and LaTeX supported)..."
              />
            </div>

            {/* Split Preview */}
            <div className={`flex-col bg-white dark:bg-[#0d1117] transition-colors ${showPreview ? "flex w-1/2" : "hidden"}`}>
              <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#161b22]/30 flex-shrink-0 flex items-center gap-1.5">
                <Eye size={12} className="text-orange-500" />
                <span className="font-sans text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider ">
                  Render Preview
                </span>
              </div>
              <div className="flex-1 p-5 overflow-y-auto custom-scrollbar bg-white dark:bg-[#0d1117]">
                {previewContent}
              </div>
            </div>
          </div>

          {/* Mobile Display Viewport Toggle */}
          <div className="flex md:hidden w-full h-full flex-col bg-slate-50 dark:bg-[#0d1117]">
            <div className="flex overflow-x-auto custom-scrollbar justify-between items-center px-4 py-2 gap-2 border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 transition-colors flex-shrink-0">
              {!showPreview ? (
                <>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => setBody(body + "**bold**")}
                      disabled={isSubmitting}
                      className="font-sans text-[10px] font-bold  tracking-wider flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-[#0d1117]"
                    >
                      <Bold className="w-3 h-3 text-orange-500" /> Bold
                    </button>
                    <button
                      onClick={insertCodeBlock}
                      disabled={isSubmitting}
                      className="font-sans text-[10px] font-bold  tracking-wider flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-[#0d1117]"
                    >
                      <Code className="w-3 h-3 text-blue-500" /> Code
                    </button>
                    <button
                      onClick={() => setBody(body + " $x = 2$ ")}
                      disabled={isSubmitting}
                      className="font-sans text-[10px] font-bold  tracking-wider flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-[#0d1117] font-mono text-emerald-500"
                    >
                      $ Math
                    </button>
                  </div>
                  <button
                    onClick={() => setShowPreview(true)}
                    disabled={isSubmitting}
                    className="font-sans text-[10px] font-bold  tracking-wider flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-[#0d1117] flex-shrink-0"
                  >
                    Preview <ChevronRight className="w-3 h-3" />
                  </button>
                </>
              ) : (
                <>
                  <span className="font-sans text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-wider flex-shrink-0  flex items-center gap-1.5">
                    <Eye size={12} className="text-orange-500" /> Render Preview
                  </span>
                  <button
                    onClick={() => setShowPreview(false)}
                    disabled={isSubmitting}
                    className="font-sans text-[10px] font-bold  tracking-wider flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-[#0d1117] flex-shrink-0"
                  >
                    <ChevronLeft className="w-3 h-3" /> Edit Mode
                  </button>
                </>
              )}
            </div>

            {!showPreview ? (
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                disabled={isSubmitting}
                className="flex-1 w-full p-4 resize-none outline-none font-sans tracking-wide text-[13px] leading-relaxed bg-transparent text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 custom-scrollbar disabled:opacity-50"
                placeholder="Compose content thread (Markdown and LaTeX supported)..."
              />
            ) : (
              <div className="flex-1 w-full p-4 overflow-y-auto bg-white dark:bg-[#0d1117] custom-scrollbar">
                {previewContent}
              </div>
            )}
          </div>
        </div>

        {/* Modal Controls Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#161b22] flex justify-end items-center gap-3 transition-colors flex-shrink-0">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2 text-[12px] cursor-pointer font-sans font-bold  tracking-wider text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={onSubmit}
            disabled={!isValid || isSubmitting}
            className="flex items-center justify-center cursor-pointer gap-2 px-6 py-2 bg-orange-500 text-white border border-orange-500 rounded-[3px] text-[12px] font-sans font-bold tracking-wider  hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm min-w-[160px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Publishing...
              </>
            ) : (
              "Publish Post"
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}