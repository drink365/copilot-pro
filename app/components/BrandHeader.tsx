// app/components/BrandHeader.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/flow/start", label: "互動模擬" },
  { href: "/tools/compare", label: "工具" },
  { href: "/book", label: "預約諮詢" },
  { href: "/pro/login", label: "顧問登入" },
];

export default function BrandHeader() {
  const pathname = usePathname();

  return (
    <header className="border-b bg-white">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* 品牌名稱 */}
        <Link href="/" className="text-lg font-semibold text-gray-900">
          永傳家族辦公室
        </Link>

        {/* 導覽列 */}
        <nav className="flex gap-6">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium hover:text-gray-900 transition-colors",
                  isActive ? "text-gray-900" : "text-gray-500"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
