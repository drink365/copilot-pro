"use client"

import React, { useEffect, useState } from "react"

type Plan = "free" | "pro" | "pro_plus"

export default function AdminBar({ userEmail }: { userEmail: string | null }) {
  const [secret, setSecret] = useState("")
  const [plan, setPlan] = useState<Plan>("free")
  const [msg, setMsg] = useState<string>("")

  const allowedAdmins = ["123@par.tw", "drink365@gmail.com"]

  async function refreshPlan() {
    try {
      const res = await fetch("/api/debug", { cache: "no-store" })
      const j = await res.json()
      if (j?.plan) setPlan(j.plan as Plan)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    refreshPlan()
  }, [])

  async function switchPlan(next: Plan) {
    setMsg("")
    try {
      const url = `/api/dev/pro?secret=${encodeURIComponent(secret)}&plan=${encodeURIComponent(next)}`
      const res = await fetch(url, { method: "GET" })
      const j = await res.json()
      if (!res.ok || !j?.ok) {
        setMsg(j?.error || `切換失敗（${res.status}）`)
      } else {
        setMsg(`已切換為：${next}`)
        await refreshPlan()
      }
    } catch (e: any) {
      setMsg(e?.message || "發生錯誤")
    }
  }

  // 沒有登入或不是管理員 → 不顯示
  if (!userEmail || !allowedAdmins.includes(userEmail)) {
    return null
  }

  return (
    <div className="fixed z-50 top-3 right-3 bg-white/90 backdrop-blur rounded-2xl border border-slate-200 shadow p-3 flex items-center gap-2 text-sm">
      <span className="px-2 py-1 rounded-full border bg-slate-50 text-slate-700">
        目前方案：<b className={plan === "free" ? "text-slate-700" : "text-sky-600"}>{plan}</b>
      </span>

      <input
        type="password"
        value={secret}
        onChange={(e) => setSecret(e.target.value)}
        placeholder="輸入 ADMIN_SECRET"
        className="w-44 rounded-lg border border-slate-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-sky-500"
      />

      <button
        onClick={() => switchPlan("pro")}
        className="rounded-lg px-3 py-1 bg-sky-600 text-white hover:bg-sky-700"
      >
        切換 Pro
      </button>

      <button
        onClick={() => switchPlan("free")}
        className="rounded-lg px-3 py-1 border border-slate-300 hover:bg-slate-50"
      >
        切回 Free
      </button>

      {msg ? <span className="ml-1 text-slate-500">{msg}</span> : null}
    </div>
  )
}
