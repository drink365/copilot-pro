// app/pro/login/page.tsx
"use client";
import { useEffect, useState } from "react";

export default function ProLoginPage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");
  const [from, setFrom] = useState<string>("/tools/compare");

  useEffect(() => {
    const url = new URL(window.location.href);
    const f = url.searchParams.get("from");
    if (f) setFrom(f);
  }, []);

  const submit = async () => {
    setLoading(true);
    setMsg("");
    try {
      const r = await fetch("/api/pro/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await r.json();
      if (!r.ok || !data?.ok) throw new Error(data?.error || "登入失敗");
      // 登入成功 → 導回來源或預設
      window.location.href = from || "/tools/compare";
    } catch (e: any) {
      setMsg(e?.message ?? "登入失敗");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setMsg("");
    try {
      await fetch("/api/pro/logout", { method: "POST" });
      setMsg("已登出");
    } catch {
      setMsg("登出失敗");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <div className="w-full max-w-md border rounded-2xl p-6 bg-white shadow-sm">
        <h1 className="text-2xl font-semibold mb-4">🔐 顧問版登入</h1>
        <p className="text-sm text-gray-600 mb-6">
          請輸入邀請碼以存取顧問工具（/tools/*）。
        </p>

        <label className="flex flex-col gap-1 mb-4">
          <span>邀請碼</span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="rounded-lg border p-2"
            placeholder="請輸入邀請碼"
          />
        </label>

        {msg && <div className="text-sm mb-3 text-emerald-700">{msg}</div>}

        <div className="flex gap-3">
          <button
            onClick={submit}
            disabled={loading || !code}
            className="px-5 py-3 rounded-xl bg-black text-white hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "登入中..." : "登入"}
          </button>
          <button
            onClick={logout}
            disabled={loading}
            className="px-5 py-3 rounded-xl border hover:bg-gray-50"
          >
            登出
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          登入成功後，系統會在瀏覽器存放授權 Cookie（僅用於放行顧問頁面）。
        </p>
      </div>
    </div>
  );
}
