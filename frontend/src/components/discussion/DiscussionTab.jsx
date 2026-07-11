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
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchDiscussions();
  }, [problemId]);

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
    setIsCreating(true);
    try {
      await api.post(`/problems/${problemId}/discussions`, { title, body });
      setTitle("");
      setBody("");
      setShowCreate(false);
      fetchDiscussions();
    } catch (err) {
      console.error("CREATE DISCUSSION ERROR", err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
        <h2 className="font-sans text-[14px] font-semibold text-slate-700 dark:text-slate-300 tracking-wide flex items-center gap-2">
          
          Discussions
        </h2>

        <button
          disabled={authLoading || !user}
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:opacity-85 cursor-pointer text-white rounded-[3px] text-[12px] font-sans font-bold tracking-wider transition-opacity disabled:cursor-not-allowed disabled:opacity-65"
        >
          <Plus className="w-3.5 h-3.5" />
          New Post
        </button>
      </div>
      {!authLoading && !user && <p className="text-center text-[10px] font-semibold tracking-wide dark:text-red-500 text-red-600 font-mono uppercase">Sign in to create discussion posts</p>}

      {/* Discussion List */}
      {loading ? (
        <div className="py-20 flex items-center justify-center">
          <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tracking-[0.15em] animate-pulse uppercase">
            Loading Discussions...
          </span>
        </div>
      ) : discussions.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 dark:bg-slate-900 rounded-md border border-slate-300 dark:border-slate-800 transition-colors">
          <div className="font-sans text-[13px] font-semibold text-slate-500 dark:text-slate-400 tracking-wide mb-4">
            No Discussions Found.
          </div>
          <button
            disabled={authLoading || !user}
            onClick={() => setShowCreate(true)}
            className="px-6 disabled:cursor-not-allowed disabled:opacity-60 py-2 cursor-pointer bg-transparent border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-[3px] text-[12px] font-sans font-semibold tracking-wide transition-colors"
          >
            Start Discussion
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {discussions.map((d) => (
            <div 
              key={d.id} 
              onClick={() => navigate(`/problemset/${problemId}/discussions/${d.id}`)}
              className="p-5 bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md hover:border-orange-400 dark:hover:border-orange-500/80 transition-colors cursor-pointer group flex flex-col gap-4"
            >
              <h3 className="text-[15px] font-sans font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-500 transition-colors leading-snug">
                {d.title}
              </h3>

              <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800/60 pt-4">
                
                {/* Author Info */}
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <div className="w-6 h-6 bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-[3px] flex items-center justify-center text-[11px] font-mono font-bold uppercase transition-colors">
                    {d.username.charAt(0)}
                  </div>
                  <span className="font-sans text-[13px] font-bold group-hover:text-orange-600 dark:group-hover:text-orange-500 transition-colors">
                    {d.username}
                  </span>
                </span>

                {/* Stats */}
                <div className="flex items-center gap-4 font-sans text-[12px] tracking-wide text-slate-500 dark:text-slate-500">
                  <span className="flex items-center gap-1.5 group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors">
                    <MessageCircle className="w-3.5 h-3.5" />
                    {d.reply_count} <span className="hidden sm:inline">Replies</span>
                  </span>
                  
                  <span className="flex items-center gap-1.5 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                    <ArrowUpCircle className="w-3.5 h-3.5" />
                    {d.votes} <span className="hidden sm:inline">Votes</span>
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
        isSubmitting={isCreating}
      />
    </div>
  );
}