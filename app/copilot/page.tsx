// app/copilot/page.tsx
"use client";
import { useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export default function CopilotPage() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim()) return;
    const newMsgs = [...msgs, { role: "user", content: input } as Msg];
    setMsgs(newMsgs);
    setInput("");
    setLoading(true);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMsgs }),
      });
      const data = await r.json();
      const content = data?.choices?.[0]?.message?.content || "（無回覆）";
      setMsgs(m => [...m, { role: "assistant", content }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-4">
      <h1 className="text-2xl font-semibold">🤖 智能顧問</h1>
      <div className="border rounded-xl min-h-[320px] p-4 bg-white">
        {!msgs.length && <div className="text-sm text-gray-500">開始對話吧！</div>}
        {msgs.map((m, i) => (
          <div key={i} className={`mb-3 ${m.role === "user" ? "text-right" : "text-left"}`}>
            <div className={`inline-block rounded-2xl px-3 py-2 ${m.role === "user" ? "bg-black text-white" : "bg-gray-100"}`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div className="text-sm text-gray-500">思考中…</div>}
      </div>
      <div className="flex gap-2">
        <input className="flex-1 rounded-xl border p-3" value={input} onChange={e=>setInput(e.target.value)}
               placeholder="輸入你的問題…" onKeyDown={e=>{ if(e.key==="Enter") send(); }}/>
        <button onClick={send} className="px-5 py-3 rounded-xl bg-black text-white hover:opacity-90">送出</button>
      </div>
    </div>
  );
}
