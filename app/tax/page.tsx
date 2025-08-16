// app/tax/page.tsx
import Link from "next/link";

export default function LegacyTaxPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-4">
      <h1 className="text-2xl font-semibold">（舊版）稅務試算</h1>
      <div className="rounded-xl border bg-yellow-50 p-4 text-sm">
        這是舊版頁面，建議改用新版工具：
        <Link className="underline ml-2" href="/tools/estate">遺產稅試算</Link>、
        <Link className="underline ml-2" href="/tools/gift">贈與稅試算</Link>、
        <Link className="underline ml-2" href="/tools/compare">三方案比較</Link>
      </div>
    </div>
  );
}
