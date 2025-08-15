// app/tools/compare/page.tsx
"use client";
import { useState } from "react";
import CalculatorCard from "@/components/CalculatorCard";

type EstateRes = { deductions:{total:number}; taxableEstate:number; tax:number; bracket:10|15|20; };
type CompareRes = {
  baseline: EstateRes;
  giftingPlan: EstateRes & { totalGiftFree:number };
  comboPlan: EstateRes & { totalGiftFree:number; note:string };
};

export default function CompareTool() {
  const [grossEstate, setGrossEstate] = useState<number>(300_000_000);
  const [numChildren, setNumChildren] = useState<number>(3);
  const [includeSpouse, setIncludeSpouse] = useState<boolean>(true);
  const [years, setYears] = useState<number>(10);
  const [recipients, setRecipients] = useState<number>(4); // 例：配偶+3子女
  const [res, setRes] = useState<CompareRes | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    const r = await fetch("/api/tax/compare", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ grossEstate, numChildren, includeSpouse, years, recipients }),
    });
    setRes(await r.json());
    setLoading(false);
  };

  const block = (title: string, data?: EstateRes & { totalGiftFree?: number }) => (
    <div className="rounded-xl border p-4 space-y-1">
      <div className="font-medium">{title}</div>
      {data ? (
        <>
          {"totalGiftFree" in data && <div>累計免稅贈與：<b>{(data as any).totalGiftFree?.toLocaleString() ?? 0}</b></div>}
          <div>課稅遺產：<b>{data.taxableEstate.toLocaleString()}</b></div>
          <div>級距：<b>{data.bracket}%</b></div>
          <div className="text-lg">預估遺產稅：<b className="text-emerald-700">{data.tax.toLocaleString()} 元</b></div>
        </>
      ) : <div className="text-gray-500">—</div>}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-6">
      <CalculatorCard title="📊 現況 vs. 逐年贈與 vs. 組合方案（贈與＋保險＋信託）" footer={
        <button onClick={run} disabled={loading} className="px-4 py-2 rounded-xl bg-black text-white hover:opacity-90">
          {loading ? "計算中..." : "產生比較"}
        </button>
      }>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="flex flex-col gap-1">
            <span>遺產總額（元）</span>
            <input type="number" value={grossEstate} onChange={e=>setGrossEstate(Number(e.target.value))}
              className="rounded-lg border p-2"/>
          </label>
          <label className="flex flex-col gap-1">
            <span>年數（逐年贈與）</span>
            <input type="number" min={1} value={years} onChange={e=>setYears(Number(e.target.value))}
              className="rounded-lg border p-2"/>
          </label>
          <label className="flex flex-col gap-1">
            <span>受贈人數</span>
            <input type="number" min={1} value={recipients} onChange={e=>setRecipients(Number(e.target.value))}
              className="rounded-lg border p-2"/>
          </label>
          <label className="flex flex-col gap-1">
            <span>子女人數</span>
            <input type="number" min={0} value={numChildren} onChange={e=>setNumChildren(Number(e.target.value))}
              className="rounded-lg border p-2"/>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={includeSpouse} onChange={e=>setIncludeSpouse(e.target.checked)}/>
            <span>包含配偶扣除</span>
          </label>
        </div>

        {res && (
          <div className="grid md:grid-cols-3 gap-4">
            {block("現況不規劃", res.baseline)}
            {block("逐年贈與", res.giftingPlan)}
            <div className="space-y-2">
              {block("組合方案", res.comboPlan)}
              <div className="text-sm text-gray-500">說明：組合方案以「較積極贈與＋保險預留稅源／信託控管」為示意，用於會談引導。</div>
            </div>
          </div>
        )}
      </CalculatorCard>
    </div>
  );
}
