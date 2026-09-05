import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/cjs/styles/prism";

import "katex/dist/katex.min.css";

export default function MarkdownRenderer({ content, className = "" }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };

    checkTheme();
    const observer = new MutationObserver(checkTheme);

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

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
        prose-strong:text-slate-900
        dark:prose-strong:text-white
        
        /* Remove default backticks */
        prose-code:before:hidden 
        prose-code:after:hidden
        
        /* 
          INLINE CODE STYLING 
          Only targets <code> tags that are NOT inside a block <pre>
        */
        [&_:not(pre)>code]:font-mono 
        [&_:not(pre)>code]:text-[13px] 
        [&_:not(pre)>code]:bg-slate-100 
        dark:[&_:not(pre)>code]:bg-slate-800 
        [&_:not(pre)>code]:text-slate-800
        dark:[&_:not(pre)>code]:text-slate-200
        [&_:not(pre)>code]:px-1.5 
        [&_:not(pre)>code]:py-0.5 
        [&_:not(pre)>code]:rounded-[3px]
        
        ${className}
      `}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeKatex]}
        components={{
          pre({ children, ...props }) {
            const codeElement = React.isValidElement(children)
              ? children
              : null;
            const childClassName = codeElement?.props?.className || "";
            const match = /language-(\w+)/.exec(childClassName);
            if (match) {
              return (
                <div className="not-prose border border-slate-200 dark:border-slate-800 rounded-[3px] overflow-hidden my-6 bg-slate-50 dark:bg-[#12141c] shadow-sm">
                  <div className="px-3 py-1.5 bg-slate-200/50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 font-mono text-[10px] text-slate-500 tracking-wider uppercase">
                    {match[1]}
                  </div>
                  <SyntaxHighlighter
                    {...props}
                    style={isDark ? oneDark : oneLight}
                    language={match[1]}
                    PreTag="pre"
                    codeTagProps={{
                      style: {
                        backgroundColor: "transparent",
                        fontFamily: "inherit",
                      },
                    }}
                    customStyle={{
                      margin: 0,
                      padding: "1rem",
                      background: "transparent",
                      fontSize: "13px",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {String(codeElement.props.children).replace(/\n$/, "")}
                  </SyntaxHighlighter>
                </div>
              );
            }

            return (
              <pre
                className="not-prose p-4 bg-slate-50 dark:bg-[#12141c] border border-slate-200 dark:border-slate-800 rounded-[3px] text-[13px] font-mono text-slate-800 dark:text-slate-200 my-6 overflow-x-auto shadow-sm"
                {...props}
              >
                {children}
              </pre>
            );
          },

          code({ className, children, ...props }) {
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
