// app/tools/estate/page.tsx
"use client";
import { useEffect, useState } from "react";

type EstateRes = { gross:number; deductions:number; taxableEstate:number; bracket:10|15|20; tax:number };

export default function EstateTool() {
  const [grossEstate, setGrossEstate] = useState<number>(300_000_000);
  const [includeSpouse, setIncludeSpouse] = useState<boolean>(true);
  const [extra, setExtra] = useState<number>(0);
  const [res, setRes] = useState<EstateRes | null>(null);

  const n = (x:number)=> x.toLocaleString();

  useEffect(() => {
    const run = async () => {
      const r = await fetch("/api/tax/estate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grossEstate, includeSpouse, extraDeductions: extra }),
      });
      const data = await r.json();
      if (r.ok) setRes(data);
    };
    run();
  }, [grossEstate, includeSpouse, extra]);

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <h1 className="text-2xl font-semibold">🏛️ 遺產稅試算</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1">
          <span>遺產總額（元）</span>
          <input type="number" className="rounded-lg border p-2" value={grossEstate}
                 onChange={e=>setGrossEstate(Number(e.target.value))}/>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={includeSpouse} onChange={e=>setIncludeSpouse(e.target.checked)}/>
          <span>包含配偶扣除（553 萬）</span>
        </label>
        <label className="flex flex-col gap-1">
          <span>其他扣除（元，可選）</span>
          <input type="number" className="rounded-lg border p-2" value={extra}
                 onChange={e=>setExtra(Number(e.target.value))}/>
        </label>
      </div>

      {res && (
        <div className="rounded-2xl border bg-white p-6 space-y-2">
          <div>總額：<b>{n(res.gross)}</b></div>
          <div>扣除合計：<b>{n(res.deductions)}</b>（含免稅額 1,200 萬、喪葬 138 萬、配偶 553 萬）</div>
          <div>課稅遺產：<b>{n(res.taxableEstate)}</b></div>
          <div>稅率：<b>{res.bracket}%</b></div>
          <div>預估遺產稅：<b className="text-emerald-700">{n(res.tax)}</b></div>
        </div>
      )}
    </div>
  );
}
