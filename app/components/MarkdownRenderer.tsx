// app/components/MarkdownRenderer.tsx
"use client"

import * as React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

export default function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-sm sm:prose-base max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
