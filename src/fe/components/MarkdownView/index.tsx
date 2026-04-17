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
        table: ({ children }) => (
          <div className="my-3 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-gray-100 dark:bg-[#2a2a2a]">{children}</thead>
        ),
        th: ({ children }) => (
          <th className="border border-gray-300 px-3 py-2 text-left font-semibold dark:border-[#4a4a4a]">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-gray-300 px-3 py-2 dark:border-[#4a4a4a]">
            {children}
          </td>
        ),
        pre: ({ children }) => (
          <pre className="my-2 rounded-xl bg-[#0b0b0b] p-3 text-[13.5px] whitespace-pre-wrap break-words dark:bg-black">
            {children}
          </pre>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
