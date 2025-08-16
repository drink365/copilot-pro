// app/advisor/page.tsx
"use client";
import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export default function Advisor() {
  const [context, setContext] = useState("");
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // 從 /flow/start 存的情境帶入
  useEffect(() => {
    const raw = localStorage.getItem("ycfo_case");
    if (raw) {
      try {
        const obj = JSON.parse(raw);
        const x = obj?.input;
        const s =
          `我的情境：遺產總額 NT$ ${Number(x?.grossEstate || 0).toLocaleString()}；` +
          `子女人數 ${x?.numChildren || 0}；` +
          `配偶扣除 ${x?.includeSpouse ? "有" : "無"}；` +
          `逐年贈與 ${x?.years || 0} 年 × ${x?.recipients || 0} 人。`;
        setContext(s);
      } catch {}
    }
  }, []);

  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight });
  }, [msgs, loading]);

  const send = async () => {
    if (!input.trim() && !msgs.length) return;
    const newMsgs = [
      ...msgs,
      { role: "user", content: input || "（空白訊息）" } as Msg,
    ];
    setMsgs(newMsgs);
    setInput("");
    setLoading(true);
    try {
      const payload = {
        messages: [
          ...(context ? [{ role: "user", content: context }] : []),
          ...newMsgs,
        ],
      };
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await r.json();
      const content = data?.choices?.[0]?.message?.content || "（無回覆）";
      setMsgs(m => [...m, { role: "assistant", content }]);
    } catch {
      setMsgs(m => [...m, { role: "assistant", content: "抱歉，服務暫時無法回應。" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-4">
      <h1 className="text-2xl font-semibold">🧑‍⚖️ 顧問 AI</h1>
      {context && (
        <div className="text-sm text-gray-600 bg-gray-50 border rounded-xl p-3">
          {context}
        </div>
      )}
      <div ref={ref} className="border rounded-xl min-h-[320px] max-h-[480px] p-4 overflow-auto bg-white">
        {!msgs.length && (
          <div className="text-gray-500 text-sm">
            請直接輸入您的疑問，例如：「我該先做贈與還是配置保單？」或「信託能不能保障未婚弟弟？」。
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`mb-3 ${m.role === "user" ? "text-right" : "text-left"}`}>
            <div className={`inline-block rounded-2xl px-3 py-2 ${m.role === "user" ? "bg-black text-white" : "bg-gray-100"}`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div className="text-sm text-gray-500">顧問思考中…</div>}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-xl border p-3"
          placeholder="輸入你的問題…"
          value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{ if(e.key==="Enter") send(); }}
        />
        <button onClick={send} className="px-5 py-3 rounded-xl bg-black text-white hover:opacity-90">送出</button>
      </div>
    </div>
  );
}
