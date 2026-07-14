import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import { 
  ChevronLeft, 
  User, 
  Calendar, 
  MessageSquare, 
  Activity, 
  ArrowUp, 
  ArrowDown,
  MessageCircle, 
  Eye 
} from "lucide-react";

import "katex/dist/katex.min.css";

export default function DiscussionDetail() {
  const { problemId, discussionId } = useParams();
  const [discussion, setDiscussion] = useState(null);
  
  // Interactive Voting State
  const [votes, setVotes] = useState(0);
  const [userVote, setUserVote] = useState(0); // 1 for upvote, -1 for downvote, 0 for none
  
  const { user } = useAuth();

  useEffect(() => {
    api
      .get(`/problems/${problemId}/discussions/${discussionId}`)
      .then((res) => {
        setDiscussion(res.data);
        setVotes(Number(res.data.votes) || 0);
        // Note: If your backend eventually returns the current user's vote status, 
        // you would initialize setUserVote() here.
      })
      .catch(console.error);
  }, [discussionId, user, problemId]);

  const handleVote = async (type) => {
    if (!user) return alert("You must be logged in to vote.");

    const isUpvote = type === "upvote";
    const targetVote = isUpvote ? 1 : -1;

    // Prevent redundant requests if they already voted this way[cite: 7]
    if (userVote === targetVote) return; 

    // Optimistic Update calculations
    const previousVote = userVote;
    const previousVotesCount = votes;
    
    // Calculate the difference: 
    // e.g., switching from downvote (-1) to upvote (1) adds 2 to the total[cite: 7]
    const diff = targetVote - previousVote;

    setVotes((prev) => prev + diff);
    setUserVote(targetVote);

    try {
      await api.put(`/discussions/${discussionId}/${type}`);
    } catch (err) {
      console.error("VOTE ERROR:", err);
      // Revert optimistic update on failure
      setVotes(previousVotesCount);
      setUserVote(previousVote);
    }
  };

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

      <div className="relative min-h-[calc(100vh-56px)] w-full bg-slate-100 dark:bg-[#050608] text-slate-800 dark:text-slate-200 py-8 px-4 sm:px-6 font-sans transition-colors duration-300 overflow-hidden">
        
        {/* Subtle IDE Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,theme(colors.gray.400/20%)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.gray.400/20%)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,theme(colors.slate.900/50%)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.slate.900/50%)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0"></div>

        <div className="relative z-10 max-w-7xl mx-auto flex flex-col-reverse lg:flex-row gap-6 lg:gap-8">
          
          {/* ===== MAIN CONTENT (Markdown Body) ===== */}
          <main className="flex-1 min-w-0 flex flex-col">
            <div className="bg-white dark:bg-[#0d1117] rounded-[3px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col flex-1">
              
              {/* Header */}
              <div className="px-6 py-5 md:px-10 md:py-8 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare size={14} className="text-orange-500" />
                  <span className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Discussion Thread
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white leading-snug font-sans tracking-tight">
                  {discussion.title}
                </h1>
              </div>

              {/* Body */}
              <div className="p-6 md:p-10 flex-1">
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

                        return (
                          <div className="border border-slate-200 dark:border-slate-800 rounded-[3px] overflow-hidden my-6 bg-slate-50 dark:bg-[#050608] shadow-sm transition-colors">
                            <div className="px-4 py-2 bg-slate-200/50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center transition-colors">
                              <span className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                {lang}
                              </span>
                            </div>
                            <pre className="!m-0 !bg-transparent p-4 overflow-x-auto text-[13px] font-mono leading-relaxed text-slate-800 dark:text-slate-300 custom-scrollbar">
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
          </main>

          <aside className="w-full lg:w-72 flex-shrink-0 flex flex-col gap-6">
            
            <Link 
              to={`/problemset/${problemId}`}
              className="flex items-center justify-center gap-2 p-3 bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 hover:border-orange-500 dark:hover:border-orange-500 text-slate-600 dark:text-slate-300 hover:text-orange-600 dark:hover:text-orange-500 rounded-[3px] transition-colors shadow-sm font-mono text-[11px] font-bold uppercase tracking-widest group"
            >
              <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Back to Problem
            </Link>
            <div className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 rounded-[3px] shadow-sm flex flex-col overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-2">
                <Activity size={14} className="text-emerald-500" />
                <span className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Engagement
                </span>
              </div>
              <div className="p-5 flex flex-col gap-5">
                
                <div className="flex flex-col gap-3 pb-5 border-b border-slate-100 dark:border-slate-800/60">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-slate-600 dark:text-slate-400">Total Votes</span>
                    <span className="font-mono text-[15px] font-bold text-slate-900 dark:text-white">
                      {votes}
                    </span>
                  </div>
                  {!authLoading && user && 
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleVote('upvote')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-[3px] font-mono text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer ${
                        userVote === 1 
                          ? 'bg-orange-500 text-white border border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.2)]' 
                          : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-orange-500 hover:text-orange-500'
                      }`}
                    >
                      <ArrowUp size={14} strokeWidth={2.5} /> UPVOTE
                    </button>
                    <button 
                      onClick={() => handleVote('downvote')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-[3px] font-mono text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer ${
                        userVote === -1 
                          ? 'bg-blue-500 text-white border border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.2)]' 
                          : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:text-blue-500'
                      }`}
                    >
                      <ArrowDown size={14} strokeWidth={2.5} /> DOWN
                    </button>
                  </div>
                  }
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <MessageCircle size={14} className="text-blue-500" />
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-widest">Replies</span>
                  </div>
                  <span className="font-sans text-[13px] font-bold text-slate-900 dark:text-white">
                    {discussion.reply_count || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Eye size={14} className="text-emerald-500" />
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-widest">Views</span>
                  </div>
                  <span className="font-sans text-[13px] font-bold text-slate-900 dark:text-white">
                    {discussion.views || 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 rounded-[3px] shadow-sm flex flex-col overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-2">
                <User size={14} className="text-blue-500" />
                <span className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Author Details
                </span>
              </div>
              
              <div className="p-5 flex flex-col gap-5">
                <Link 
                  to={`/profile/${discussion.username}`} 
                  className="flex items-center gap-3 w-fit group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-[3px] bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-mono font-bold text-[14px] uppercase group-hover:border-orange-400 dark:group-hover:border-orange-500 group-hover:text-orange-500 transition-colors">
                    {discussion.username?.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-sans font-bold text-[15px] text-slate-900 dark:text-white leading-none mb-1.5 group-hover:text-orange-600 dark:group-hover:text-orange-500 transition-colors">
                      {discussion.username}
                    </span>
                    <span className="font-mono text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                      View Profile
                    </span>
                  </div>
                </Link>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Calendar size={12} />
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-widest">Posted On</span>
                  </div>
                  <span className="font-sans text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                    {discussion.created_at 
                      ? new Date(discussion.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
                      : "Unknown Date"}
                  </span>
                </div>
              </div>
            </div>
            
          </aside>
        </div>
      </div>
    </>
  );
}