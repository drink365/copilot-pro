// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server"
import { checkDailyQuota, getUserPlan } from "@/lib/entitlements"
import { resolveTaxFacts } from "@/lib/tax-resolver"
import { estimateEstateTW, estimateGiftTW } from "@/lib/estate-gift"

export const runtime = "edge"

function roughNumberIn(text: string): number | null {
  const m = text.replace(/[,，]/g, "").match(/([0-9]+(?:\.[0-9]+)?)/)
  return m ? Number(m[1]) : null
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    const content: string = String(payload?.content || "")

    // 配額（Free/Pro）
    const quota = checkDailyQuota()
    if (!quota.ok) {
      return NextResponse.json({ error: `免費版今日已達上限（${quota.limit} 次）。請明天再試或升級 Pro。` }, { status: 429 })
    }

    const facts = resolveTaxFacts(content)
    let factsBlock = ""
    if (facts && (facts as any).found) {
      factsBlock = `\n\n---\n${(facts as any).factsText}`
    }

    let calcBlock = ""
    const maybeAmount = roughNumberIn(content) ?? 0
    if (content.includes("遺產") || content.toLowerCase().includes("estate")) {
      const r = estimateEstateTW({
        jurisdiction: "TW",
        gross_estate: maybeAmount,
        debts: 0, funeral_expense: 0, life_insurance_payout: 0,
        spouse_count: 0, lineal_descendants: 0, lineal_ascendants: 0, disabled_count: 0,
        other_dependents: 0
      })
      calcBlock =
`【系統試算（僅依題句抓到的總額示意）】
- 遺產總額：${r.inputs.gross_estate.toLocaleString()} ${r.currency}
- 基本免稅/扣除合計：${(r.computed.basic_exemptions_total + r.computed.funeral_expense_allowed + r.computed.life_insurance_exempted + r.computed.debts_allowed).toLocaleString()} ${r.currency}
- 應稅基：${r.computed.taxable_base.toLocaleString()} ${r.currency}
- 稅率/級距：${(r.computed.rate_applied*100).toFixed(0)}%
- 試算稅額：${r.computed.tax_due.toLocaleString()} ${r.currency}
（實務請完整輸入：配偶/直系人數、喪葬費、債務、壽險/其他撫養等）`
    } else if (content.includes("贈與") || content.toLowerCase().includes("gift")) {
      const r = estimateGiftTW({
        jurisdiction: "TW",
        gifts_amount: maybeAmount,
        spouse_split: false,
        minor_children: 0
      })
      calcBlock =
`【系統試算（僅依題句抓到的總額示意）】
- 贈與總額：${r.inputs.gifts_amount.toLocaleString()} ${r.currency}
- 年度免稅：${r.computed.annual_exclusion_applied.toLocaleString()} ${r.currency}
- 應稅基：${r.computed.taxable_base.toLocaleString()} ${r.currency}
- 稅率/級距：${(r.computed.rate_applied*100).toFixed(0)}%
- 試算稅額：${r.computed.tax_due.toLocaleString()} ${r.currency}`
    }

    const reply = `${calcBlock || "已收到，我會以『準備與從容』的主軸提供建議。"}${factsBlock}`

    return NextResponse.json({
      reply,
      isPro: getUserPlan() !== "free"
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "未知錯誤" }, { status: 500 })
  }
}
