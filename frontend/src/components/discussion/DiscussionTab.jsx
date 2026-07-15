import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "/src/api/client";
import { Plus, Terminal, ArrowUp, MessageCircle } from "lucide-react";
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
    <div className="flex flex-col gap-4 w-full">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
        <h2 className="font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-[0.15em] flex items-center gap-2">
          <Terminal size={14} className="text-orange-500" />
          Discussion Board
        </h2>

        <div className="flex items-center gap-3">
          {!authLoading && !user && (
            <span className="text-[9px] font-bold tracking-widest dark:text-red-500 text-red-600 font-mono uppercase">
              [ SIGN IN TO POST ]
            </span>
          )}
          <button
            disabled={authLoading || !user}
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-orange-600 hover:bg-orange-700 cursor-pointer text-white rounded-[3px] text-[10px] font-mono font-bold tracking-widest uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-50 border border-orange-600 shadow-sm"
          >
            <Plus size={14} />
            New Post
          </button>
        </div>
      </div>

      {/* Discussion List */}
      {loading ? (
        <div className="py-20 flex items-center justify-center">
          <span className="font-mono text-xs text-slate-500 dark:text-slate-400 tracking-[0.2em] animate-pulse uppercase">
            LOADING DISCUSSIONS...
          </span>
        </div>
      ) : discussions.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#0d1117] rounded-[3px] border border-slate-200 dark:border-slate-800 transition-colors shadow-sm flex flex-col items-center gap-4">
          <div className="font-sans text-[12px] font-semibold text-slate-500 dark:text-slate-400 ">
            No discussions found
          </div>
          <button
            disabled={authLoading || !user}
            onClick={() => setShowCreate(true)}
            className="px-5 py-2 cursor-pointer bg-slate-50 dark:bg-[#050608] border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[3px] text-[12px] font-sans font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="bg-white dark:bg-[#0d1117] border border-slate-200 dark:border-slate-800 rounded-[3px] overflow-hidden shadow-sm hover:border-orange-500 dark:hover:border-orange-500/80 transition-colors cursor-pointer group flex flex-col"
            >
              {/* Card Meta Header */}
              <div className="px-5 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#161b22] flex justify-between items-center transition-colors">
                
                {/* Author Info */}
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 bg-blue-100 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 text-orange-700 dark:text-orange-500 rounded-[3px] flex items-center justify-center text-[10px] font-mono font-bold uppercase transition-colors">
                    {d.username.charAt(0)}
                  </div>
                  <span className="font-sans text-[11px] font-semibold text-slate-600 dark:text-slate-400 tracking-wide group-hover:text-orange-600 dark:group-hover:text-orange-500 transition-colors">
                    {d.username}
                  </span>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 font-mono text-[10px] font-bold tracking-widest text-slate-500 dark:text-slate-400 uppercase">
                  <span className="flex items-center gap-1.5 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors" title="Votes">
                    <ArrowUp size={12} strokeWidth={2.5} /> {d.votes}
                  </span>
                  <span className="flex items-center gap-1.5 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" title="Replies">
                    <MessageCircle size={12} strokeWidth={2.5} /> {d.reply_count}
                  </span>
                </div>
              </div>
              
              {/* Card Body */}
              <div className="px-5 py-4">
                <h3 className="text-[14px] font-sans font-bold text-slate-800 dark:text-slate-200 group-hover:text-orange-600 dark:group-hover:text-orange-500 transition-colors leading-snug">
                  {d.title}
                </h3>
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