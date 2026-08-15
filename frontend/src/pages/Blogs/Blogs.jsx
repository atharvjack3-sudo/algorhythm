import { useEffect, useState } from "react";
import { api } from "../../api/client";
import BlogCard from "../../components/BlogCard";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Blogs() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    if (!user) navigate("/auth?error=sign_in_to_view_blogs");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    api.get("/blogs")
      .then(res => setBlogs(res.data))
      .catch(() => setBlogs([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-[#0a0a0f] flex items-center justify-center">
        <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tracking-[0.15em] animate-pulse uppercase">
          LOADING BLOGS...
        </span>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .font-sans { font-family: 'DM Sans', sans-serif; }
      `}</style>

      {/* Main Wrapper: Cooler slate background for light mode depth, deep custom hex for dark mode */}
      <div className="min-h-screen bg-slate-100 dark:bg-[#0a0a0f] text-slate-900 dark:text-slate-200 pb-16">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col gap-8">
          
          {/* --- Header --- */}
          <div className="flex flex-col gap-2">
            <h1 className="font-sans text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
              Blogs
            </h1>
            <p className="font-sans text-[14px] text-slate-600 dark:text-slate-400 tracking-[0.02em] mt-1">
              Learn from the community's insights, experiences, and breakthroughs.
            </p>
          </div>

          {/* --- Call to Action Card --- */}
          {/* Light Mode: pure white bg against slate-100, stronger border, subtle shadow. Dark mode: distinct elevation color */}
          <div className="bg-white dark:bg-[#12141c] border border-slate-300 dark:border-slate-800/70 rounded-md p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-md shadow-slate-200/50 dark:shadow-none">
            <div className="flex-1">
              <h2 className="font-sans text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Share Your Knowledge
              </h2>
              <p className="font-sans text-[14px] text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                Write blogs on algorithms, contest strategies, optimization techniques, or career lessons. Help the community grow and build your reputation.
              </p>
            </div>

            <Link
              to="/blogs/new"
              className="font-mono text-[11px] font-bold tracking-[0.12em] uppercase rounded-[3px] transition-all duration-200 cursor-pointer bg-orange-500 text-white border-none px-6 py-3 hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-500/20 flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              WRITE A BLOG →
            </Link>
          </div>

          {/* --- Blogs List --- */}
          <div className="flex flex-col gap-6">
            {blogs.length === 0 ? (
              <div className="px-4 py-16 text-center border border-slate-300 dark:border-slate-800/70 rounded-md bg-white dark:bg-[#12141c] shadow-sm flex flex-col items-center gap-4">
                <div className="font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  No blogs yet
                </div>
                <p className="font-sans text-[14px] text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                  The stage is yours. Be the first to share your coding insights and set the bar for the community!
                </p>
                <Link
                  to="/blogs/new"
                  className="font-mono text-[11px] font-bold tracking-[0.12em] rounded-[3px] transition-colors bg-slate-100 dark:bg-slate-800/50 text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700 px-6 py-2.5 hover:bg-slate-200 dark:hover:bg-slate-700 uppercase mt-4"
                >
                  CREATE YOUR FIRST BLOG
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {blogs.map(blog => (
                  <BlogCard key={blog.id} blog={blog} />
                ))}
              </div>
            )}
          </div>
          
        </div>
      </div>
    </>
  );
}