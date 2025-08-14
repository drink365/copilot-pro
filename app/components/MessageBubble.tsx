// app/components/MessageBubble.tsx
"use client"

import clsx from "classnames"
import MarkdownRenderer from "./MarkdownRenderer"

export default function MessageBubble({
  role,
  content,
}: {
  role: "user" | "assistant"
  content: string
}) {
  const isUser = role === "user"
  return (
    <div className={clsx("mb-3", isUser ? "text-right" : "text-left")}>
      <div
        className={clsx(
          "inline-block max-w-[86%] rounded-2xl px-4 py-3 shadow-sm align-top",
          isUser
            ? "bg-brand-600 text-white"
            : "bg-white border border-slate-200 text-slate-800"
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
