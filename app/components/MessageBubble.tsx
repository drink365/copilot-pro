"use client"

import React, { useState } from "react"
import MarkdownRenderer from "./MarkdownRenderer"

type Role = "user" | "assistant" | "system"

export type ChatMessage = {
  id?: string
  role: Role
  content: string
  createdAt?: string | number | Date
}

type Props = {
  message: ChatMessage
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === "user"
  const isAssistant = message.role === "assistant"
  const [copied, setCopied] = useState(false)

  const timeLabel = message.createdAt
    ? new Date(message.createdAt).toLocaleString()
    : ""

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(message.content || "")
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      // ignore
    }
  }

  return (
    <div
      className={[
        "w-full flex items-start gap-3 group",
        isUser ? "justify-end" : "justify-start",
        "py-2"
      ].join(" ")}
    >
      <div
        className={[
          "shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold",
          isUser
            ? "bg-blue-600 text-white order-2"
            : "bg-neutral-200 text-neutral-700 order-1"
        ].join(" ")}
        aria-hidden
        title={isUser ? "You" : isAssistant ? "Assistant" : "System"}
      >
        {isUser ? "Me" : "AI"}
      </div>

      <div
        className={[
          "max-w-[88%] md:max-w-[75%] lg:max-w-[65%]",
          "rounded-2xl px-4 py-3 shadow-sm",
          isUser
            ? "bg-blue-600 text-white order-1"
            : "bg-white text-neutral-900 border border-neutral-200 order-2"
        ].join(" ")}
      >
        <MarkdownRenderer
          content={message.content || ""}
          className={[
            "prose max-w-none prose-sm sm:prose-base",
            "break-words whitespace-pre-wrap",
            isUser ? "prose-invert" : ""
          ].join(" ")}
        />
        <div className="mt-2 flex items-center justify-end gap-2 text-[11px]">
          {timeLabel && (
            <span className={isUser ? "text-white/80" : "text-neutral-500"}>
              {timeLabel}
            </span>
          )}
          <button
            type="button"
            onClick={onCopy}
            className={[
              "opacity-0 group-hover:opacity-100 transition-opacity",
              "px-2 py-1 rounded-md text-[11px] border",
              isUser
                ? "border-white/30 text-white/90 hover:bg-white/10"
                : "border-neutral-300 text-neutral-600 hover:bg-neutral-50"
            ].join(" ")}
            aria-label="複製內容"
            title="複製內容"
          >
            {copied ? "已複製" : "複製"}
          </button>
        </div>
      </div>
    </div>
  )
}
