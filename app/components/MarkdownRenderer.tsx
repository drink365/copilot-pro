// app/components/MarkdownRenderer.tsx
"use client"

import React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

export default function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-sm sm:prose-base max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: (props) => <a {...props} target="_blank" rel="noreferrer" />,
          table: (props) => <div className="overflow-x-auto"><table className="min-w-full text-sm" {...props} /></div>,
          th: (props) => <th className="border-b p-2 text-left bg-slate-100" {...props} />,
          td: (props) => <td className="border-b p-2 align-top" {...props} />,
          code: ({ inline, className, children, ...props }) =>
            inline ? (
              <code className="px-1 py-0.5 rounded bg-slate-200 text-slate-800" {...props}>{children}</code>
            ) : (
              <pre className="rounded-xl bg-slate-900 text-slate-100 p-4 overflow-x-auto text-xs sm:text-[13px]">
                <code {...props} className={className}>{children}</code>
              </pre>
            ),
          h1: (props) => <h1 className="text-xl font-semibold" {...props} />,
          h2: (props) => <h2 className="text-lg font-semibold mt-2" {...props} />,
          h3: (props) => <h3 className="text-base font-semibold mt-2" {...props} />,
          ul: (props) => <ul className="list-disc pl-5" {...props} />,
          ol: (props) => <ol className="list-decimal pl-5" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
