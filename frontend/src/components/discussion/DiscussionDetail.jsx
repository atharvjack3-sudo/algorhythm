import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";

import "katex/dist/katex.min.css";
// NOTE: Removed static highlight.js css. We handle Light/Dark mode syntax natively via the <style> block below.

export default function DiscussionDetail() {
  const { problemId, discussionId } = useParams();
  const [discussion, setDiscussion] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    api
      .get(`/problems/${problemId}/discussions/${discussionId}`)
      .then((res) => setDiscussion(res.data))
      .catch(console.error);
  }, [discussionId, user]);

  // --- LOADING STATE (Matches IDE pulse) ---
  if (!discussion) {
    return (
      <div className="w-full min-h-[calc(100vh-56px)] flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors">
        <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tracking-[0.15em] animate-pulse uppercase">
          LOADING DISCUSSION...
        </span>
      </div>
    );
  }

  return (
    <>
      {/* Light & Dark mode syntax highlighting styles */}
      <style>{`
        .hljs { background: transparent !important; color: #24292e; }
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

      <div className="min-h-[calc(100vh-56px)] bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300 py-8 md:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          
          {/* Back Button */}
          <Link 
            to={`/problemset/${problemId}`}
            className="inline-flex items-center gap-2 font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-500 uppercase tracking-widest transition-colors mb-6 md:mb-8 group"
          >
            <svg className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            BACK TO PROBLEM
          </Link>

          {/* Discussion Content Card */}
          <div className="bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-800 p-6 md:p-10 shadow-sm transition-colors">
            
            {/* Header */}
            <div className="border-b border-slate-200 dark:border-slate-800 pb-6 mb-8">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-5 leading-snug font-sans">
                {discussion.title}
              </h1>

              {/* Reroutes to Author's Profile */}
              <Link 
                to={`/profile/${discussion.username}`} 
                className="flex items-center gap-3 w-fit group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-[3px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center font-mono font-bold text-[13px] uppercase group-hover:border-orange-400 dark:group-hover:border-orange-500 transition-colors">
                  {discussion.username?.charAt(0)}
                </div>
                <div className="flex flex-col">
                  <span className="font-sans font-bold text-[14px] text-slate-900 dark:text-white leading-none mb-1.5 group-hover:text-orange-600 dark:group-hover:text-orange-500 transition-colors">
                    {discussion.username}
                  </span>
                  <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 tracking-widest uppercase">
                    {discussion.created_at 
                      ? new Date(discussion.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                      : "AUTHOR"}
                  </span>
                </div>
              </Link>
            </div>

            {/* Markdown Body */}
            <div className="prose prose-slate dark:prose-invert max-w-none font-sans text-[14px] leading-relaxed prose-headings:font-sans prose-headings:tracking-tight prose-a:text-orange-600 dark:prose-a:text-orange-500 hover:prose-a:underline transition-colors [&_pre_code.hljs]:!bg-transparent [&_pre_code.hljs]:!p-0">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex, rehypeHighlight]}
                components={{
                  code({ inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "");
                    const lang = match ? match[1] : "CODE";

                    if (inline) {
                      return (
                        <code className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-1.5 py-0.5 rounded-[3px] font-mono text-[12.5px] border border-slate-200 dark:border-slate-700 before:content-[''] after:content-[''] transition-colors">
                          {children}
                        </code>
                      );
                    }

                    // Dynamically colored code block container (White/slate in light mode, dark void in dark mode)
                    return (
                      <div className="border border-slate-200 dark:border-slate-800 rounded-md overflow-hidden my-6 bg-slate-50 dark:bg-[#0d1117] shadow-sm transition-colors">
                        <div className="px-4 py-2 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center transition-colors">
                          <span className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            {lang}
                          </span>
                        </div>
                        <pre className="!m-0 !bg-transparent p-4 overflow-x-auto text-[13px] font-mono leading-relaxed text-slate-800 dark:text-slate-300">
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </pre>
                      </div>
                    );
                  },
                }}
              >
                {discussion.body}
              </ReactMarkdown>
            </div>
            
          </div>
        </div>
      </div>
    </>
  );
}