import { useEffect, useState } from "react";
import { api } from "../../api/client";
import BlogCard from "../../components/BlogCard";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Blogs() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user,loading : authLoading } = useAuth();
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

if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0a0c10] flex flex-col items-center justify-center transition-colors duration-300">
        <div className="flex flex-col items-center gap-5">
          
          <div className="relative w-12 h-12 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-[3px] border-slate-200 dark:border-slate-400"></div>
            <div className="absolute inset-0 rounded-full border-[3px] border-blue-600 dark:border-blue-500 border-t-transparent border-r-transparent animate-[spin_0.8s_linear_infinite]"></div>
            <div className="absolute inset-0 rounded-full bg-blue-500/10 dark:bg-blue-500/20 blur-md"></div>
          </div>

          <div className="text-center">
            <h3 className="text-slate-900 dark:text-white font-semibold tracking-tight">
              Loading Blogs
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 animate-pulse">
              Fetching the latest insights...
            </p>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0a0c10] font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-6 py-12">
        
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">Blogs</h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg md:text-xl">Learn from the community's insights, experiences, and breakthroughs.</p>
        </div>

        {/* Write Blog CTA Banner */}
        <div className="mb-12 bg-slate-900 dark:bg-slate-800 rounded-3xl p-8 md:p-10 text-white shadow-xl dark:shadow-none border border-transparent dark:border-slate-700 relative overflow-hidden group">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl -ml-16 -mb-16 pointer-events-none group-hover:scale-110 transition-transform duration-700"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/5 shadow-inner">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Share Your Knowledge</h2>
              </div>
              <p className="text-slate-300 text-[15px] md:text-base leading-relaxed max-w-2xl">
                Write blogs on algorithms, contest strategies, optimization techniques, or career lessons. Help the community grow and build your reputation.
              </p>
            </div>

            <Link
              to="/blogs/new"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg shadow-blue-600/30 hover:shadow-blue-600/40 active:scale-95 whitespace-nowrap"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Write a Blog
            </Link>
          </div>
        </div>

        {/* Blogs List */}
        <div className="space-y-6">
          {blogs.length === 0 ? (
            <div className="text-center py-24 bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 transition-colors">
              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full mx-auto mb-6 flex items-center justify-center border border-slate-100 dark:border-slate-700">
                <svg className="w-10 h-10 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">No blogs yet</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto">The stage is yours. Be the first to share your coding insights and set the bar for the community!</p>
              <Link
                to="/blogs/new"
                className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-xl font-bold transition-all active:scale-95 shadow-md shadow-blue-600/20"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Create Your First Blog
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
  );
}