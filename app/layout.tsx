import type { Metadata } from "next"
import "./globals.css"
import BrandHeader from "./components/BrandHeader"
import AdminBar from "./components/AdminBar"

export const metadata: Metadata = {
  title: "永傳家族辦公室｜家族傳承 Copilot",
  description: "以準備與從容為核心的家族財富管理助手"
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body className="bg-slate-50 text-slate-800">
        <BrandHeader />
        <AdminBar />
        <main className="mx-auto max-w-5xl px-4 py-6">
          {children}
        </main>
        <footer className="mt-12 border-t border-slate-200 bg-white/70">
          <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>© {new Date().getFullYear()} 永傳家族辦公室 YongChuan Family Office</div>
            <div className="flex items-center gap-4">
              <a href="/privacy" className="hover:text-[var(--brand-red)]">隱私權政策</a>
              <a href="/terms" className="hover:text-[var(--brand-red)]">服務條款</a>
              <a href="/contact" className="hover:text-[var(--brand-red)]">聯絡我們</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
