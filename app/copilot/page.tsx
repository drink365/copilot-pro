// app/copilot/page.tsx
"use client"

import React, { useState, useRef, useEffect } from "react"
import MessageBubble, { ChatMessage } from "../components/MessageBubble"

export default function CopilotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  // 自動把捲軸滑到最底
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" })
  }, [messages])

  async function sendMessage() {
    const content = input.trim()
    if (!content || loading) return

    // 先加上使用者訊息
    const userMsg: ChatMessage = { role: "user", content, createdAt: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
      })

      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        const errText = j?.error || `發生錯誤（${res.status}）`
        const errMsg: ChatMessage = { role: "assistant", content: `⚠️ ${errText}`, createdAt: Date.now() }
        setMessages(prev => [...prev, errMsg])
        return
      }

      const data = await res.json()
      const replyText: string = data?.reply ?? "（無回覆內容）"
      const aiMsg: ChatMessage = { role: "assistant", content: replyText, createdAt: Date.now() }
      setMessages(prev => [...prev, aiMsg])
    } catch (e: any) {
      const aiMsg: ChatMessage = { role: "assistant", content: `⚠️ 網路或伺服器錯誤：${e?.message || e}`, createdAt: Date.now() }
      setMessages(prev => [...prev, aiMsg])
    } finally {
      setLoading(false)
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    sendMessage()
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">家族傳承 Copilot</h1>
      </header>

      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4">
        <div ref={listRef} className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {messages.map((m, idx) => (
            // 🔧 重點修正：改成傳「message」而不是 role/content
            <MessageBubble key={idx} message={m} />
          ))}
          {messages.length === 0 && (
            <div className="text-sm text-slate-500">
              嗨！可以直接輸入：<br />
              ・退休要怎麼規劃？<br />
              ・贈與 1200萬 給女兒怎麼算？<br />
              ・公司接班與股權要怎麼配置？<br />
            </div>
          )}
        </div>

        <form onSubmit={onSubmit} className="mt-4 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="請輸入你的問題（例如：遺產 8000 萬怎麼試算？）"
            className="flex-1 rounded-xl border-slate-300 focus:ring-2 focus:ring-sky-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-2 rounded-xl bg-sky-600 text-white disabled:opacity-50"
          >
            {loading ? "傳送中…" : "送出"}
          </button>
        </form>
      </section>
    </main>
  )
}
