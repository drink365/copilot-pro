// app/components/MarkdownRenderer.tsx
"use client"

import React from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

type Props = {
  content: string
  className?: string
}

export default function MarkdownRenderer({ content, className }: Props) {
  return (
    <div className={className ?? "prose max-w-none"}>
      <ReactMarkdown
        // GitHub 風格支援：表格、待辦清單、刪除線等
        remarkPlugins={[remarkGfm]}
        // 安全考量：不解析原始 HTML，避免 XSS
        // 若你確定來源安全、一定需要解析 HTML，再加 rehypeRaw（需額外安裝）
        // rehypePlugins={[rehypeRaw]}
      >
        {content || ""}
      </ReactMarkdown>
    </div>
  )
}
