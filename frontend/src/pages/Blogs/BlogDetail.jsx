import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import BlogComments from "../../components/BlogComments";
import MarkdownRenderer from "../../components/MarkdownRenderer";

export default function BlogDetail() {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [liked, setLiked] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    api.get(`/blogs/${slug}`).then((res) => {
      setBlog(res.data);
      api.post(`/blogs/${res.data.id}/view`).catch(() => {});
    });
  }, [slug]);

  if (!blog) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center transition-colors duration-200">
        <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tracking-[0.15em] animate-pulse uppercase">
          LOADING BLOG...
        </span>
      </div>
    );
  }

  const toggleLike = async () => {
    const res = await api.post(`/blogs/${blog.id}/like`);
    const wasLiked = res.data.liked;
    setLiked(wasLiked);
    setBlog((prev) => ({
      ...prev,
      likes_count: prev.likes_count + (wasLiked ? 1 : -1),
    }));
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .font-sans { font-family: 'DM Sans', sans-serif; }
        
        /* Markdown Overrides to match the standard theme */
        .cf-markdown p { margin-bottom: 1rem; line-height: 1.6; }
        .cf-markdown code { font-family: 'JetBrains Mono', monospace; font-size: 0.9em; padding: 0.15rem 0.3rem; background: var(--code-bg); border-radius: 0.25rem; }
        .cf-markdown pre { background: var(--pre-bg); padding: 1rem; border-radius: 0.375rem; overflow-x: auto; font-family: 'JetBrains Mono', monospace; font-size: 0.85em; border: 1px solid var(--border-color); }
        .cf-markdown pre code { background: transparent; padding: 0; }
        .cf-markdown ul, .cf-markdown ol { padding-left: 1.5rem; margin-bottom: 1rem; }
        .cf-markdown li { margin-bottom: 0.25rem; }
        .cf-markdown h1, .cf-markdown h2, .cf-markdown h3 { font-family: 'DM Sans', sans-serif; font-weight: 700; tracking: -0.02em; margin-top: 2rem; margin-bottom: 1rem; }
        
        :root { --code-bg: #f1f5f9; --pre-bg: #f8fafc; --border-color: #e2e8f0; }
        .dark { --code-bg: rgba(30, 41, 59, 0.5); --pre-bg: #0f172a; --border-color: #1e293b; }
      `}</style>

      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 pb-16 transition-colors duration-200">
        <div className="max-w-4xl mx-auto px-6 py-10 flex flex-col gap-6">
          
          {/* Back Button */}
          <Link 
            to="/blogs" 
            className="font-mono text-[11px] font-semibold tracking-[0.06em] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors uppercase self-start mb-2 flex items-center gap-2"
          >
            ← BACK TO BLOGS
          </Link>

          {/* Blog Header Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-8 shadow-sm transition-colors">
            
            <div className="flex items-center gap-2.5 mb-4">
              <span className="inline-block w-[3px] h-[14px] rounded-sm bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              <span className="font-mono text-[11px] font-semibold tracking-[0.12em] text-slate-500 dark:text-slate-400 uppercase">
                Article
              </span>
            </div>

            <h1 className="font-sans text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight mb-6">
              {blog.title}
            </h1>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
              
              {/* Author Info */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[3px] flex items-center justify-center font-sans text-base font-bold text-white shadow-sm border border-black/10 dark:border-white/10 bg-orange-500 dark:bg-orange-500">
                  {blog.author.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span onClick={() => navigate(`/profile/${blog.author}`)} className="font-sans cursor-pointer text-[14px] font-bold text-slate-900 dark:text-white leading-tight">
                    {blog.author}
                  </span>
                  <span className="font-mono text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">
                    Author
                  </span>
                </div>
              </div>
              
              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-4 text-slate-600 dark:text-slate-400 font-mono text-[10px] font-semibold uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>
                    {new Date(blog.created_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </span>
                </div>
                
                <span className="hidden md:inline text-slate-300 dark:text-slate-700">|</span>
                
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>{blog.views_count} VIEWS</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-6">
              <button 
                onClick={toggleLike}
                className={`flex items-center gap-2 font-mono text-[11px] font-bold tracking-[0.1em] rounded-[3px] transition-colors duration-150 border px-4 py-2 uppercase ${
                  liked 
                    ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-500 border-red-200 dark:border-red-800/30" 
                    : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                <svg className={`w-3.5 h-3.5 transition-transform ${liked ? 'fill-current scale-110' : ''}`} fill={liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>{blog.likes_count}</span>
              </button>

              <div className="flex items-center gap-2 font-sans text-[11px] font-semibold rounded-[3px] bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-4 py-2 select-none">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>{blog.comments_count} Comments</span>
              </div>
              
              <div className="flex-1"></div>

              {/* Extras (Share/Bookmark placeholders)
              <button className="p-2 font-mono text-[11px] font-bold rounded-[3px] bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
              <button className="p-2 font-mono text-[11px] font-bold rounded-[3px] bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button> */}
            </div>
          </div>

          {/* Blog Content */}
          <article className="bg-white dark:bg-slate-900 border font-sans border-slate-200 dark:border-slate-800 rounded-md p-8 shadow-sm transition-colors cf-markdown">
            <MarkdownRenderer content={blog.content} />
          </article>

          {/* Comments Section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-8 shadow-sm transition-colors mt-4">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h2 className="font-sans text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Discussion
              </h2>
              <span className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
                [{blog.comments_count}]
              </span>
            </div>
            
            <BlogComments blogId={blog.id} />
          </div>

        </div>
      </div>
    </>
  );
}