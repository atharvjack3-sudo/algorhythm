import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "/src/api/client";
import { Plus, MessageSquare, ArrowUpCircle, MessageCircle } from "lucide-react";
import { useAuth } from "/src/context/AuthContext";
import CreateDiscussionModal from "../CreateDiscussionModal";

export default function DiscussionTab() {
  const { problemId } = useParams();
  const navigate = useNavigate();
  const { user, authLoading } = useAuth();

  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    if (!user) return;
    fetchDiscussions();
  }, [problemId, user]);

  const fetchDiscussions = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/problems/${problemId}/discussions`);
      setDiscussions(res.data);
    } catch (err) {
      console.error("FETCH DISCUSSIONS ERROR", err);
    } finally {
      setLoading(false);
    }
  };

  const createDiscussion = async () => {
    if (!title.trim() || !body.trim()) return;

    try {
      await api.post(`/problems/${problemId}/discussions`, { title, body });
      setTitle("");
      setBody("");
      setShowCreate(false);
      fetchDiscussions();
    } catch (err) {
      console.error("CREATE DISCUSSION ERROR", err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
          <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-500" />
          Discussions
        </h2>

        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-600/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          New Post
        </button>
      </div>

      {/* Discussion List */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center">
          <div className="relative w-10 h-10 flex items-center justify-center mb-4">
            <div className="absolute inset-0 rounded-full border-[3px] border-slate-200 dark:border-slate-800"></div>
            <div className="absolute inset-0 rounded-full border-[3px] border-blue-600 dark:border-blue-500 border-t-transparent border-r-transparent animate-[spin_0.8s_linear_infinite]"></div>
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">Loading discussions...</p>
        </div>
      ) : discussions.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 transition-colors">
          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full mx-auto mb-4 flex items-center justify-center border border-slate-100 dark:border-slate-700">
            <MessageSquare className="w-8 h-8 text-slate-400 dark:text-slate-500" />
          </div>
          <h4 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white mb-1">No discussions yet</h4>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6">Be the first to start a conversation!</p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-6 py-2.5 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-sm font-bold shadow-md transition-all active:scale-95"
          >
            Start Discussion
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {discussions.map((d) => (
            <div 
              key={d.id} 
              onClick={() => navigate(`/problemset/${problemId}/discussions/${d.id}`)}
              className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:shadow-md hover:shadow-slate-200/50 dark:hover:shadow-none hover:border-blue-300 dark:hover:border-slate-700 transition-all cursor-pointer group"
            >
              <h3 className="text-[15px] font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-3 tracking-tight">
                {d.title}
              </h3>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] font-medium text-slate-500 dark:text-slate-400">
                
                {/* Author */}
                <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <div className="w-5 h-5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-[10px] font-bold border border-blue-100 dark:border-blue-500/20">
                    {d.username.charAt(0).toUpperCase()}
                  </div>
                  {d.username}
                </span>

                <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>

                {/* Stats */}
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                    <MessageCircle className="w-4 h-4" />
                    {d.reply_count} replies
                  </span>
                  
                  <span className="flex items-center gap-1.5 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                    <ArrowUpCircle className="w-4 h-4" />
                    {d.upvotes} upvotes
                  </span>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <CreateDiscussionModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title={title}
        setTitle={setTitle}
        body={body}
        setBody={setBody}
        onSubmit={createDiscussion}
      />
    </div>
  );
}