// app/layout.tsx
import "./globals.css"
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "AI Copilot Pro",
  description: "永傳家族傳承教練",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body className={`${inter.className} bg-slate-50 text-slate-800`}>
        {children}
      </body>
    </html>
  )
}
