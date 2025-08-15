// app/layout.tsx
import type { Metadata } from "next"
import "./globals.css"
import AdminBar from "./components/AdminBar"

export const metadata: Metadata = {
  title: "家族傳承 Copilot",
  description: "以準備與從容為核心的家族財富管理助手",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body className="bg-slate-50 text-slate-800">
        {/* 右上角管理工具列（Pro/Free 切換） */}
        <AdminBar />
        {/* 主要頁面內容 */}
        {children}
      </body>
    </html>
  )
}
