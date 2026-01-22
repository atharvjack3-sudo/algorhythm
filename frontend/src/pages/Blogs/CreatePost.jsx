// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import { api } from "../../api/client";
// import MarkdownRenderer from "../../components/MarkdownRenderer";

// export default function CreateBlog() {
//   const [title, setTitle] = useState("");
//   const [content, setContent] = useState("");
//   const [mode, setMode] = useState("write"); // write | preview
//   const [loading, setLoading] = useState(false);

//   const navigate = useNavigate();

//   const submitBlog = async () => {
//     if (!title.trim() || !content.trim()) {
//       alert("Title and content are required");
//       return;
//     }

//     try {
//       setLoading(true);
//       await api.post("/blogs", { title, content });
//       navigate("/blogs");
//     } catch {
//       alert("Failed to publish blog");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="max-w-4xl mx-auto space-y-4">
//       <h1 className="text-2xl font-bold">Write a Blog</h1>

//       <input
//         className="w-full border p-2 rounded"
//         placeholder="Blog title"
//         value={title}
//         onChange={e => setTitle(e.target.value)}
//       />

//       {/* Tabs */}
//       <div className="flex gap-2">
//         <button
//           onClick={() => setMode("write")}
//           className={`px-3 py-1 border rounded ${
//             mode === "write" ? "bg-black text-white" : ""
//           }`}
//         >
//           Write
//         </button>
//         <button
//           onClick={() => setMode("preview")}
//           className={`px-3 py-1 border rounded ${
//             mode === "preview" ? "bg-black text-white" : ""
//           }`}
//         >
//           Preview
//         </button>
//       </div>

//       {/* Editor / Preview */}
//       {mode === "write" ? (
//         <textarea
//           className="w-full border p-2 rounded h-96 font-mono"
//           placeholder="Write Markdown + LaTeX here..."
//           value={content}
//           onChange={e => setContent(e.target.value)}
//         />
//       ) : (
//         <div className="border rounded p-4 bg-gray-50 min-h-[24rem]">
//           <MarkdownRenderer content={content || "_Nothing to preview_"} />
//         </div>
//       )}

//       <button
//         onClick={submitBlog}
//         disabled={loading}
//         className="px-4 py-2 bg-black text-white rounded"
//       >
//         {loading ? "Publishing..." : "Publish"}
//       </button>
//       <button onClick={()=>navigate("/blogs")} className="ml-2 w-20 h-10 rounded-sm border border-red-500">Cancel</button>
//     </div>
//   );
// }

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Write a Blog</h1>
          <p className="text-gray-600">Share your knowledge with the community</p>
        </div>

        {/* Title Input */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Blog Title
          </label>
          <input
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
            placeholder="Enter an engaging title..."
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-2">
            {title.length > 0 && `${title.length} characters`}
          </p>
        </div>

        {/* Editor Card */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm mb-6">
          {/* Tabs */}
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
            <div className="flex gap-2">
              <button
                onClick={() => setMode("write")}
                className={`px-6 py-2.5 rounded-lg font-semibold transition flex items-center gap-2 ${
                  mode === "write" 
                    ? "bg-cyan-500 text-white shadow-md" 
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Write
              </button>
              <button
                onClick={() => setMode("preview")}
                className={`px-6 py-2.5 rounded-lg font-semibold transition flex items-center gap-2 ${
                  mode === "preview" 
                    ? "bg-cyan-500 text-white shadow-md" 
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Preview
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              {mode === "write" 
                ? "Supports Markdown + LaTeX formatting" 
                : "Preview how your blog will look"}
            </p>
          </div>

          {/* Editor / Preview */}
          {mode === "write" ? (
            <div className="p-6">
              <textarea
                className="w-full px-4 py-3 border border-gray-200 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none transition"
                placeholder="Write your content using Markdown...

Examples:
# Heading
**bold** *italic*
- List item
```code```
$$LaTeX$$"
                value={content}
                onChange={e => setContent(e.target.value)}
                rows="20"
              />
              <div className="flex justify-between items-center mt-3">
                <p className="text-xs text-gray-500">
                  {content.length > 0 && `${content.length} characters • ${content.split(/\s+/).filter(w => w).length} words`}
                </p>
                <div className="flex gap-2">
                  <button className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium">
                    Save Draft
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 bg-white min-h-[32rem]">
              {content.trim() ? (
                <div className="prose prose-lg max-w-none">
                  <MarkdownRenderer content={content} />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-center py-20">
                  <div>
                    <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 italic">Nothing to preview yet</p>
                    <p className="text-sm text-gray-400 mt-2">Start writing to see your content here</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <button
            onClick={submitBlog}
            disabled={loading || !title.trim() || !content.trim()}
            className="px-8 py-4 bg-cyan-500 text-white rounded-xl font-bold hover:bg-cyan-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center gap-2 shadow-lg"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span>Publish Blog</span>
              </>
            )}
          </button>
          
          <button 
            onClick={() => navigate("/blogs")} 
            className="px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-semibold hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition"
          >
            Cancel
          </button>
          
        </div>
        <div className="ml-auto text-sm text-gray-500 mt-5">
            {!title.trim() || !content.trim() ? (
              <span className="flex items-center gap-2 text-amber-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Title & content required
              </span>
            ) : (
              <span className="flex items-center gap-2 text-green-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Ready to publish
              </span>
            )}
          </div>
      </div>
    </div>
  );
}