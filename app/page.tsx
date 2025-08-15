// app/page.tsx
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-[calc(100dvh-120px)]">
      <section className="bg-gradient-to-br from-emerald-50 to-white">
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <h1 className="text-3xl md:text-5xl font-semibold leading-tight">
              永傳家族辦公室｜<span className="text-emerald-700">傳承您的影響力</span>
            </h1>
            <p className="text-gray-700 text-lg">
              專為高資產家庭與創辦人打造的「規劃型」平台：用數據試算、情境引導與顧問語言，讓決策更安心、更有效率。
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/tools/compare" className="px-5 py-3 rounded-xl bg-black text-white hover:opacity-90">📊 3 方案比較</Link>
              <Link href="/tools/estate" className="px-5 py-3 rounded-xl border hover:bg-gray-50">🏛️ 遺產稅試算</Link>
              <Link href="/tools/gift" className="px-5 py-3 rounded-xl border hover:bg-gray-50">🎁 贈與稅試算</Link>
              <Link href="/book" className="px-5 py-3 rounded-xl border hover:bg-gray-50">📅 線上預約</Link>

            </div>
            <p className="text-sm text-gray-500">
              專業提醒：本平台提供「粗估與引導」，實際申報須依申報時點法令、資產價值與身分條件計算。
            </p>
          </div>
          <div className="rounded-3xl border bg-white p-6 shadow-sm">
            <ul className="space-y-4">
              <li className="flex gap-3"><span>✅</span><span>以「保單作為稅源把手」，20% 保費守護 100% 資產</span></li>
              <li className="flex gap-3"><span>✅</span><span>結合信託分批給付，兼顧家族和諧與控管</span></li>
              <li className="flex gap-3"><span>✅</span><span>逐年贈與＋多名受贈人，長期有效降低稅基</span></li>
              <li className="flex gap-3"><span>✅</span><span>試算 → 方案 → 一鍵預約，談案效率大幅提升</span></li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
