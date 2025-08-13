import "./globals.css"
import { ReactNode } from "react"

export const metadata = {
  title: "AI Copilot Pro｜永傳家族傳承教練",
  description: "不只是會聊天的 AI，而是懂保險、會算稅、能幫你成交的傳承策略助理。"
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body className="min-h-dvh antialiased text-slate-800">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <header className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-semibold">
              永傳家族傳承教練｜<span className="text-sky-700">AI Copilot Pro</span>
            </h1>
            <nav className="text-sm space-x-4">
              <a href="/" className="hover:underline">首頁</a>
              <a href="/copilot" className="hover:underline">Copilot</a>
            </nav>
          </header>
          {children}
          <footer className="mt-10 text-xs text-slate-500">
            《影響力》傳承策略平台｜永傳家族辦公室｜gracefo.com
          </footer>
        </div>
      </body>
    </html>
  )
}
