// app/copilot/page.tsx
"use client"

import { useEffect, useState } from "react"
import AdminBar from "../components/AdminBar"
import { templates, quickActions } from "./templates"
import MessageBubble from "../components/MessageBubble"

type Msg = { role: "user" | "assistant"; content: string }

export default function CopilotPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "嗨，我是你的傳承策略助理。可點『情境模板』或直接輸入情境（支援 Markdown 排版）。" }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [isPro, setIsPro] = useState<boolean | null>(null)

  useEffect(() => {
    fetch("/api/debug").then(r => r.json()).then(d => setIsPro(!!d.isPro)).catch(() => {})
  }, [])

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
      if (typeof data.isPro === "boolean") setIsPro(!!data.isPro)
    } catch (e: any) {
      setMessages(prev => [...prev, { role: "assistant", content: `⚠️ ${e.message}` }])
    } finally {
      setLoading(false)
    }
  }

  const onSend = async () => {
    const c = input.trim()
    if (!c) return
    setInput("")
    await send(c)
  }

  const runTemplate = async (id: string) => {
    const t = templates.find(x => x.id === id)
    if (!t) return
    await send(t.prompt())
  }
  const runQuick = async (p: string) => { await send(p) }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      <AdminBar enabled />
      {/* 快捷動作 */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-700">快速指令</h2>
          <span className="text-xs text-slate-500">免費每日 3 次；升級解鎖更多</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickActions.map(a => (
            <button key={a.id}
              onClick={() => runQuick(a.prompt)}
              className="rounded-full border border-slate-300 bg-slate-50 hover:bg-slate-100 px-3 py-1 text-xs">
              {a.label}
            </button>
          ))}
        </div>
      </section>

      {/* 情境模板 */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-700">情境模板</h2>
          <span className="text-xs text-slate-500">免費可用；專業版支援更多模板與自訂</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {templates.map(t => (
            <button key={t.id} onClick={() => runTemplate(t.id)}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-3 hover:bg-slate-100 transition shadow-sm text-left">
              <div className="text-sm font-medium">{t.title}</div>
              {t.subtitle && <div className="text-xs text-slate-600 mt-1">{t.subtitle}</div>}
              <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-500">
                <span className="inline-block rounded-full bg-slate-200 text-slate-700 px-2 py-0.5">一鍵產出</span>
                <span>話術／會議大綱／風險提醒</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 對話區 */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4">
        <div className="space-y-3">
          {messages.map((m, idx) => <MessageBubble key={idx} role={m.role} content={m.content} />)}
        </div>
        <div className="mt-4 flex gap-2">
          <input
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="輸入你的問題或情境…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") onSend() }}
          />
          <button
            onClick={onSend}
            disabled={loading}
            className="rounded-lg bg-sky-600 text-white px-4 py-2 text-sm hover:bg-sky-700 disabled:opacity-50"
          >
            {loading ? "思考中…" : "送出"}
          </button>
        </div>
      </section>
    </div>
  )
}
