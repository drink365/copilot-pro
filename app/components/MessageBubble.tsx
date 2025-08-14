// app/components/MessageBubble.tsx
"use client"

import MarkdownRenderer from "./MarkdownRenderer"
import React from "react"

// 簡單的 class 合併（避免依賴 classnames）
function cx(...args: Array<string | false | null | undefined>) {
  return args.filter(Boolean).join(" ")
}

type Props = {
  role: "user" | "assistant"
  content: string
}

export default function MessageBubble({ role, content }: Props) {
  const isUser = role === "user"

  return (
    <div className={cx("mb-3", isUser && "text-right")}>
      <div
        className={cx(
          "inline-block max-w-[86%] rounded-2xl px-4 py-3 shadow-sm align-top",
          isUser ? "bg-brand-600 text-white" : "bg-white border border-slate-200 text-slate-800"
        )}
      >
        {isUser ? (
          // 使用者訊息：保留換行、避免超長字串溢出
          <div className="whitespace-pre-wrap break-words">{content}</div>
        ) : (
          // 助理訊息：用 Markdown 漂亮渲染
          <MarkdownRenderer content={content} />
        )}
      </div>
    </div>
  )
}
