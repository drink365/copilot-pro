import type { Metadata } from "next"
import "./globals.css"
import AdminBar from "./components/AdminBar"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth" // 依你專案實際位置調整

export const metadata: Metadata = {
  title: "家族傳承 Copilot",
  description: "以AI為核心的家族財富管理助手",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  const userEmail = session?.user?.email ?? null

  return (
    <html lang="zh-Hant">
      <body className="bg-slate-50 text-slate-800">
        <AdminBar userEmail={userEmail} />
        {children}
      </body>
    </html>
  )
}
