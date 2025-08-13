// app/copilot/page.tsx
"use client"

import { useEffect, useRef, useState } from "react"
import { templates, quickActions } from "./templates"

type Msg = { role: "user" | "assistant"; content: string }

export default function CopilotPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "嗨，我是你的傳承策略助理。可直接點選上方『情境模板』或輸入你的客戶情境（如：企業接班、跨境資產、醫療長照）。" }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [isPro, setIsPro] = useState<boolean>(false)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" })
  }, [messages])

  // 回跳驗證：Stripe 成功付款會帶回 session_id
  useEffect(() => {
    const u = new URL(window.location.href)
    const sid = u.searchParams.get("session_id")
    if (sid) {
      fetch(`/api/stripe/verify?session_id=${sid}`)
        .then(r => r.json())
        .then(d => {
          if (d.ok) {
            setIsPro(true)
            alert("升級成功！已解鎖專業版。")
          } else {
            alert(d.error || "驗證失敗")
          }
          u.searchParams.delete("session_id")
          window.history.replaceState({}, "", u.toString())
        })
        .catch(() => alert("驗證時發生錯誤"))
    } else {
      // 啟動時讀取 debug 判斷是否已是 Pro（透過 Cookie）
      fetch("/api/debug").then(r => r.json()).then(d => setIsPro(!!d.isPro)).catch(() => {})
    }
  }, [])

  async function upgrade() {
    const res = await fetch("/api/stripe/checkout", { method: "POST" })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else alert(data.error || "建立結帳連結失敗")
  }

  async function openPortal() {
    const r = await fetch("/api/stripe/portal", { method: "POST" })
    const d = await r.json()
    if (d.url) window.location.href = d.url
    else alert(d.error || "開啟訂閱管理失敗")
  }

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
      // 從回傳同步是否為 Pro（非必要）
      if (typeof data.isPro === "boolean") setIsPro(!!data.isPro)
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
      {/* 頂部狀態與按鈕 */}
      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <div className="font-semibold text-slate-800">
              {isPro ? "專業版：已解鎖" : "目前：免費版（每日 3 次）"}
            </div>
            {!isPro && <div className="text-xs text-slate-500 mt-1">升級可解鎖：無限對話、更多模板、未來提案 PDF/PPT 匯出與私人知識庫</div>}
          </div>
          <div className="flex gap-2">
            {!isPro && (
              <button onClick={upgrade} className="rounded-lg bg-amber-600 px-3 py-1.5 text-white text-sm hover:bg-amber-700">
                升級專業版
              </button>
            )}
            {isPro && (
              <button onClick={openPortal} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-100">
                管理訂閱
              </button>
            )}
          </div>
        </div>
      </section>

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
