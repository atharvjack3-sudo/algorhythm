import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../api/client.js";
import { useAuth } from "../../context/AuthContext.jsx";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";

import "katex/dist/katex.min.css";
import "highlight.js/styles/github-dark.css"; // code theme

export default function DiscussionDetail() {
  const { problemId, discussionId } = useParams();
  const [discussion, setDiscussion] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    api
      .get(`/problems/${problemId}/discussions/${discussionId}`)
      .then((res) => setDiscussion(res.data))
      .catch(console.error);
  }, [discussionId, user]);

  if (!discussion) {
    return <div className="p-6">Loading…</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">{discussion.title}</h1>

      <div className="text-sm text-gray-500">
        Posted by {discussion.username}
      </div>

      <div className="prose max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex, rehypeHighlight]}
          components={{
            code({ inline, className, children, ...props }) {
              if (inline) {
                return (
                  <code className="bg-gray-100 px-1 rounded text-sm">
                    {children}
                  </code>
                );
              }

              return (
                <pre className="rounded-lg overflow-x-auto">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              );
            },
          }}
        >
          {discussion.body}
        </ReactMarkdown>
      </div>
    </div>
  );
}
