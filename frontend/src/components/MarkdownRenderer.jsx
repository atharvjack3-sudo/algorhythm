// import ReactMarkdown from "react-markdown";
// import remarkGfm from "remark-gfm";
// import remarkMath from "remark-math";
// import rehypeKatex from "rehype-katex";
// import rehypeHighlight from "rehype-highlight";

// export default function MarkdownRenderer({ content }) {
//   return (
//     <div className="prose max-w-none">
//       <ReactMarkdown
//         remarkPlugins={[remarkGfm, remarkMath]}
//         rehypePlugins={[rehypeKatex, rehypeHighlight]}
//       >
//         {content}
//       </ReactMarkdown>
//     </div>
//   );
// }

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";

export default function MarkdownRenderer({ content, className = "" }) {
  if (!content) return null;

  return (
    <div
      className={`
        prose dark:prose-invert max-w-none
        prose-p:my-4
        prose-headings:font-bold
        prose-headings:text-slate-900
        dark:prose-headings:text-white
        prose-h1:text-3xl
        prose-h2:text-xl
        prose-h2:mb-4
        prose-h3:text-lg
        prose-h3:mt-6
        prose-h3:mb-3
        prose-ul:list-disc
        prose-ul:pl-6
        prose-ul:my-4
        prose-ol:list-decimal
        prose-ol:pl-6
        prose-ol:my-4
        prose-li:my-1
        prose-pre:bg-slate-900
        prose-pre:text-slate-100
        prose-pre:rounded-xl
        prose-code:text-blue-600
        dark:prose-code:text-blue-400
        prose-strong:text-slate-900
        dark:prose-strong:text-white
        ${className}
      `}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeHighlight]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
