export default function Home() {
  return (
    <main className="space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-2">你的顧問專屬 AI</h2>
        <p className="text-slate-700">
          不是萬用聊天機器人，而是專攻「保險 × 傳承 × 稅源預留」的實戰助理：
          一鍵生成話術、企劃與提案，現場就能跟客戶互動。
        </p>
        <ul className="list-disc pl-6 mt-3 text-slate-700">
          <li>專業 System Prompt：懂壽險策略、遺贈稅、跨境情境</li>
          <li>免費體驗：每日 3 次對話上限</li>
          <li>付費解鎖：提案生成器、情境模板、私人知識庫</li>
        </ul>
        <a
          href="/copilot"
          className="inline-block mt-4 rounded-lg bg-sky-600 px-4 py-2 text-white hover:bg-sky-700"
        >
          立即使用 Copilot
        </a>
      </section>
    </main>
  )
}
