// app/components/BrandHeader.tsx
"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useState } from "react"

const nav = [
  { href: "/", label: "首頁" },
  { href: "/copilot", label: "Copilot" },
  { href: "/tax", label: "稅務試算" },
  { href: "/pricing", label: "方案" },
]

export default function BrandHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto max-w-5xl px-4 py-2 flex items-center justify-between">
        {/* 左：Logo 與品牌名 */}
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="/brand/logo.png"
            alt="永傳家族辦公室"
            width={180}
            height={40}
            priority
            className="h-8 w-auto"
          />
          <span className="hidden sm:flex flex-col leading-tight">
            <span className="text-[13px] text-slate-500">Family Office</span>
            <span className="text-[15px] font-semibold tracking-wide text-[var(--brand-dark)]">
              永傳家族辦公室
            </span>
          </span>
        </Link>

        {/* 右：導覽 */}
        <nav className="hidden md:flex items-center gap-1">
          {nav.map((n) => {
            const active = pathname === n.href
            return (
              <Link
                key={n.href}
                href={n.href}
                className={[
                  "px-3 py-1.5 rounded-lg text-sm transition-colors",
                  active
                    ? "bg-[var(--brand-red)] text-white"
                    : "text-slate-700 hover:bg-slate-100"
                ].join(" ")}
              >
                {n.label}
              </Link>
            )
          })}
        </nav>

        {/* 行動版選單 */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-300"
          aria-label="開啟選單"
        >
          ☰
        </button>
      </div>

      {/* 行動版下拉 */}
      {open && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-5xl px-4 py-2 flex flex-col gap-1">
            {nav.map((n) => {
              const active = pathname === n.href
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className={[
                    "px-3 py-2 rounded-lg text-sm",
                    active
                      ? "bg-[var(--brand-red)] text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  ].join(" ")}
                >
                  {n.label}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </header>
  )
}
