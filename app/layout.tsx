// app/layout.tsx
import "./globals.css";
import { Inter } from "next/font/google";
import Link from "next/link";
import { BRAND } from "@/lib/config";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: BRAND.NAME,
  description: `${BRAND.NAME} AI Copilot`,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          {/* 主體內容 */}
          <main className="flex-1">{children}</main>

          {/* 頁尾 */}
          <footer className="border-t bg-gray-50 text-gray-600 text-sm">
            <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              {/* 版權 */}
              <div>
                © {new Date().getFullYear()} {BRAND.NAME}. All rights reserved.
              </div>

              {/* 法遵連結 */}
              <nav className="flex gap-4">
                <Link
                  href="/privacy"
                  className="hover:text-gray-900 transition-colors"
                >
                  隱私權政策
                </Link>
                <Link
                  href="/terms"
                  className="hover:text-gray-900 transition-colors"
                >
                  服務條款
                </Link>
                <Link
                  href="/contact"
                  className="hover:text-gray-900 transition-colors"
                >
                  聯絡我們
                </Link>
              </nav>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
