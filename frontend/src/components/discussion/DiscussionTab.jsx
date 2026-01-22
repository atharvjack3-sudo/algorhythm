import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "/src/api/client";
import { Plus, MessageSquare } from "lucide-react";
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Discussions
        </h2>

        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-3 py-1.5
             bg-cyan-500 text-white rounded-lg text-sm"
        >
          <Plus className="w-4 h-4" />
          New Post
        </button>
      </div>

      {/* Create Post */}
      {/* {showCreate && (
        <div className="border rounded-xl p-4 bg-gray-50 space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Discussion title"
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your thoughts (Markdown supported)"
            rows={4}
            className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
          />

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowCreate(false)}
              className="px-3 py-1.5 text-sm text-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={createDiscussion}
              className="px-4 py-1.5 bg-cyan-500
                         text-white rounded-lg text-sm"
            >
              Post
            </button>
          </div>
        </div>
      )} */}

      {/* Discussion List */}
      {loading ? (
        <div className="text-gray-500 text-sm">Loading discussions…</div>
      ) : discussions.length === 0 ? (
        <div className="text-gray-500 text-sm">
          No discussions yet. Be the first to post!
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {discussions.map((d) => (
            <div key={d.id} className="px-2 py-4 hover:bg-gray-50">
              <h3
                onClick={() =>
                  navigate(`/problemset/${problemId}/discussions/${d.id}`)
                }
                className="font-semibold text-gray-900
                           hover:text-cyan-500 cursor-pointer"
              >
                {d.title}
              </h3>

              <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                <span>by {d.username}</span>
                <span>{d.reply_count} replies</span>
                <span>{d.upvotes} upvotes</span>
              </div>
            </div>
          ))}
        </div>
      )}

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
