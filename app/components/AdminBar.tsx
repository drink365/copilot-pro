// app/components/AdminBar.tsx
"use client"

import { useEffect, useState } from "react"

export default function AdminBar({ enabled = true }: { enabled?: boolean }) {
  const [key, setKey] = useState("")
  const [isPro, setIsPro] = useState<boolean | null>(null)
  const [msg, setMsg] = useState<string>("")

  async function refresh() {
    try {
      const r = await fetch("/api/debug")
      const d = await r.json()
      setIsPro(!!d.isPro || d.plan === "pro" || d.plan === "pro_plus")
    } catch {
      setIsPro(null)
    }
  }

  useEffect(() => {
    const k = localStorage.getItem("ADMIN_SECRET") || ""
    setKey(k)
    refresh()
  }, [])

  if (!enabled) return null

  async function toggle(mode: "on" | "off") {
    setMsg("")
    try {
      const u = new URL("/api/dev/pro", window.location.origin)
      u.searchParams.set("key", key)
      u.searchParams.set("mode", mode)
      const r = await fetch(u.toString())
      const d = await r.json()
      if (!r.ok) throw new Error(d?.error || "failed")
      setMsg(mode === "on" ? "已解鎖 Pro（30 天）" : "已還原免費")
      await refresh()
    } catch (e: any) {
      setMsg(`錯誤：${e.message}`)
    }
  }

  return (
    <div className="sticky top-0 z-50 bg-amber-50 border-b border-amber-200">
      <div className="mx-auto max-w-5xl flex items-center justify-between px-4 py-2">
        <div className="text-xs text-amber-800">
          管理員模式：輸入 ADMIN_SECRET 可快速切換 Free/Pro 狀態（本機 cookie）。
        </div>
        <div className="flex items-center gap-2">
          <input
            className="rounded border border-amber-400 px-2 py-1 text-xs"
            placeholder="ADMIN_SECRET"
            value={key}
            onChange={(e) => {
              setKey(e.target.value)
              localStorage.setItem("ADMIN_SECRET", e.target.value)
            }}
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
