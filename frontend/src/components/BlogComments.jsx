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
      <div className="text-center py-8">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm text-gray-500">Loading comments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Comment Input */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-lg p-4 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none"
          placeholder="Share your thoughts..."
          rows="4"
        />
        <div className="flex justify-between items-center mt-3">
          <p className="text-xs text-gray-500">
            {text.length > 0 && `${text.length} characters`}
          </p>
          <button 
            onClick={submitComment}
            disabled={!text.trim() || posting}
            className="px-6 py-2.5 bg-cyan-500 text-white rounded-lg font-semibold hover:bg-cyan-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center gap-2"
          >
            {posting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h4 className="font-semibold text-gray-900 mb-1">No comments yet</h4>
          <p className="text-sm text-gray-500">Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map(c => (
            <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {c.username.charAt(0).toUpperCase()}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-900">{c.username}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      {c.created_at && new Date(c.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 leading-relaxed mb-3 whitespace-pre-wrap">
                    {c.content}
                  </p>
                  
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => toggleLike(c.id)}
                      className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-cyan-600 transition group"
                    >
                      <svg className="w-5 h-5 group-hover:scale-110 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                      </svg>
                      <span className="font-medium">{c.likes_count}</span>
                    </button>
                    
                    <button className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-cyan-600 transition">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      <span className="font-medium">Reply</span>
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