// app/copilot/templates.ts
type T = {
  id: string
  title: string
  subtitle?: string
  prompt: (params?: Record<string, string | number>) => string
}

export const templates: T[] = [
  {
    id: "succession-founder",
    title: "企業接班（創辦人）",
    subtitle: "保單＋信託｜稅源預留｜控制權安排",
    prompt: () => `請用 Markdown 條列清楚輸出（含標題/小節/表格）：
### 客戶情況
- 企業型態：中小企業／傳產
- 核心訴求：安全交棒、現金流穩定、避免爭產

### 顧問建議
1. 以壽險作為稅源與流動性工具，預留遺/贈稅。
2. 設計「保單＋信託」雙層結構；列出保單所有權/受益人安排。
3. 治理層面：股權分層、董事席次與表決權配置。
4. 風險提醒：現金流壓力、跨境資產、保單持續性。

### 下一步行動
- 一頁式提案綱要（列點）。
- 需要的資料清單（KYC 與資產盤點）。`
  },
  {
    id: "estate-calculator",
    title: "遺產稅快速試算",
    subtitle: "輸入總額→列出免稅/級距/試算稅額",
    prompt: () => `請依台灣遺產稅現行版本（見本系統 /data/tax）示範試算步驟，
列出：基本免稅與扣除、應稅基、適用級距與稅額，並提醒使用者：實務申報仍以主管機關公告為準。`
  },
  {
    id: "gift-calculator",
    title: "贈與稅快速試算",
    subtitle: "列出年度免稅與級距",
    prompt: () => `請依台灣贈與稅現行版本（見本系統 /data/tax）示範試算邏輯與級距說明，並提供注意事項。`
  }
]

export const quickActions = [
  {
    id: "client-opening",
    label: "📨 約談開場白",
    prompt: "請用 Markdown 輸出 120 字的高資產創辦人約談開場白，主軸『準備與從容』，避免推銷。"
  },
  {
    id: "risk-checklist",
    label: "🧭 風險檢核清單",
    prompt: "以 Markdown 列出企業接班＋家庭傳承風險檢核清單（10–12 點），每點一句可勾選的事項。"
  },
  {
    id: "proposal-outline",
    label: "🧱 提案大綱",
    prompt: "用 Markdown 列出『保單＋信託＋公司治理』整合提案的章節與每節重點。"
  }
] as const
