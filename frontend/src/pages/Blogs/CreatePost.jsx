import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import MarkdownRenderer from "../../components/MarkdownRenderer";

export default function CreateBlog() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mode, setMode] = useState("write"); // write | preview
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const submitBlog = async () => {
    if (!title.trim() || !content.trim()) {
      alert("Title and content are required");
      return;
    }

    try {
      setLoading(true);
      await api.post("/blogs", { title, content });
      navigate("/blogs");
    } catch {
      alert("Failed to publish blog");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0a0c10] font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        
        {/* Header */}
        <div className="mb-8 md:mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Write a Blog</h1>
          <p className="text-slate-500 dark:text-slate-400">Share your knowledge and insights with the community</p>
        </div>

        {/* Title Input */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 mb-6 shadow-sm transition-colors group">
          <label className="block text-[13px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
            Blog Title
          </label>
          <input
            className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-lg font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:focus:border-blue-500 transition-all shadow-sm shadow-slate-100/50 dark:shadow-none"
            placeholder="Enter an engaging title..."
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <p className={`text-[12px] font-medium mt-3 transition-colors ${title.length > 0 ? 'text-slate-500 dark:text-slate-400' : 'text-transparent'}`}>
            {title.length > 0 ? `${title.length} characters` : '0 characters'}
          </p>
        </div>

        {/* Editor Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm mb-6 transition-colors">
          
          {/* Tabs */}
          <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 px-4 md:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
            <div className="flex gap-2 p-1 bg-slate-200/50 dark:bg-slate-800/50 rounded-xl inline-flex self-start">
              <button
                onClick={() => setMode("write")}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                  mode === "write" 
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" 
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Write
              </button>
              <button
                onClick={() => setMode("preview")}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                  mode === "preview" 
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm" 
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Preview
              </button>
            </div>
            <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
              {mode === "write" 
                ? "Supports Markdown + LaTeX formatting" 
                : "Preview how your blog will look"}
            </p>
          </div>

          {/* Editor / Preview Content */}
          {mode === "write" ? (
            <div className="p-6">
              <textarea
                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-[14px] text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-y min-h-[400px] shadow-inner dark:shadow-none"
                placeholder="Write your content using Markdown...

Examples:
# Heading
**bold** *italic*
- List item
```code```
$$LaTeX$$"
                value={content}
                onChange={e => setContent(e.target.value)}
                rows="18"
              />
              <div className="flex justify-between items-center mt-4">
                <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
                  {content.length > 0 ? `${content.length} characters • ${content.split(/\s+/).filter(w => w).length} words` : "0 words"}
                </p>
                <div className="flex gap-2">
                  <button className="text-[13px] px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-semibold">
                    Save Draft
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 md:p-10 min-h-[450px]">
              {content.trim() ? (
                <div className="prose prose-slate dark:prose-invert prose-lg max-w-none prose-headings:tracking-tight prose-a:text-blue-600 dark:prose-a:text-blue-400 hover:prose-a:text-blue-500">
                  <MarkdownRenderer content={content} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[350px] text-center">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-8 h-8 text-slate-300 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">Nothing to preview yet</p>
                  <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Switch to the Write tab and start typing to see your content here.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons & Status */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm transition-colors">
          
          <div className="flex w-full sm:w-auto items-center gap-4">
            <button
              onClick={submitBlog}
              disabled={loading || !title.trim() || !content.trim()}
              className="flex-1 sm:flex-none px-8 py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 disabled:shadow-none"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <span>Publish Blog</span>
                </>
              )}
            </button>
            
            <button 
              onClick={() => navigate("/blogs")} 
              className="flex-1 sm:flex-none px-8 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:border-rose-300 dark:hover:border-rose-500/50 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-all active:scale-95 text-center"
            >
              Cancel
            </button>
          </div>

          <div className="text-[13px] font-medium w-full sm:w-auto text-center sm:text-right">
            {!title.trim() || !content.trim() ? (
              <span className="flex items-center justify-center sm:justify-end gap-2 text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-100 dark:border-amber-500/20">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Title & content required
              </span>
            ) : (
              <span className="flex items-center justify-center sm:justify-end gap-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-500/20">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Ready to publish
              </span>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}