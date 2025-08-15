// app/tools/gift/page.tsx
"use client";
import { useState } from "react";
import CalculatorCard from "@/components/CalculatorCard";

type Result = { taxableGift: number; tax: number; bracket: 10 | 15 | 20 };

export default function GiftTool() {
  const [giftAmount, setGiftAmount] = useState<number>(5_000_000);
  const [useEx, setUseEx] = useState<boolean>(true);
  const [res, setRes] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    const r = await fetch("/api/tax/gift", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ giftAmount, useAnnualExemption: useEx }),
    });
    setRes(await r.json());
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
      <CalculatorCard
        title="🇹🇼 贈與稅試算（年度免稅 244 萬）"
        footer={
          <button
            onClick={run}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-black text-white hover:opacity-90"
          >
            {loading ? "計算中..." : "開始計算"}
          </button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span>贈與金額（元）</span>
            <input
              type="number"
              value={giftAmount}
              onChange={(e) => setGiftAmount(Number(e.target.value))}
              className="rounded-lg border p-2"
            />
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={useEx}
              onChange={(e) => setUseEx(e.target.checked)}
            />
            <span>先扣年度免稅額（244 萬）</span>
          </label>
        </div>

        {res && (
          <div className="rounded-xl bg-gray-50 p-4 space-y-2">
            <div>課稅贈與額：<b>{res.taxableGift.toLocaleString()}</b></div>
            <div>適用級距：<b>{res.bracket}%</b></div>
            <div className="text-lg">預估贈與稅：<b className="text-emerald-700">{res.tax.toLocaleString()} 元</b></div>
          </div>
        )}
      </CalculatorCard>
    </div>
  );
}
