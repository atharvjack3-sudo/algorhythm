import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function BlogComments({ blogId }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    api.get(`/blogs/${blogId}/comments`)
      .then(res => {
        setComments(res.data);
        setLoading(false);
      });
  }, [blogId]);

  const submitComment = async () => {
    if (!text.trim()) return;

    setPosting(true);
    await api.post(`/blogs/${blogId}/comments`, { content: text });
    setText("");
    const res = await api.get(`/blogs/${blogId}/comments`);
    setComments(res.data);
    setPosting(false);
  };

  const toggleLike = async (id) => {
    const res = await api.post(`/comments/${id}/like`);
    setComments(prev =>
      prev.map(c =>
        c.id === id
          ? { ...c, likes_count: c.likes_count + (res.data.liked ? 1 : -1) }
          : c
      )
    );
  };

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center transition-colors duration-300">
        <div className="relative w-10 h-10 flex items-center justify-center mb-4">
          <div className="absolute inset-0 rounded-full border-[3px] border-slate-200 dark:border-slate-800"></div>
          <div className="absolute inset-0 rounded-full border-[3px] border-blue-600 dark:border-blue-500 border-t-transparent border-r-transparent animate-[spin_0.8s_linear_infinite]"></div>
          <div className="absolute inset-0 rounded-full bg-blue-500/10 dark:bg-blue-500/20 blur-sm"></div>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium animate-pulse">Loading comments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Comment Input */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 transition-colors">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-[15px] text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all resize-none shadow-sm shadow-slate-100/50 dark:shadow-none"
          placeholder="Share your thoughts or ask a question..."
          rows="3"
        />
        <div className="flex justify-between items-center mt-4">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {text.length > 0 && `${text.length} characters`}
          </p>
          <button 
            onClick={submitComment}
            disabled={!text.trim() || posting}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-md shadow-blue-600/20 flex items-center gap-2"
          >
            {posting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Posting...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span>Post Comment</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 transition-colors">
          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full mx-auto mb-4 flex items-center justify-center border border-slate-100 dark:border-slate-700">
            <svg className="w-8 h-8 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h4 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white mb-1">No comments yet</h4>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-5">
          {comments.map(c => (
            <div key={c.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 hover:shadow-lg hover:shadow-slate-200/40 dark:hover:shadow-none hover:border-blue-200 dark:hover:border-slate-700 transition-all duration-300 group">
              <div className="flex items-start gap-4">
                
                {/* Avatar */}
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm flex-shrink-0 border border-blue-100 dark:border-blue-500/20">
                  {c.username.charAt(0).toUpperCase()}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2">
                    <span className="font-semibold text-slate-900 dark:text-white">{c.username}</span>
                    <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">•</span>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {c.created_at && new Date(c.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  
                  <p className="text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed mb-4 whitespace-pre-wrap">
                    {c.content}
                  </p>
                  
                  <div className="flex items-center gap-5">
                    <button 
                      onClick={() => toggleLike(c.id)}
                      className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group/btn"
                    >
                      <svg className="w-4 h-4 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                      </svg>
                      <span>{c.likes_count}</span>
                    </button>
                    
                    <button className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group/btn">
                      <svg className="w-4 h-4 group-hover/btn:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      <span>Reply</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}