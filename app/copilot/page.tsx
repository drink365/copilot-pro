// app/copilot/page.tsx
"use client"

import { useEffect, useRef, useState } from "react"
import AdminBar from "../components/AdminBar"
import { templates, quickActions } from "./templates"
import MessageBubble from "../components/MessageBubble"

type Msg = { role: "user" | "assistant"; content: string }
type PayMethod = "Credit" | "CVS" | "ATM"

export default function CopilotPage() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "嗨，我是你的傳承策略助理。可點『情境模板』或直接輸入情境（支援 Markdown 排版）。" }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [isPro, setIsPro] = useState<boolean>(false)

  const [method, setMethod] = useState<PayMethod>("Credit")
  const [merchantTradeNo, setMerchantTradeNo] = useState<string>("")
  const [cvsPaymentNo, setCvsPaymentNo] = useState<string>("")
  const [atmBank, setAtmBank] = useState<string>("")
  const [atmAccount, setAtmAccount] = useState<string>("")
  const [expireDate, setExpireDate] = useState<string>("")

  const listRef = useRef<HTMLDivElement>(null)
  useEffect(() => { listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }) }, [messages])

  // Admin 快捷解鎖 + 綠界回跳處理
  useEffect(() => {
    const u = new URL(window.location.href)
    const rtn = u.searchParams.get("RtnCode")
    const mtn = u.searchParams.get("MerchantTradeNo")
    const payType = u.searchParams.get("PaymentType") || ""
    const pNo = u.searchParams.get("PaymentNo") || ""
    const bank = u.searchParams.get("BankCode") || ""
    const va = u.searchParams.get("vAccount") || ""
    const exp = u.searchParams.get("ExpireDate") || ""

    if (rtn === "1") {
      fetch(`/api/ecpay/verify?${u.searchParams.toString()}`)
        .then(r => r.json())
        .then(d => { if (d.ok) { setIsPro(true); alert("升級成功！已解鎖專業版。") } else { alert(d.error || "驗證失敗") } })
        .catch(() => alert("驗證時發生錯誤"))
      clearQuery(); return
    }

    if (mtn) {
      setMerchantTradeNo(mtn)
      if (payType.includes("CVS")) { setMethod("CVS"); setCvsPaymentNo(pNo) }
      else if (payType.includes("ATM")) { setMethod("ATM"); setAtmBank(bank); setAtmAccount(va) }
      if (exp) setExpireDate(exp)
    } else {
      fetch("/api/debug").then(r => r.json()).then(d => setIsPro(!!d.isPro)).catch(() => {})
    }

    function clearQuery() {
      const nu = new URL(window.location.href)
      nu.searchParams.forEach((_, k) => nu.searchParams.delete(k))
      window.history.replaceState({}, "", nu.toString())
    }
  }, [])

  async function upgrade() {
    const res = await fetch("/api/ecpay/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method })
    })
    const data = await res.json()
    if (!res.ok || !data.html) return alert(data.error || "建立金流連線失敗")
    if (data.tradeNo) setMerchantTradeNo(data.tradeNo)
    const w = window.open("", "_blank"); if (!w) return alert("請允許彈出視窗")
    w.document.open(); w.document.write(data.html); w.document.close()
  }

  async function redeem() {
    if (!merchantTradeNo) return alert("缺少訂單編號，請先完成取號或付款流程。")
    const r = await fetch(`/api/ecpay/query?MerchantTradeNo=${encodeURIComponent(merchantTradeNo)}`)
    const d = await r.json()
    if (d.ok && d.paid) { setIsPro(true); alert("已確認入帳，專業版已解鎖！") }
    else alert(d.message || "尚未入帳，請稍後再試。")
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
      if (typeof data.isPro === "boolean") setIsPro(!!data.isPro)
    } catch (e: any) {
      setMessages(prev => [...prev, { role: "assistant", content: `⚠️ ${e.message}` }])
    } finally { setLoading(false) }
  }

  const onSend = async () => { const c = input.trim(); if (!c) return; setInput(""); await send(c) }
  const runTemplate = async (id: string) => { const t = templates.find(x => x.id === id); if (!t) return; await send(t.prompt()) }
  const runQuick = async (p: string) => { await send(p) }

  const showAdmin = process.env.NEXT_PUBLIC_ADMIN_ENABLED === "1" || process.env.NEXT_PUBLIC_VERCEL_ENV !== "production"

  return (
    <>
      <AdminBar enabled={showAdmin} />
      <main className="max-w-6xl mx-auto pt-10 p-4 sm:p-6 space-y-4">
        <header className="bg-white rounded-2xl border border-slate-200 shadow-soft px-5 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg sm:text-xl font-semibold">AI Copilot Pro｜永傳家族傳承教練</h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              {isPro ? "專業版：無限對話與進階模板。" : "目前：免費版（每日 3 次）。升級解鎖無限對話、更多模板、未來 PDF/PPT 匯出與私人知識庫。"}
            </p>
          </div>
          {!isPro && (
            <div className="flex items-center gap-2">
              <select value={method} onChange={(e) => setMethod(e.target.value as PayMethod)} className="rounded-lg border px-2 py-1 text-sm">
                <option value="Credit">信用卡</option>
                <option value="CVS">超商代碼</option>
                <option value="ATM">ATM 轉帳</option>
              </select>
              <button onClick={upgrade} className="rounded-lg bg-brand-600 px-3 py-2 text-white text-sm hover:bg-brand-700 shadow">
                升級專業版（ECPay）
              </button>
            </div>
          )}
        </header>

        {/* 取號資訊 */}
        {!isPro && merchantTradeNo && (
          <section className="bg-white rounded-2xl border border-slate-200 shadow-soft px-5 py-4">
            <div className="text-sm">
              <div className="font-medium">訂單編號：<span className="font-mono">{merchantTradeNo}</span></div>
              {method === "CVS" && cvsPaymentNo && <div className="mt-1">超商繳費代碼：<span className="font-mono">{cvsPaymentNo}</span></div>}
              {method === "ATM" && (atmBank || atmAccount) && (
                <div className="mt-1">銀行代碼：<span className="font-mono">{atmBank}</span>；虛擬帳號：<span className="font-mono">{atmAccount}</span></div>
              )}
              {expireDate && <div className="mt-1 text-xs text-slate-600">繳費期限：{expireDate}</div>}
              <div className="mt-3 flex items-center gap-2">
                <button onClick={redeem} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-100">我已完成付款，解鎖專業版</button>
                <span className="text-xs text-slate-500">（系統會向綠界查詢入帳狀態）</span>
              </div>
            </div>
          </section>
        )}

        {/* 情境模板 */}
        <section className="bg白 rounded-2xl border border-slate-200 shadow-soft px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700">情境模板</h2>
            <span className="text-xs text-slate-500">免費可用；專業版支援更多模板與自訂</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {templates.map(t => (
              <button key={t.id} onClick={() => runTemplate(t.id)} className="text-left rounded-xl border border-slate-200 bg-slate-50 p-3 hover:bg-slate-100 transition shadow-sm">
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
        <section className="bg-white rounded-2xl border border-slate-200 shadow-soft px-5 py-4">
          <div ref={listRef} className="h-[56vh] overflow-y-auto pr-1">
            {messages.map((m, i) => <MessageBubble key={i} role={m.role} content={m.content} />)}
            {loading && <div className="text-sm text-slate-500">思考中…</div>}
          </div>

          <div className="mt-3 flex items-end gap-2">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend() } }}
              rows={1}
              placeholder="輸入你的客戶情境與需求（Shift+Enter 換行，Enter 送出）"
              className="flex-1 rounded-2xl border border-slate-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              style={{ height: "auto" }}
            />
            <button onClick={onSend} disabled={loading} className="rounded-2xl bg-brand-600 px-4 py-2 text白 hover:bg-brand-700 disabled:opacity-50 shadow">
              送出
            </button>
          </div>
        </section>

        <p className="text-xs text-slate-500 text-center">
          免費方案：每日 3 次互動。升級後可解鎖更多模板、提案 PDF/PPT 匯出與私人知識庫。
        </p>
      </main>
    </>
  )
}
