"use client"

import { useState, useRef, useEffect } from "react"
import { templates, quickActions } from "./templates"

type Msg = { role: "user" | "assistant"; content: string }

export default function CopilotPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "嗨，我是你的傳承策略助理。可直接點選上方『情境模板』或輸入你的客戶情境（如：企業接班、跨境資產、醫療長照）。" }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }) }, [messages])

  async function send(content: string) {
    if (!content.trim()) return
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

  const onSend = async () => {
    const content = input.trim()
    if (!content) return
    setInput("")
    await send(content)
  }

  const runTemplate = async (id: string) => {
    const t = templates.find(x => x.id === id)
    if (!t) return
    await send(t.prompt())
  }

  const runQuick = async (prompt: string) => {
    await send(prompt)
  }

  return (
    <main className="grid gap-4">
      {/* 情境模板區 */}
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-slate-700">情境模板</h2>
          <span className="text-xs text-slate-500">免費可用；專業版支援更多模板與自訂</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {templates.map(t => (
            <button key={t.id}
              onClick={() => runTemplate(t.id)}
              className="text-left rounded-xl border border-slate-200 bg-slate-50 p-3 hover:bg-slate-100"
            >
              <div className="text-sm font-medium">{t.title}</div>
              {t.subtitle && <div className="text-xs text-slate-600 mt-1">{t.subtitle}</div>}
              <div className="text-[11px] text-slate-500 mt-2">一鍵產出話術／會議大綱／風險提醒</div>
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {quickActions.map(q => (
            <button key={q.id}
              onClick={() => runQuick(q.prompt)}
              className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs hover:bg-slate-100"
            >
              {q.label}
            </button>
          ))}
        </div>
      </section>

      {/* 對話訊息區 */}
      <div ref={listRef} className="rounded-2xl bg-white p-4 shadow-sm h-[52vh] overflow-y-auto">
        {messages.map((m, i) => (
          <div key={i} className={`mb-3 ${m.role === "user" ? "text-right" : ""}`}>
            <div className={`inline-block rounded-xl px-3 py-2 ${m.role === "user" ? "bg-sky-600 text-white" : "bg-slate-100"}`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div className="text-sm text-slate-500">思考中…</div>}
      </div>

      {/* 輸入區 */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && onSend()}
          placeholder="也可以直接輸入你的客戶情境與需求"
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
        免費方案：每日 3 次互動。升級後可解鎖更多模板、提案 PDF/PPT 匯出與私人知識庫。
      </p>
    </main>
  )
}
