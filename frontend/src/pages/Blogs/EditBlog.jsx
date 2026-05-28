import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/client";
import { useAuth } from "../../context/AuthContext";
import MarkdownRenderer from "../../components/MarkdownRenderer";

export default function EditBlog() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [blogId, setBlogId] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mode, setMode] = useState("write"); // write | preview
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    api.get(`/blogs/${slug}`)
      .then(res => {
        const blog = res.data;

        // author-only guard
        if (blog.author_id !== user.id) {
          alert("You are not allowed to edit this blog");
          navigate("/blogs");
          return;
        }

        setBlogId(blog.id);
        setTitle(blog.title);
        setContent(blog.content);
      })
      .catch(() => {
        alert("Blog not found");
        navigate("/blogs");
      })
      .finally(() => setLoading(false));
  }, [slug, user, navigate]);

  const updateBlog = async () => {
    if (!title.trim() || !content.trim()) {
      alert("Title and content are required");
      return;
    }

    try {
      setUpdating(true);
      await api.put(`/blogs/${blogId}`, { title, content });
      navigate(`/blogs/${slug}`);
    } catch {
      alert("Failed to update blog");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center transition-colors duration-200">
        <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tracking-[0.15em] animate-pulse uppercase">
          LOADING EDITOR...
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
        
        /* Markdown Overrides */
        .cf-markdown p { margin-bottom: 1rem; line-height: 1.6; word-wrap: break-word; overflow-wrap: break-word; }
        .cf-markdown code { font-family: 'JetBrains Mono', monospace; font-size: 0.9em; padding: 0.15rem 0.3rem; background: var(--code-bg); border-radius: 0.25rem; }
        .cf-markdown pre { background: var(--pre-bg); padding: 1rem; border-radius: 0.375rem; overflow-x: auto; font-family: 'JetBrains Mono', monospace; font-size: 0.85em; border: 1px solid var(--border-color); }
        .cf-markdown pre code { background: transparent; padding: 0; white-space: pre-wrap; word-break: break-all; }
        .cf-markdown ul, .cf-markdown ol { padding-left: 1.5rem; margin-bottom: 1rem; }
        .cf-markdown li { margin-bottom: 0.25rem; }
        .cf-markdown h1, .cf-markdown h2, .cf-markdown h3 { font-family: 'DM Sans', sans-serif; font-weight: 700; letter-spacing: -0.02em; margin-top: 2rem; margin-bottom: 1rem; }
        
        :root { --code-bg: #f1f5f9; --pre-bg: #f8fafc; --border-color: #e2e8f0; }
        .dark { --code-bg: rgba(30, 41, 59, 0.5); --pre-bg: #0f172a; --border-color: #1e293b; }
      `}</style>

      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 pb-16 transition-colors duration-200">
        <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col gap-8">
          
          {/* Header */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <span className="inline-block w-[3px] h-[14px] rounded-sm bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              <span className="font-mono text-[11px] font-semibold tracking-[0.12em] text-slate-500 dark:text-slate-400 uppercase">
                Editor
              </span>
            </div>
            <h1 className="font-sans text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
              Edit Blog
            </h1>
            <p className="font-sans font-semibold text-[12px] text-slate-500 dark:text-slate-400 tracking-wide mt-1">
              Update your published content and refine your insights
            </p>
          </div>

          {/* Title Input (Disabled) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-6 shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
            <label className="block font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
              Blog Title
            </label>
            <input
              className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-950/50 border border-slate-300 dark:border-slate-800 rounded-[3px] font-sans text-lg font-bold text-slate-500 dark:text-slate-500 cursor-not-allowed transition-colors"
              value={title}
              disabled={true}
              onChange={e => setTitle(e.target.value)}
            />
            <div className="mt-2.5 font-mono text-[9px] font-bold tracking-widest uppercase text-amber-600 dark:text-amber-500 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Title cannot be changed after publication
            </div>
          </div>

          {/* Editor Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)] flex flex-col overflow-hidden">
            
            {/* Tabs */}
            <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 pt-6 sm:pt-0">
              <div className="flex gap-4">
                <button
                  onClick={() => setMode("write")}
                  className={`py-3 font-mono text-[11px] font-semibold tracking-[0.08em] uppercase transition-all duration-200 border-b-[3px] relative top-[1px] bg-transparent flex items-center gap-2 ${
                    mode === "write" 
                      ? "text-blue-600 dark:text-blue-500 border-blue-600 dark:border-blue-500" 
                      : "text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Write
                </button>
                <button
                  onClick={() => setMode("preview")}
                  className={`py-3 font-mono text-[11px] font-semibold tracking-[0.08em] uppercase transition-all duration-200 border-b-[3px] relative top-[1px] bg-transparent flex items-center gap-2 ${
                    mode === "preview" 
                      ? "text-blue-600 dark:text-blue-500 border-blue-600 dark:border-blue-500" 
                      : "text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Preview
                </button>
              </div>
              <p className="font-mono text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-widest pb-3 sm:pb-0">
                {mode === "write" ? "Markdown & LaTeX supported" : "Live Render"}
              </p>
            </div>

            {/* Editor / Preview Content */}
            {mode === "write" ? (
              <div className="p-6 flex flex-col h-full">
                <textarea
                  className="w-full px-4 py-4 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-[3px] font-sans tracking-wide text-[13px] leading-relaxed text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors resize-y min-h-[400px] break-words whitespace-pre-wrap"
                  placeholder={`Write your content using Markdown...\n\nExamples:\n# Heading\n**bold** *italic*\n- List item\n\`\`\`code\`\`\`\n$$LaTeX$$`}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  rows="18"
                />
                <div className="flex justify-between items-center mt-4">
                  <p className="font-mono text-[10px] font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-widest">
                    {content.length > 0 ? `${content.length} chars • ${content.split(/\s+/).filter(w => w).length} words` : "0 words"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-8 md:p-10 min-h-[450px]">
                {content.trim() ? (
                  <div className="font-sans text-[15px] text-slate-800 dark:text-slate-300 cf-markdown break-words">
                    <MarkdownRenderer content={content} />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[350px] text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-md bg-slate-50 dark:bg-slate-950/50">
                    <div className="font-mono text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Nothing to preview yet
                    </div>
                    <p className="font-sans text-sm text-slate-500 dark:text-slate-400 mt-2">
                      Switch to the Write tab and start typing to see your content here.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons & Status */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md shadow-sm p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
            
            <div className="flex w-full sm:w-auto items-center gap-4">
              <button
                onClick={updateBlog}
                disabled={updating || !content.trim()}
                className="flex-1 sm:flex-none font-mono text-[11px] font-bold tracking-[0.12em] uppercase rounded-[3px] transition-opacity duration-150 cursor-pointer bg-orange-500 text-white border-none px-8 py-2.5 hover:opacity-85 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {updating ? "UPDATING..." : "UPDATE BLOG →"}
              </button>
              
              <button 
                onClick={() => navigate(-1)} 
                className="flex-1 sm:flex-none font-mono text-[11px] font-semibold tracking-[0.06em] rounded-[3px] bg-transparent text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 px-6 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-500 hover:border-red-500 dark:hover:text-red-400 dark:hover:border-red-500 transition-colors uppercase text-center"
              >
                Cancel
              </button>
            </div>

            <div className="w-full sm:w-auto text-center sm:text-right">
              {!content.trim() ? (
                <span className="inline-flex items-center justify-center sm:justify-end gap-2 text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-[3px] border border-amber-200 dark:border-amber-800/30 font-mono text-[10px] font-bold uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  Content required
                </span>
              ) : (
                <span className="inline-flex items-center justify-center sm:justify-end gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-[3px] border border-green-200 dark:border-green-800/30 font-mono text-[10px] font-bold uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_6px_#22c55e]"></span>
                  Ready to update
                </span>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}