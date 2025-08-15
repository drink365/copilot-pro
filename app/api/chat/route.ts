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
- 試算稅額：${r.computed.tax_due.toLocaleString()} ${r.currency}
（實務請完整輸入：配偶/直系人數、喪葬費、債務、壽險/其他撫養等）`
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
    return `${amount > 0 ? buildEstateBlock(amount) : "要估遺產稅，請提供遺產總額與配偶/直系人數、喪葬費、債務、壽險理賠等，我會立即試算。"}${factsBlock}`
  }
  if (hasAny(c, ["贈與"]) || hasAny(lc, ["gift"])) {
    return `${amount > 0 ? buildGiftBlock(amount) : "要估贈與稅，請提供本年度贈與總額、受贈人關係與次數；我會用年度免稅與級距幫你算。"}${factsBlock}`
  }
  if (hasAny(c, ["退休"]) || hasAny(lc, ["retire"])) {
    return `退休規劃（主軸：準備與從容）
1) 生活現金流：以年支出×25～30倍做資本目標；保留 12～24 個月現金部位。
2) 風險保障：長照日額 NTD 2,500～4,000／日 + 重大疾病一次金（2～3 年支出）。
3) 資產桶：短（現金/定存）、中（債券/收益）、長（股票/股利/不動產）；每年再平衡一次。
若願意，請提供：年齡、家庭結構、年支出與可投入資金，我能回覆「退休缺口＋保單缺口」摘要。${factsBlock}`
  }
  if (hasAny(c, ["長照", "醫療"]) || hasAny(lc, ["ltc", "medical"])) {
    return `長照建議：
- 給付：設定日額＋一次金（裝備/改裝），日額至少 NTD 2,500～4,000；年限 5 年或終身。
- 現金流：日額＋收益資產（股利/租金）＋緊急備用金。
- 條款：留意等待期、續保、理賠定義；避免單點商品，採雙軌設計。
若提供年齡/性別/預算，我可回一頁式方案草稿。${factsBlock}`
  }
  if (hasAny(c, ["接班", "家族", "股權", "信託"]) || hasAny(lc, ["succession", "governance", "trust"])) {
    return `企業接班三層：
- 家業（決策/治理）：股東協議、表決權、董事席次與保護性條款。
- 家產（資產/稅務）：以保單預留遺稅與贖回流動性；跨國資產用信託/控股公司整線。
- 家風（價值/憲章）：家族憲章＋教育基金。
若提供股權結構、二代意願、跨境資產，我能給「交棒架構圖＋現金流表」。${factsBlock}`
  }
  return `我已收到你的問題。為了更精準，請補充以下任一：
- 目標：退休 / 長照 / 風險保障 / 遺產 / 贈與 / 接班
- 重要數字（概略即可）：金額、年齡、家庭成員、預算
我會回你一頁式「重點建議＋下一步」。${factsBlock}`
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    const content: string = String(payload?.content || "").trim()

    const quota = checkDailyQuota()
    if (!quota.ok) {
      return NextResponse.json(
        { error: `免費版今日已達上限（${quota.limit} 次）。請明天再試或升級 Pro。` },
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
