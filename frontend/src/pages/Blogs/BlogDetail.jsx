import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import BlogComments from "../../components/BlogComments";
import MarkdownRenderer from "../../components/MarkdownRenderer";
import { 
  ChevronLeft, 
  FileText, 
  Heart, 
  MessageSquare, 
  Eye, 
  User, 
  Calendar 
} from "lucide-react";

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

      <div className="relative min-h-[calc(100vh-56px)] w-full bg-slate-100 dark:bg-gray-950 text-slate-800 dark:text-slate-200 py-8 px-4 sm:px-6 font-sans transition-colors duration-300 overflow-hidden">
        
        <div className="absolute inset-0 bg-[linear-gradient(to_right,theme(colors.gray.400/20%)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.gray.400/20%)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,theme(colors.slate.900/50%)_1px,transparent_1px),linear-gradient(to_bottom,theme(colors.slate.900/50%)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none z-0"></div>

        <div className="relative z-10 max-w-7xl mx-auto flex flex-col-reverse lg:flex-row gap-6 lg:gap-8">
          
          <main className="flex-1 min-w-0 flex flex-col gap-6">
            
            {/* Article Content */}
            <article className="bg-white dark:bg-[#0d1117] rounded-[3px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
              <div className="px-6 py-5 md:px-10 md:py-8 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2 mb-4">
                  <FileText size={14} className="text-blue-500" />
                  <span className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Blog
                  </span>
                </div>
                <h1 className="font-sans text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                  {blog.title}
                </h1>
              </div>

              <div className="p-6 md:p-10 font-sans text-[14px] leading-relaxed transition-colors cf-markdown">
                <MarkdownRenderer content={blog.content} />
              </div>
            </article>

            {/* Comments Section */}
            <div className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 rounded-[3px] shadow-sm flex flex-col overflow-hidden">
              <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-3">
                <MessageSquare size={16} className="text-orange-500" />
                <h2 className="font-sans text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Discussion
                </h2>
                <span className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
                  [{blog.comments_count}]
                </span>
              </div>
              
              <div className="p-6 md:p-10">
                <BlogComments blogId={blog.id} />
              </div>
            </div>

          </main>

          <aside className="w-full lg:w-72 flex-shrink-0 flex flex-col gap-6">
            
            <Link 
              to="/blogs" 
              className="flex items-center justify-center gap-2 p-3 bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-500 rounded-[3px] transition-colors shadow-sm font-mono text-[11px] font-bold uppercase tracking-widest group"
            >
              <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              BACK TO BLOGS
            </Link>

            <div className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 rounded-[3px] shadow-sm flex flex-col overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Engagement
                </span>
              </div>
              <div className="p-5 flex flex-col gap-5">
                
                <div className="flex flex-col gap-3 pb-5 border-b border-slate-100 dark:border-slate-800/60">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-slate-600 dark:text-slate-400">Total Likes</span>
                    <span className="font-mono text-[15px] font-bold text-slate-900 dark:text-white">
                      {blog.likes_count || 0}
                    </span>
                  </div>
                  
                  <button 
                    onClick={toggleLike}
                    className={`w-full flex items-center justify-center gap-2 py-2 rounded-[3px] font-mono text-[11px] font-bold uppercase tracking-widest transition-all cursor-pointer ${
                      liked 
                        ? "bg-red-500 text-white border border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]" 
                        : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-red-500 hover:text-red-500"
                    }`}
                  >
                    <Heart size={14} className={`${liked ? 'fill-current' : ''}`} strokeWidth={2.5} />
                    {liked ? 'LIKED' : 'LIKE ARTICLE'}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <MessageSquare size={14} className="text-orange-500" />
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-widest">Comments</span>
                  </div>
                  <span className="font-sans text-[13px] font-bold text-slate-900 dark:text-white">
                    {blog.comments_count || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Eye size={14} className="text-blue-500" />
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-widest">Views</span>
                  </div>
                  <span className="font-sans text-[13px] font-bold text-slate-900 dark:text-white">
                    {blog.views_count || 0}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 rounded-[3px] shadow-sm flex flex-col overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-2">
                <User size={14} className="text-orange-500" />
                <span className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Author Details
                </span>
              </div>
              
              <div className="p-5 flex flex-col gap-5">
                <div 
                  onClick={() => navigate(`/profile/${blog.author}`)}
                  className="flex items-center gap-3 w-fit group cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-[3px] bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center font-sans font-bold text-[15px] uppercase group-hover:border-blue-400 dark:group-hover:border-blue-500 group-hover:text-blue-500 transition-colors">
                    {blog.author?.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-sans font-bold text-[15px] text-slate-900 dark:text-white leading-none mb-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-500 transition-colors">
                      {blog.author}
                    </span>
                    <span className="font-mono text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                      View Profile
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Calendar size={12} />
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-widest">Published On</span>
                  </div>
                  <span className="font-sans text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                    {blog.created_at 
                      ? new Date(blog.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
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