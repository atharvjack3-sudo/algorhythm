import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

export default function MyBlogs() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    api.get("/blogs/mine")
      .then(res => setBlogs(res.data))
      .catch(() => setBlogs([]))
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  const deleteBlog = async (id) => {
    if (!window.confirm("Delete this blog? This cannot be undone.")) return;

    try {
      setDeleteLoading(id);
      await api.delete(`/blogs/${id}`);
      setBlogs(prev => prev.filter(b => b.id !== id));
    } catch {
      alert("Failed to delete blog");
    } finally {
      setDeleteLoading(null);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center transition-colors duration-200">
        <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tracking-[0.15em] animate-pulse uppercase">
          LOADING CONTENT...
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

      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 pb-16 transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col gap-8">
          
          {/* --- Header --- */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2.5">
                <span className="inline-block w-[3px] h-[14px] rounded-sm bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                <span className="font-mono text-[11px] font-semibold tracking-[0.12em] text-slate-500 dark:text-slate-400 uppercase">
                  Dashboard
                </span>
              </div>
              <h1 className="font-sans text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                My Blogs
              </h1>
              <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-[0.05em] mt-1">
                Manage and track your published content
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <button 
                onClick={() => navigate("/blogs")} 
                className="flex-1 md:flex-none font-mono text-[11px] font-semibold tracking-[0.06em] rounded-[3px] bg-transparent text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 px-6 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors uppercase text-center flex items-center justify-center gap-2"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                ALL BLOGS
              </button>
              <Link 
                to="/blogs/new"
                className="flex-1 md:flex-none font-mono text-[11px] font-bold tracking-[0.12em] uppercase rounded-[3px] transition-opacity duration-150 cursor-pointer bg-orange-500 text-white border-none px-6 py-2.5 hover:opacity-85 flex items-center justify-center gap-2"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                WRITE NEW BLOG →
              </Link>
            </div>
          </div>

          {/* --- Stats Cards --- */}
          {blogs.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-5 flex flex-col gap-2 shadow-sm">
                <div className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Total Blogs
                </div>
                <div className="font-mono text-2xl font-bold text-slate-900 dark:text-white">
                  {blogs.length}
                </div>
              </div>
              
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-5 flex flex-col gap-2 shadow-sm">
                <div className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Total Views
                </div>
                <div className="font-mono text-2xl font-bold text-slate-900 dark:text-white">
                  {blogs.reduce((sum, b) => sum + b.views_count, 0)}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-5 flex flex-col gap-2 shadow-sm">
                <div className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Total Likes
                </div>
                <div className="font-mono text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {blogs.reduce((sum, b) => sum + b.likes_count, 0)}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-5 flex flex-col gap-2 shadow-sm">
                <div className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  Comments
                </div>
                <div className="font-mono text-2xl font-bold text-slate-900 dark:text-white">
                  {blogs.reduce((sum, b) => sum + b.comments_count, 0)}
                </div>
              </div>
            </div>
          )}

          {/* --- Content Area --- */}
          {blogs.length === 0 ? (
            <div className="px-4 py-16 text-center border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-900 shadow-sm flex flex-col items-center gap-4">
              <div className="font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                No blogs yet
              </div>
              <p className="font-sans text-[13px] text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
                Start sharing your knowledge and insights with the community.
              </p>
              <Link
                to="/blogs/new"
                className="font-mono text-[11px] font-bold tracking-[0.12em] rounded-[3px] transition-colors bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 px-6 py-2 hover:bg-slate-200 dark:hover:bg-slate-700 uppercase mt-2"
              >
                WRITE YOUR FIRST BLOG
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {blogs.map(blog => (
                <div
                  key={blog.id}
                  onClick={() => navigate(`/blogs/${blog.slug}`)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-sm hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer group flex flex-col md:flex-row overflow-hidden"
                >
                  {/* Info Section */}
                  <div className="p-6 flex-1 flex flex-col gap-4">
                    <h2 className="font-sans text-xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                      {blog.title}
                    </h2>
                    
                    <div className="flex flex-wrap items-center gap-4 mt-auto pt-2">
                      <div className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        {new Date(blog.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                      <div className="hidden sm:block w-[1px] h-3 bg-slate-200 dark:bg-slate-700"></div>
                      <div className="flex items-center gap-4 font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1.5 group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                          {blog.likes_count || 0}
                        </span>
                        <span className="flex items-center gap-1.5 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                          {blog.comments_count || 0}
                        </span>
                        <span className="flex items-center gap-1.5 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          {blog.views_count || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Section */}
                  <div 
                    onClick={(e) => e.stopPropagation()} 
                    className="bg-slate-50 dark:bg-slate-950/50 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 p-4 flex flex-row md:flex-col justify-end md:justify-center gap-3 shrink-0"
                  >
                    <Link
                      to={`/blogs/${blog.slug}/edit`}
                      className="flex-1 md:flex-none font-mono text-[10px] font-bold tracking-[0.1em] text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-900/20 px-4 py-2 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors uppercase flex items-center justify-center gap-2 rounded-[3px]"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      EDIT
                    </Link>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteBlog(blog.id);
                      }}
                      disabled={deleteLoading === blog.id}
                      className="flex-1 md:flex-none font-mono text-[10px] font-bold tracking-[0.1em] text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-4 py-2 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors uppercase flex items-center justify-center gap-2 rounded-[3px] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deleteLoading === blog.id ? (
                        "..."
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          DELETE
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}