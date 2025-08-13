"use client"

import { useState, useRef, useEffect } from "react"
type Msg = { role: "user" | "assistant"; content: string }

export default function CopilotPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "嗨，我是你的傳承策略助理。今天想處理哪種情境？（例如：企業接班、跨境資產、稅源預留、醫療長照）" }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }) }, [messages])

  const onSend = async () => {
    const content = input.trim()
    if (!content) return
    setInput("")
    setMessages(prev => [...prev, { role: "user", content }])
    setLoading(true)
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "發生錯誤")
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }])
    } catch (e: any) {
      setMessages(prev => [...prev, { role: "assistant", content: `⚠️ ${e.message}` }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="grid gap-4">
      <div ref={listRef} className="rounded-2xl bg-white p-4 shadow-sm h-[60vh] overflow-y-auto">
        {messages.map((m, i) => (
          <div key={i} className={`mb-3 ${m.role === "user" ? "text-right" : ""}`}>
            <div className={`inline-block rounded-xl px-3 py-2 ${m.role === "user" ? "bg-sky-600 text-white" : "bg-slate-100"}`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div className="text-sm text-slate-500">思考中…</div>}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && onSend()}
          placeholder="請描述你的客戶情境或想要的產出"
          className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <button
          onClick={onSend}
          disabled={loading}
          className="rounded-xl bg-sky-600 px-4 py-2 text-white hover:bg-sky-700 disabled:opacity-50"
        >
          送出
        </button>
      </div>

      <p className="text-xs text-slate-500">
        免費方案：每日 3 次互動。升級後可解鎖提案生成器、情境模板與私人知識庫。
      </p>
    </main>
  )
}
