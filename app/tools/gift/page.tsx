// app/tools/gift/page.tsx
"use client";
import { useEffect, useState } from "react";

export default function GiftTool() {
  const [years, setYears] = useState<number>(10);
  const [recipients, setRecipients] = useState<number>(4);
  const [grossEstate, setGrossEstate] = useState<number>(300_000_000);
  const [res, setRes] = useState<any>(null);

  const n = (x:number)=> x.toLocaleString();

  useEffect(() => {
    const run = async () => {
      const r = await fetch("/api/tax/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grossEstate, years, recipients }),
      });
      const data = await r.json();
      if (r.ok) setRes(data);
    };
    run();
  }, [years, recipients, grossEstate]);

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <h1 className="text-2xl font-semibold">🎁 贈與免稅模擬</h1>
      <div className="grid md:grid-cols-3 gap-4">
        <label className="flex flex-col gap-1">
          <span>逐年贈與年數</span>
          <input type="number" className="rounded-lg border p-2" value={years}
                 onChange={e=>setYears(Number(e.target.value))}/>
        </label>
        <label className="flex flex-col gap-1">
          <span>受贈人數</span>
          <input type="number" className="rounded-lg border p-2" value={recipients}
                 onChange={e=>setRecipients(Number(e.target.value))}/>
        </label>
        <label className="flex flex-col gap-1">
          <span>遺產總額（元）</span>
          <input type="number" className="rounded-lg border p-2" value={grossEstate}
                 onChange={e=>setGrossEstate(Number(e.target.value))}/>
        </label>
      </div>

      {res && (
        <div className="rounded-2xl border bg-white p-6 space-y-2">
          <div>逐年免稅贈與（累計，B/C 方案）：<b>{n(res.giftingPlan.totalGiftFree)}</b></div>
          <div>（依 244 萬/人/年 × 受贈人數 × 年數 計算，上限為遺產總額）</div>
        </div>
      )}
    </div>
  );
}
