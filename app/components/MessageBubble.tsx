// app/components/MessageBubble.tsx
"use client"

import React from "react"
import MarkdownRenderer from "./MarkdownRenderer" // 直接匯入，允許 CSR

// 輕量 class 合併（免裝 classnames）
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
    <div className={cx("flex w-full gap-2", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cx(
          "inline-block max-w-[86%] rounded-2xl px-4 py-3 shadow-sm align-top",
          isUser ? "bg-sky-600 text-white" : "bg-white border border-slate-200 text-slate-800"
        )}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap break-words">{content}</div>
        ) : (
          <MarkdownRenderer content={content} />
        )}
      </div>
    </div>
  )
}
