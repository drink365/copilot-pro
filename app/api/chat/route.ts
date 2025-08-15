import { NextRequest, NextResponse } from "next/server"
import { checkDailyQuota, getUserPlan } from "@/lib/entitlements"
import { resolveTaxFacts } from "@/lib/tax-resolver"
import { estimateEstateTW, estimateGiftTW } from "@/lib/estate-gift"

export const runtime = "edge"

function roughNumberIn(text: string): number | null {
  const m = text.replace(/[,，]/g, "").match(/([0-9]+(?:\.[0-9]+)?)/)
  return m ? Number(m[1]) : null
}

function hasAny(s: string, keys: string[]) {
  return keys.some(k => s.includes(k))
}

function buildFactsBlock(content: string) {
  const facts = resolveTaxFacts(content)
  if (facts && (facts as any).found) {
    return `\n\n---\n${(facts as any).factsText}`
  }
  return ""
}

function buildEstateBlock(amount: number) {
  const r = estimateEstateTW({
    jurisdiction: "TW",
    gross_estate: amount,
    debts: 0,
    funeral_expense: 0,
    life_insurance_payout: 0,
    spouse_count: 0,
    lineal_descendants: 0,
    lineal_ascendants: 0,
    disabled_count: 0,
    other_dependents: 0
  })
  return `【系統試算（僅依題句抓到的總額示意）】
- 遺產總額：${r.inputs.gross_estate.toLocaleString()} ${r.currency}
- 基本免稅/扣除合計：${(r.computed.basic_exemptions_total + r.computed.funeral_expense_allowed + r.computed.life_insurance_exempted + r.computed.debts_allowed).toLocaleString()} ${r.currency}
- 應稅基：${r.computed.taxable_base.toLocaleString()} ${r.currency}
- 稅率/級距：${(r.computed.rate_applied * 100).toFixed(0)}%
- 試算稅額：${r.computed.tax_due.toLocaleString()} ${r.currency}`
}

function buildGiftBlock(amount: number) {
  const r = estimateGiftTW({
    jurisdiction: "TW",
    gifts_amount: amount,
    spouse_split: false,
    minor_children: 0
  })
  return `【系統試算（僅依題句抓到的總額示意）】
- 贈與總額：${r.inputs.gifts_amount.toLocaleString()} ${r.currency}
- 年度免稅：${r.computed.annual_exclusion_applied.toLocaleString()} ${r.currency}
- 應稅基：${r.computed.taxable_base.toLocaleString()} ${r.currency}
- 稅率/級距：${(r.computed.rate_applied * 100).toFixed(0)}%
- 試算稅額：${r.computed.tax_due.toLocaleString()} ${r.currency}`
}

function makeHeuristicReply(content: string, factsBlock: string) {
  const lc = content.toLowerCase()
  const c = content
  const amount = roughNumberIn(content) ?? 0

  if (hasAny(c, ["遺產"]) || hasAny(lc, ["estate"])) {
    return `${amount > 0 ? buildEstateBlock(amount) : "請提供遺產總額以試算"}${factsBlock}`
  }
  if (hasAny(c, ["贈與"]) || hasAny(lc, ["gift"])) {
    return `${amount > 0 ? buildGiftBlock(amount) : "請提供贈與總額以試算"}${factsBlock}`
  }
  if (hasAny(c, ["退休"]) || hasAny(lc, ["retire"])) {
    return `退休規劃建議：...${factsBlock}`
  }
  return `我已收到你的問題，請補充細節以提供更精準建議。${factsBlock}`
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    const content: string = String(payload?.content || "").trim()

    const quota = checkDailyQuota()
    if (!quota.ok) {
      return NextResponse.json(
        { error: `免費版今日已達上限（${quota.limit} 次）。` },
        { status: 429 }
      )
    }

    const factsBlock = buildFactsBlock(content)
    const reply = makeHeuristicReply(content, factsBlock)

    return NextResponse.json({
      reply,
      isPro: getUserPlan() !== "free"
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "未知錯誤" }, { status: 500 })
  }
}
