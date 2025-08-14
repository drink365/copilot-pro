// app/components/MessageBubble.tsx
"use client"

import React from "react"
import dynamic from "next/dynamic"

// ✅ 僅在瀏覽器載入 MarkdownRenderer，避免伺服器預渲染時觸發 unified/remark
const MarkdownRenderer = dynamic(() => import("./MarkdownRenderer"), { ssr: false })

// 輕量 class 合併（免安裝 classnames）
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
          <div className="whitespace-pre-wrap break-words">{content}</div>
        ) : (
          <MarkdownRenderer content={content} />
        )}
      </div>
    </div>
  )
}
