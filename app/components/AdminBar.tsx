// app/components/AdminBar.tsx
"use client"

import { useEffect, useState } from "react"

export default function AdminBar({ enabled = false }: { enabled?: boolean }) {
  const [key, setKey] = useState("")
  const [isPro, setIsPro] = useState<boolean | null>(null)
  const [msg, setMsg] = useState<string>("")

  useEffect(() => {
    const k = localStorage.getItem("ADMIN_SECRET") || ""
    setKey(k)
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function refresh() {
    try {
      const r = await fetch("/api/debug", { cache: "no-store" })
      const d = await r.json()
      setIsPro(!!d.isPro)
    } catch {
      setIsPro(null)
    }
  }

  async function toggle(mode: "on" | "off") {
    if (!key) return setMsg("請先輸入 ADMIN_SECRET")
    setMsg("處理中…")
    try {
      const r = await fetch(`/api/dev/pro?key=${encodeURIComponent(key)}&mode=${mode}`)
      const d = await r.json()
      if (d.ok) {
        localStorage.setItem("ADMIN_SECRET", key)
        await refresh()
        setMsg(mode === "on" ? "已解鎖 Pro（此瀏覽器）" : "已還原為免費（此瀏覽器）")
      } else {
        setMsg(d.error || "操作失敗")
      }
    } catch (e: any) {
      setMsg(e?.message || "操作失敗")
    }
  }

  if (!enabled) return null

  return (
    <div className="fixed inset-x-0 top-0 z-50 bg-amber-50/95 backdrop-blur border-b border-amber-200 text-amber-900">
      <div className="mx-auto max-w-6xl px-3 py-2 flex items-center gap-2 text-sm">
        <span className="font-semibold">Admin</span>
        <span className="text-xs text-amber-700">（僅測試用）</span>
        <div className="flex items-center gap-2 ml-auto">
          <input
            value={key}
            onChange={e => setKey(e.target.value)}
            placeholder="輸入 ADMIN_SECRET"
            className="rounded border border-amber-300 bg-white px-2 py-1 text-xs min-w-[240px] shadow-sm"
          />
          <button onClick={() => toggle("on")} className="rounded bg-amber-600 text-white px-2 py-1 text-xs hover:bg-amber-700">
            解鎖 Pro
          </button>
          <button onClick={() => toggle("off")} className="rounded border border-amber-400 px-2 py-1 text-xs hover:bg-amber-100">
            還原免費
          </button>
          <span className="text-xs ml-2">
            狀態：{isPro === null ? "未知" : isPro ? "已是 Pro" : "免費"}
          </span>
          {msg && <span className="text-xs ml-2 text-amber-700">{msg}</span>}
        </div>
      </div>
    </div>
  )
}
