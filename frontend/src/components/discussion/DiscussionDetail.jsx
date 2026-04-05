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
import "highlight.js/styles/github-dark.css"; // code theme

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

  if (!discussion) {
    return (
      <div className="w-full min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-[#f8f9fa] dark:bg-[#0a0c10] transition-colors duration-300">
        <div className="relative w-12 h-12 flex items-center justify-center mb-4">
          <div className="absolute inset-0 rounded-full border-[3px] border-slate-200 dark:border-slate-800"></div>
          <div className="absolute inset-0 rounded-full border-[3px] border-blue-600 dark:border-blue-500 border-t-transparent border-r-transparent animate-[spin_0.8s_linear_infinite]"></div>
          <div className="absolute inset-0 rounded-full bg-blue-500/10 dark:bg-blue-500/20 blur-md"></div>
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Loading discussion...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f8f9fa] dark:bg-[#0a0c10] font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300 py-8 md:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Back Button */}
        <Link 
          to={`/problemset/${problemId}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-6 md:mb-8 group"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Problem
        </Link>

        {/* Discussion Content Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-10 shadow-sm transition-colors">
          
          {/* Header */}
          <div className="border-b border-slate-200 dark:border-slate-800 pb-6 mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-6 leading-tight">
              {discussion.title}
            </h1>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                {discussion.username?.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-[15px] text-slate-900 dark:text-white leading-none mb-1">
                  {discussion.username}
                </span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {discussion.created_at 
                    ? new Date(discussion.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                    : "Author"}
                </span>
              </div>
            </div>
          </div>

          {/* Markdown Body */}
          <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:tracking-tight prose-a:text-blue-600 dark:prose-a:text-blue-400 hover:prose-a:text-blue-500 transition-colors">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex, rehypeHighlight]}
              components={{
                code({ inline, className, children, ...props }) {
                  if (inline) {
                    return (
                      <code className="bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-md font-mono text-[13px] before:content-[''] after:content-[''] transition-colors">
                        {children}
                      </code>
                    );
                  }

                  return (
                    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm !my-6">
                      {/* Optional mac-style window controls for code blocks */}
                      <div className="bg-slate-100 dark:bg-slate-950/50 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-400/80"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80"></div>
                      </div>
                      <pre className="!m-0 !rounded-none overflow-x-auto text-[13.5px]">
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
  );
}