"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MarkdownView({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ children, href }) => (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-blue-500 hover:underline dark:text-blue-400"
          >
            {children}
          </a>
        ),
        code: ({ children, className }) => {
          const isBlock = className?.startsWith("language-");
          return isBlock ? (
            <code className={`${className} whitespace-pre-wrap break-words`}>
              {children}
            </code>
          ) : (
            <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-sm break-words dark:bg-[#2a2a2a]">
              {children}
            </code>
          );
        },
        pre: ({ children }) => (
          <pre className="my-2 rounded-xl bg-[#0b0b0b] p-3 text-[13.5px] text-gray-100 whitespace-pre-wrap break-words dark:bg-black">
            {children}
          </pre>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
