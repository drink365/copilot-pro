// app/pricing/page.tsx
"use client"

import { useMemo, useState } from "react"
import Link from "next/link"

type PayMethod = "Credit" | "CVS" | "ATM"
type Period = "monthly" | "yearly"
type PlanId = "free" | "pro" | "pro_plus"

const FEATURES = {
  free: [
    "每日 3 次對話（防濫用）",
    "6 個基礎情境模板",
    "Markdown 輸出（無匯出）",
  ],
  pro: [
    "無限對話（公平使用）",
    "20+ 進階模板與話術庫",
    "一鍵匯出 PDF / PPT 提案",
    "優先運算資源",
  ],
  pro_plus: [
    "Pro 全部功能",
    "私有知識庫（文件上傳 × 問答）",
    "自訂模板收藏 / 團隊分享",
    "品牌化匯出（去平台 Logo）",
  ],
}

const PRICES_TWD = {
  pro: { monthly: 490, yearly: 4900 },
  pro_plus: { monthly: 890, yearly: 8900 },
}

function Check({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/90 text-white text-[10px]">✓</span>
      <span className="text-sm text-slate-700">{children}</span>
    </li>
  )
}

function Tier({
  name,
  price,
  period,
  highlight,
  features,
  cta,
  subtext,
}: {
  name: string
  price?: number
  period?: Period
  highlight?: boolean
  features: string[]
  cta: React.ReactNode
  subtext?: string
}) {
  return (
    <div className={`relative rounded-2xl border ${highlight ? "border-brand-600" : "border-slate-200"} bg-white p-5 shadow-sm`}>
      {highlight && (
        <span className="absolute -top-3 right-5 rounded-full bg-brand-600 px-2.5 py-1 text-xs font-medium text-white shadow">熱銷</span>
      )}
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-900">{name}</h3>
        {typeof price === "number" ? (
          <div className="mt-1 flex items-baseline gap-1">
            <div className="text-2xl font-bold text-slate-900">NT$ {price.toLocaleString()}</div>
            <div className="text-xs text-slate-500">/ {period === "yearly" ? "年" : "月"}</div>
          </div>
        ) : (
          <div className="mt-1 text-2xl font-bold text-slate-900">FREE</div>
        )}
        {subtext && <div className="mt-1 text-xs text-slate-500">{subtext}</div>}
      </div>

      <ul className="space-y-2">
        {features.map((f, i) => <Check key={i}>{f}</Check>)}
      </ul>

      <div className="mt-5">
        {cta}
      </div>
    </div>
  )
}

export default function PricingPage() {
  const [period, setPeriod] = useState<Period>("monthly")
  const [method, setMethod] = useState<PayMethod>("Credit")

  const proPrice = useMemo(() => PRICES_TWD.pro[period], [period])
  const proPlusPrice = useMemo(() => PRICES_TWD.pro_plus[period], [period])

  async function upgrade(plan: PlanId) {
    if (plan === "free") { window.location.href = "/copilot"; return }
    try {
      const res = await fetch("/api/ecpay/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, plan, period }),
      })
      const data = await res.json()
      if (!res.ok || !data.html) {
        alert(data?.error || "建立金流連線失敗")
        return
      }
      const w = window.open("", "_blank")
      if (!w) { alert("請允許彈出視窗"); return }
      w.document.open(); w.document.write(data.html); w.document.close()
    } catch (e: any) {
      alert(e?.message || "未知錯誤，請稍後再試")
    }
  }

  return (
    <main className="max-w-6xl mx-auto p-4 sm:p-8">
      <header className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold">方案與費用</h1>
            <p className="text-sm text-slate-600 mt-1">
              針對保險經紀人、理財顧問與家族辦公室打造的 AI Copilot。情境模板 × 法稅風險提醒 × 一鍵提案匯出。
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button
                className={`px-3 py-1.5 text-sm rounded-lg ${period === "monthly" ? "bg-white shadow border" : "text-slate-600"}`}
                onClick={() => setPeriod("monthly")}
              >
                月付
              </button>
              <button
                className={`px-3 py-1.5 text-sm rounded-lg ${period === "yearly" ? "bg-white shadow border" : "text-slate-600"}`}
                onClick={() => setPeriod("yearly")}
              >
                年付
              </button>
            </div>
            <select
              value={method}
              onChange={e => setMethod(e.target.value as PayMethod)}
              className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
              title="付款方式"
            >
              <option value="Credit">信用卡</option>
              <option value="CVS">超商代碼</option>
              <option value="ATM">ATM 轉帳</option>
            </select>
          </div>
        </div>
      </header>

      <section className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Free */}
        <Tier
          name="Free"
          features={FEATURES.free}
          cta={
            <button
              onClick={() => upgrade("free")}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50"
            >
              立即體驗
            </button>
          }
          subtext="每日 3 次對話，基礎模板"
        />

        {/* Pro */}
        <Tier
          name="Pro"
          price={proPrice}
          period={period}
          highlight
          features={FEATURES.pro}
          cta={
            <button
              onClick={() => upgrade("pro")}
              className="w-full rounded-xl bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700 shadow"
            >
              升級 Pro（{method === "Credit" ? (period === "yearly" ? "年付" : "月付") : (method === "CVS" ? "超商" : "ATM")}）
            </button>
          }
          subtext={period === "yearly" ? "年繳最划算" : undefined}
        />

        {/* Pro+ */}
        <Tier
          name="Pro+"
          price={proPlusPrice}
          period={period}
          features={FEATURES.pro_plus}
          cta={
            <button
              onClick={() => upgrade("pro_plus")}
              className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm text-white hover:bg-black shadow"
            >
              升級 Pro+（{method === "Credit" ? (period === "yearly" ? "年付" : "月付") : (method === "CVS" ? "超商" : "ATM")}）
            </button>
          }
          subtext="含私有知識庫與品牌化匯出"
        />
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-800">如何運作？</h2>
        <ol className="mt-2 list-decimal pl-4 text-sm text-slate-700 space-y-1">
          <li>選擇方案與付款方式，完成付款（信用卡建議使用訂閱；CVS/ATM 建議購買年卡或點數包）。</li>
          <li>綠界完成授權後，系統自動導回本網站並驗證；成功即解鎖 Pro / Pro+ 功能。</li>
          <li>在 <Link href="/copilot" className="text-brand-700 underline">/copilot</Link> 立即使用進階模板、提案匯出、（Pro+）私有知識庫。</li>
        </ol>
        <p className="mt-2 text-xs text-slate-500">* 生成內容為教育用途與建議草稿，非個別投資/稅務/法律意見；落地前請由專業人士覆核。</p>
      </section>
    </main>
  )
}
