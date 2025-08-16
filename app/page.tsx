// app/page.tsx
import Link from "next/link";

export default function Home() {
  return (
    <section className="bg-gradient-to-br from-emerald-50 to-white min-h-[60vh]">
      <div className="max-w-6xl mx-auto px-6 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
        <div className="space-y-6">
          <h1 className="text-3xl md:text-5xl font-semibold leading-tight">
            永傳家族辦公室｜<span className="text-emerald-700">傳承您的影響力</span>
          </h1>
          <p className="text-gray-700 text-lg">
            30 年專業 + AI 智能。用互動模擬 → 報告寄送 → 顧問 AI 陪伴，讓決策更安心、更有效率。
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/flow/start" className="px-5 py-3 rounded-xl bg-black text-white hover:opacity-90">🧭 互動版：傳承路徑模擬</Link>
            <Link href="/tools/compare" className="px-5 py-3 rounded-xl border hover:bg-gray-50">📊 3 方案比較</Link>
            <Link href="/tools/estate" className="px-5 py-3 rounded-xl border hover:bg-gray-50">🏛️ 遺產稅試算</Link>
            <Link href="/tools/gift" className="px-5 py-3 rounded-xl border hover:bg-gray-50">🎁 贈與稅試算</Link>
            <Link href="/book" className="px-5 py-3 rounded-xl border hover:bg-gray-50">📅 線上預約</Link>
          </div>
          <p className="text-sm text-gray-500">
            專業提醒：本平台提供「粗估與引導」，實際申報須依申報時點法令、資產價值與身分條件計算。
          </p>
        </div>
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <ul className="space-y-3 text-sm">
            <li className="flex gap-3"><span>✅</span><span>保單＝稅源把手：20% 保費守護 100% 資產</span></li>
            <li className="flex gap-3"><span>✅</span><span>信託分批給付，兼顧家族和諧與控管</span></li>
            <li className="flex gap-3"><span>✅</span><span>逐年贈與＋多人受贈，長期降低稅基</span></li>
            <li className="flex gap-3"><span>✅</span><span>互動模擬 → 報告寄送 → 顧問 AI：一條龍體驗</span></li>
          </ul>
        </div>
      </div>
    </section>
  );
}
