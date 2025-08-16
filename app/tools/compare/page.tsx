// app/tools/compare/page.tsx
"use client";
import { useEffect, useState } from "react";

type Compare = {
  baseline: { taxableEstate:number; tax:number; bracket:10|15|20 };
  giftingPlan: { totalGiftFree:number; taxableEstate:number; tax:number; bracket:10|15|20 };
  comboPlan: { totalGiftFree:number; taxableEstate:number; tax:number; bracket:10|15|20 };
};

export default function ComparePage() {
  const [grossEstate, setGrossEstate] = useState<number>(300_000_000);
  const [numChildren, setNumChildren] = useState<number>(3);
  const [includeSpouse, setIncludeSpouse] = useState<boolean>(true);
  const [years, setYears] = useState<number>(10);
  const [recipients, setRecipients] = useState<number>(4);
  const [res, setRes] = useState<Compare | null>(null);
  const [loading, setLoading] = useState(false);

  const n = (x:number)=> x.toLocaleString();

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const r = await fetch("/api/tax/compare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ grossEstate, numChildren, includeSpouse, years, recipients }),
        });
        const data = await r.json();
        if (r.ok) setRes(data);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [grossEstate, numChildren, includeSpouse, years, recipients]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 space-y-6">
      <h1 className="text-2xl font-semibold">📊 三方案比較</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1">
          <span>遺產總額（元）</span>
          <input type="number" className="rounded-lg border p-2"
                 value={grossEstate} onChange={e=>setGrossEstate(Number(e.target.value))}/>
        </label>
        <label className="flex flex-col gap-1">
          <span>子女人數</span>
          <input type="number" className="rounded-lg border p-2"
                 value={numChildren} onChange={e=>setNumChildren(Number(e.target.value))}/>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={includeSpouse} onChange={e=>setIncludeSpouse(e.target.checked)}/>
          <span>包含配偶扣除（553 萬）</span>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span>逐年贈與年數</span>
            <input type="number" className="rounded-lg border p-2"
                   value={years} onChange={e=>setYears(Number(e.target.value))}/>
          </label>
          <label className="flex flex-col gap-1">
            <span>受贈人數</span>
            <input type="number" className="rounded-lg border p-2"
                   value={recipients} onChange={e=>setRecipients(Number(e.target.value))}/>
          </label>
        </div>
      </div>

      {loading && <div className="text-sm text-gray-500">計算中…</div>}

      {res && (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="rounded-xl border p-4">
            <div className="font-medium mb-1">現況不規劃</div>
            <div>課稅遺產：<b>{n(res.baseline.taxableEstate)}</b></div>
            <div>稅率：<b>{res.baseline.bracket}%</b></div>
            <div>預估遺產稅：<b className="text-emerald-700">{n(res.baseline.tax)}</b></div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="font-medium mb-1">逐年贈與</div>
            <div>累計免稅贈與：<b>{n(res.giftingPlan.totalGiftFree)}</b></div>
            <div>課稅遺產：<b>{n(res.giftingPlan.taxableEstate)}</b></div>
            <div>稅率：<b>{res.giftingPlan.bracket}%</b></div>
            <div>預估遺產稅：<b className="text-emerald-700">{n(res.giftingPlan.tax)}</b></div>
          </div>
          <div className="rounded-xl border p-4">
            <div className="font-medium mb-1">組合方案</div>
            <div>累計免稅贈與：<b>{n(res.comboPlan.totalGiftFree)}</b></div>
            <div>課稅遺產：<b>{n(res.comboPlan.taxableEstate)}</b></div>
            <div>稅率：<b>{res.comboPlan.bracket}%</b></div>
            <div>預估遺產稅：<b className="text-emerald-700">{n(res.comboPlan.tax)}</b></div>
          </div>
        </div>
      )}
    </div>
  );
}
