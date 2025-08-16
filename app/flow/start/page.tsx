// app/flow/start/page.tsx
"use client";
import { useEffect, useState } from "react";

type CompareRes = {
  baseline: { taxableEstate:number; tax:number; bracket:10|15|20 };
  giftingPlan: { taxableEstate:number; tax:number; bracket:10|15|20; totalGiftFree:number };
  comboPlan:   { taxableEstate:number; tax:number; bracket:10|15|20; totalGiftFree:number };
};

export default function FlowStart() {
  // 問卷輸入
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [grossEstate, setGrossEstate] = useState<number>(300_000_000);
  const [numChildren, setNumChildren] = useState<number>(3);
  const [includeSpouse, setIncludeSpouse] = useState<boolean>(true);
  const [years, setYears] = useState<number>(10);
  const [recipients, setRecipients] = useState<number>(4); // 配偶+子女 3

  // 預覽計算
  const [preview, setPreview] = useState<CompareRes | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // 報告寄送
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  // 自動預覽（輸入變更 600ms 後打）
  useEffect(() => {
    const h = setTimeout(async () => {
      setLoadingPreview(true);
      try {
        const r = await fetch("/api/tax/compare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ grossEstate, numChildren, includeSpouse, years, recipients }),
        });
        const data = await r.json();
        if (r.ok) setPreview(data);
      } finally {
        setLoadingPreview(false);
      }
    }, 600);
    return () => clearTimeout(h);
  }, [grossEstate, numChildren, includeSpouse, years, recipients]);

  const sendReport = async () => {
    setSending(true);
    setErr("");
    setDone(false);
    try {
      const body = {
        lead: { name, email, phone },
        input: { grossEstate, numChildren, includeSpouse, years, recipients },
      };
      const r = await fetch("/api/report/estate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "寄送失敗");
      // 存個人化情境到 localStorage，提供 /advisor 使用
      localStorage.setItem("ycfo_case", JSON.stringify(body));
      setDone(true);
    } catch (e:any) {
      setErr(e?.message ?? "未知錯誤");
    } finally {
      setSending(false);
    }
  };

  const n = (x:number)=> x.toLocaleString();

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
      <h1 className="text-2xl font-semibold">🧭 傳承路徑模擬（互動版）</h1>

      {/* 問答區 */}
      <div className="rounded-2xl border bg-white p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span>遺產總額（元）*</span>
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
              <input type="number" min={1} className="rounded-lg border p-2"
                     value={years} onChange={e=>setYears(Number(e.target.value))}/>
            </label>
            <label className="flex flex-col gap-1">
              <span>受贈人數</span>
              <input type="number" min={1} className="rounded-lg border p-2"
                     value={recipients} onChange={e=>setRecipients(Number(e.target.value))}/>
            </label>
          </div>
        </div>
      </div>

      {/* 預覽區 */}
      <div className="rounded-2xl border bg-white p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">📊 即時預覽</h2>
          {loadingPreview && <span className="text-sm text-gray-500">計算中…</span>}
        </div>
        {preview ? (
          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-xl border p-4">
              <div className="font-medium mb-1">現況不規劃</div>
              <div>課稅遺產：<b>{n(preview.baseline.taxableEstate)}</b></div>
              <div>稅率：<b>{preview.baseline.bracket}%</b></div>
              <div>預估遺產稅：<b className="text-emerald-700">{n(preview.baseline.tax)}</b></div>
            </div>
            <div className="rounded-xl border p-4">
              <div className="font-medium mb-1">逐年贈與</div>
              <div>累計免稅贈與：<b>{n(preview.giftingPlan.totalGiftFree)}</b></div>
              <div>課稅遺產：<b>{n(preview.giftingPlan.taxableEstate)}</b></div>
              <div>稅率：<b>{preview.giftingPlan.bracket}%</b></div>
              <div>預估遺產稅：<b className="text-emerald-700">{n(preview.giftingPlan.tax)}</b></div>
            </div>
            <div className="rounded-xl border p-4">
              <div className="font-medium mb-1">組合方案</div>
              <div>累計免稅贈與：<b>{n(preview.comboPlan.totalGiftFree)}</b></div>
              <div>課稅遺產：<b>{n(preview.comboPlan.taxableEstate)}</b></div>
              <div>稅率：<b>{preview.comboPlan.bracket}%</b></div>
              <div>預估遺產稅：<b className="text-emerald-700">{n(preview.comboPlan.tax)}</b></div>
            </div>
          </div>
        ) : (
          <div className="text-gray-500 text-sm">請輸入數值以產生預覽。</div>
        )}
      </div>

      {/* 取得報告 */}
      <div className="rounded-2xl border bg-white p-6 space-y-3">
        <h2 className="text-lg font-semibold">📩 取得顧問級 PDF 報告</h2>
        <p className="text-sm text-gray-600">填寫 Email 後，系統會寄送報告 PDF 給您，同步抄送顧問協助後續安排。</p>
        <div className="grid md:grid-cols-3 gap-4">
          <label className="flex flex-col gap-1">
            <span>姓名（可選）</span>
            <input className="rounded-lg border p-2" value={name} onChange={e=>setName(e.target.value)}/>
          </label>
          <label className="flex flex-col gap-1">
            <span>Email（必填）</span>
            <input className="rounded-lg border p-2" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@email.com"/>
          </label>
          <label className="flex flex-col gap-1">
            <span>手機（可選）</span>
            <input className="rounded-lg border p-2" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="09xx-xxx-xxx"/>
          </label>
        </div>
        {err && <div className="text-red-600 text-sm">{err}</div>}
        {done ? (
          <div className="text-emerald-700">已寄出報告，請至信箱查收。您也可前往 <a className="underline" href="/advisor">顧問 AI</a> 進一步提問。</div>
        ) : (
          <button onClick={sendReport} disabled={sending || !email}
                  className="px-5 py-3 rounded-xl bg-black text-white hover:opacity-90 disabled:opacity-60">
            {sending ? "寄送中…" : "寄送報告到我的 Email"}
          </button>
        )}
      </div>
    </div>
  );
}
