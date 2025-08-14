// app/layout.tsx
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import React from "react"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
})

// ---- 站點基本資訊（可依需求修改）----
export const metadata: Metadata = {
  title: "AI Copilot Pro｜永傳家族傳承教練",
  description: "用專業又溫暖的方式，快速產出傳承與保單提案內容。",
  // 你也可以補充其他 SEO 欄位：
  // openGraph: { title: "...", description: "...", url: "https://copilot-pro.vercel.app" },
  // icons: [{ rel: "icon", url: "/favicon.ico" }]
}

// ---- 根版型 ----
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant" suppressHydrationWarning>
      <body className={`${inter.className} bg-slate-50 text-slate-800`}>
        {children}
      </body>
    </html>
  )
}
