import { useEffect, useState } from "react";
import { api } from "../../api/client";
import BlogCard from "../../components/BlogCard";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Blogs() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return;
    if (!user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    api.get("/blogs")
      .then(res => setBlogs(res.data))
      .catch(() => setBlogs([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
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

      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 pb-16">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col gap-8">
          
          {/* --- Header --- */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <span className="inline-block w-[3px] h-[14px] rounded-sm bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              <span className="font-mono text-[11px] font-semibold tracking-[0.12em] text-slate-500 dark:text-slate-400 uppercase">
                Community
              </span>
            </div>
            <h1 className="font-sans text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
              Blogs
            </h1>
            <p className="font-sans text-[13px] text-slate-500 dark:text-slate-400 tracking-[0.05em] mt-1">
              Learn from the community's insights, experiences, and breakthroughs.
            </p>
          </div>

          {/* --- Write Blog CTA Banner --- */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
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
              className="font-mono text-[11px] font-bold tracking-[0.12em] uppercase rounded-[3px] transition-opacity duration-150 cursor-pointer bg-blue-600 text-white border-none px-6 py-2.5 hover:opacity-85 flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              WRITE A BLOG →
            </Link>
          </div>

          {/* --- Blogs List --- */}
          <div className="flex flex-col gap-6">
            {blogs.length === 0 ? (
              <div className="px-4 py-16 text-center border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-900 shadow-sm flex flex-col items-center gap-4">
                <div className="font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  No blogs yet
                </div>
                <p className="font-sans text-[13px] text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
                  The stage is yours. Be the first to share your coding insights and set the bar for the community!
                </p>
                <Link
                  to="/blogs/new"
                  className="font-mono text-[11px] font-bold tracking-[0.12em] rounded-[3px] transition-colors bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 px-6 py-2 hover:bg-slate-200 dark:hover:bg-slate-700 uppercase mt-2"
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