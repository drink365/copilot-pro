// app/tools/estate/page.tsx
"use client";
import { useState } from "react";
import CalculatorCard from "@/components/CalculatorCard";

type Result = {
  deductions:{ base:number; spouse:number; children:number; funeral:number; total:number; };
  taxableEstate:number; tax:number; bracket:10|15|20;
}

export default function EstateTool() {
  const [grossEstate, setGrossEstate] = useState<number>(300_000_000);
  const [numChildren, setNumChildren] = useState<number>(3);
  const [includeSpouse, setIncludeSpouse] = useState<boolean>(true);
  const [includeFuneral, setIncludeFuneral] = useState<boolean>(true);
  const [res, setRes] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    const r = await fetch("/api/tax/estate", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ grossEstate, numChildren, includeSpouse, includeFuneralDeduction: includeFuneral }),
    });
    setRes(await r.json());
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
      <CalculatorCard title="🇹🇼 遺產稅粗估（台灣）" footer={
        <button onClick={run} disabled={loading} className="px-4 py-2 rounded-xl bg-black text-white hover:opacity-90">
          {loading ? "計算中..." : "開始計算"}
        </button>
      }>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span>遺產總額（元）</span>
            <input type="number" value={grossEstate} onChange={e=>setGrossEstate(Number(e.target.value))}
              className="input input-bordered rounded-lg border p-2"/>
          </label>
          <label className="flex flex-col gap-1">
            <span>子女人數</span>
            <input type="number" value={numChildren} onChange={e=>setNumChildren(Number(e.target.value))}
              className="input input-bordered rounded-lg border p-2"/>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={includeSpouse} onChange={e=>setIncludeSpouse(e.target.checked)}/>
            <span>配偶扣除（553 萬）</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={includeFuneral} onChange={e=>setIncludeFuneral(e.target.checked)}/>
            <span>喪葬費扣除（138 萬）</span>
          </label>
        </div>

        {res && (
          <div className="rounded-xl bg-gray-50 p-4 space-y-2">
            <div>扣除合計：<b>{res.deductions.total.toLocaleString()}</b>（基本 {res.deductions.base.toLocaleString()}＋配偶 {res.deductions.spouse.toLocaleString()}＋子女 {res.deductions.children.toLocaleString()}＋喪葬 {res.deductions.funeral.toLocaleString()}）</div>
            <div>課稅遺產：<b>{res.taxableEstate.toLocaleString()}</b></div>
            <div>適用級距：<b>{res.bracket}%</b></div>
            <div className="text-lg">預估遺產稅：<b className="text-emerald-700">{res.tax.toLocaleString()} 元</b></div>
          </div>
        )}
      </CalculatorCard>
    </div>
  );
}
