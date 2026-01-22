import { X, Code, Bold } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

export default function CreateDiscussionModal({
  open,
  onClose,
  title,
  setTitle,
  body,
  setBody,
  onSubmit,
}) {
  if (!open) return null;

  const insertCodeBlock = () => {
    setBody(body + "\n```cpp\n// your code here\n```\n");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
      <div className="w-[90vw] h-[90vh] bg-white rounded-xl shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Create Discussion</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-500 hover:text-black" />
          </button>
        </div>

        {/* Title */}
        <div className="px-6 py-3 border-b">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Discussion title"
            className="w-full text-lg font-medium outline-none"
          />
        </div>

        {/* Editor */}
        <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
          {/* Left Editor */}
          <div className="w-full md:w-1/2 border-b md:border-b-0 md:border-r flex flex-col">

            {/* Toolbar */}
            <div className="flex gap-2 px-4 py-2 border-b">
              <button
                onClick={() => setBody(body + "**bold**")}
                className="text-sm flex items-center gap-1"
              >
                <Bold className="w-4 h-4" /> Bold
              </button>
              <button
                onClick={insertCodeBlock}
                className="text-sm flex items-center gap-1"
              >
                <Code className="w-4 h-4" /> Code
              </button>
            </div>

            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="flex-1 p-4 resize-none outline-none font-mono text-sm"
              placeholder="Write your discussion (Markdown supported)..."
            />
          </div>

          {/* Right Preview */}
          <div className="w-full md:w-1/2 p-4 overflow-y-auto bg-gray-50 prose max-w-none">

            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                code({ inline, className, children }) {
                  const match = /language-(\w+)/.exec(className || "");
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={oneDark}
                      language={match[1]}
                      PreTag="div"
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  ) : (
                    <code className="bg-gray-200 px-1 rounded">{children}</code>
                  );
                },
              }}
            >
              {body || "*Live preview will appear here*"}
            </ReactMarkdown>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg">
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="px-5 py-2 bg-cyan-500 text-white rounded-lg"
          >
            Post Discussion
          </button>
        </div>
      </div>
    </div>
  );
}
