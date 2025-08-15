// app/book/page.tsx
"use client";
import { useState } from "react";

type Period = "上午" | "下午" | "不限";

export default function BookPage() {
  const [caseId, setCaseId] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [period, setPeriod] = useState<Period>("不限");
  const [note, setNote] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string>("");

  const submit = async () => {
    setLoading(true);
    setError("");
    setDone(false);

    try {
      const r = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId, name, phone, email, date, period, note }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "預約失敗");
      setDone(true);
      // 清空表單（保留電話與Email以方便下一次填寫）
      setCaseId("");
      setName("");
      setDate("");
      setPeriod("不限");
      setNote("");
    } catch (e: any) {
      setError(e?.message ?? "未知錯誤");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-6 py-10">
      <h1 className="text-2xl font-semibold mb-6">📅 預約顧問</h1>

      <div className="grid gap-4">
        <label className="flex flex-col gap-1">
          <span>案件碼（可選）</span>
          <input value={caseId} onChange={e=>setCaseId(e.target.value)}
                 className="rounded-lg border p-2" placeholder="例如：A-2025-0801"/>
        </label>

        <label className="flex flex-col gap-1">
          <span>姓名／稱呼 *</span>
          <input value={name} onChange={e=>setName(e.target.value)}
                 className="rounded-lg border p-2" placeholder="請輸入"/>
        </label>

        <label className="flex flex-col gap-1">
          <span>手機 *</span>
          <input value={phone} onChange={e=>setPhone(e.target.value)}
                 className="rounded-lg border p-2" placeholder="09xx-xxx-xxx"/>
        </label>

        <label className="flex flex-col gap-1">
          <span>Email（可選）</span>
          <input value={email} onChange={e=>setEmail(e.target.value)}
                 className="rounded-lg border p-2" placeholder="name@email.com"/>
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span>日期 *</span>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)}
                   className="rounded-lg border p-2"/>
          </label>

          <label className="flex flex-col gap-1">
            <span>時段 *</span>
            <select value={period} onChange={e=>setPeriod(e.target.value as Period)}
                    className="rounded-lg border p-2">
              <option value="上午">上午</option>
              <option value="下午">下午</option>
              <option value="不限">不限</option>
            </select>
          </label>
        </div>

        <label className="flex flex-col gap-1">
          <span>備註（可選）</span>
          <textarea value={note} onChange={e=>setNote(e.target.value)}
                    className="rounded-lg border p-2 min-h-[100px]" placeholder="簡述想討論的重點"/>
        </label>

        {error && <div className="text-red-600">{error}</div>}
        {done && <div className="text-emerald-700">已收到您的預約，我們會盡快與您聯繫安排時間。</div>}

        <button onClick={submit} disabled={loading}
                className="mt-2 px-5 py-3 rounded-xl bg-black text-white hover:opacity-90">
          {loading ? "送出中..." : "送出預約"}
        </button>

        <p className="text-xs text-gray-500 mt-2">
          提醒：資料僅用於預約與聯繫之必要範圍。
        </p>
      </div>
    </div>
  );
}
