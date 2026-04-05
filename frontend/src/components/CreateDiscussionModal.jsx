import { X, Code, Bold } from "lucide-react";
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
}) {
  if (!open) return null;

  const insertCodeBlock = () => {
    setBody(body + "\n```cpp\n// your code here\n```\n");
  };

  return createPortal(
    // Added explicit text-slate-900 dark:text-slate-100 to force color inheritance in the portal
    <div className="fixed inset-0 z-[9999] bg-slate-900/40 dark:bg-black/60 flex items-center justify-center backdrop-blur-sm p-4 transition-colors text-slate-900 dark:text-slate-100">
      <div className="w-full max-w-6xl h-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 transition-colors">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 transition-colors">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Create Discussion</h2>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Title */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Discussion title..."
            className="w-full text-xl font-bold bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none"
          />
        </div>

        {/* Editor & Preview Area */}
        <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
          
          {/* Left Editor */}
          <div className="w-full md:w-1/2 flex flex-col bg-white dark:bg-slate-900 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 transition-colors">
            
            {/* Toolbar */}
            <div className="flex gap-2 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 transition-colors">
              <button
                onClick={() => setBody(body + "**bold**")}
                className="text-[13px] font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors active:scale-95"
              >
                <Bold className="w-4 h-4" /> Bold
              </button>
              <button
                onClick={insertCodeBlock}
                className="text-[13px] font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors active:scale-95"
              >
                <Code className="w-4 h-4" /> Code
              </button>
            </div>

            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="flex-1 p-6 resize-none outline-none font-mono text-[14px] bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 custom-scrollbar transition-colors"
              placeholder="Write your discussion (Markdown supported)..."
            />
          </div>

          {/* Right Preview */}
          {/* Added text-slate-800 dark:text-slate-200 to explicitly force text color on non-prose elements */}
          <div className="w-full md:w-1/2 p-6 overflow-y-auto bg-slate-50 dark:bg-[#1e1e1e] text-slate-800 dark:text-slate-200 prose prose-slate dark:prose-invert max-w-none custom-scrollbar transition-colors">
            {body.trim() ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  code({ inline, className, children }) {
                    const match = /language-(\w+)/.exec(className || "");
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={oneDark}
                        language={match[1]}
                        PreTag="div"
                        className="rounded-xl !my-4 shadow-md"
                      >
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter>
                    ) : (
                      <code className="bg-slate-200 dark:bg-slate-800 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-md font-mono text-[13px] before:content-[''] after:content-['']">
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {body}
              </ReactMarkdown>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 italic select-none">
                <svg className="w-12 h-12 mb-4 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Live preview will appear here
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end gap-3 transition-colors">
          <button 
            onClick={onClose} 
            className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-95 shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="px-6 py-2.5 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-600/20 transition-all active:scale-95 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Post Discussion
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}