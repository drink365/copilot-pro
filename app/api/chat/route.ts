// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server"
import { checkDailyQuota, getUserPlan } from "@/lib/entitlements"
import { resolveTaxFacts } from "@/lib/tax-resolver"
import { estimateEstateTW, estimateGiftTW } from "@/lib/estate-gift"

export const runtime = "edge"

// 取第一個數字（允許逗號）
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
  return (
`【系統試算（僅依題句抓到的總額示意）】
- 遺產總額：${r.inputs.gross_estate.toLocaleString()} ${r.currency}
- 基本免稅/扣除合計：${(r.computed.basic_exemptions_total + r.computed.funeral_expense_allowed + r.computed.life_insurance_exempted + r.computed.debts_allowed).toLocaleString()} ${r.currency}
- 應稅基：${r.computed.taxable_base.toLocaleString()} ${r.currency}
- 稅率/級距：${(r.computed.rate_applied * 100).toFixed(0)}%
- 試算稅額：${r.computed.tax_due.toLocaleString()} ${r.currency}
（實務請完整輸入：配偶/直系人數、喪葬費、債務、壽險、其他撫養等）`
  )
}

function buildGiftBlock(amount: number) {
  const r = estimateGiftTW({
    jurisdiction: "TW",
    gifts_amount: amount,
    spouse_split: false,
    minor_children: 0
  })
  return (
`【系統試算（僅依題句抓到的總額示意）】
- 贈與總額：${r.inputs.gifts_amount.toLocaleString()} ${r.currency}
- 年度免稅：${r.computed.annual_exclusion_applied.toLocaleString()} ${r.currency}
- 應稅基：${r.computed.taxable_base.toLocaleString()} ${r.currency}
- 稅率/級距：${(r.computed.rate_applied * 100).toFixed(0)}%
- 試算稅額：${r.computed.tax_due.toLocaleString()} ${r.currency}`
  )
}

function makeHeuristicReply(content: string, factsBlock: string) {
  const lc = content.toLowerCase()
  const c = content // 保留原文判斷中文關鍵字

  // 1) 遺產／贈與（含英文）→ 試算（若抓到金額）
  const amount = roughNumberIn(content) ?? 0
  if (hasAny(c, ["遺產"]) || hasAny(lc, ["estate"])) {
    const calc = amount > 0 ? buildEstateBlock(amount) :
`我先給方向，若要立即估稅請提供：
- 總遺產金額（含不動產、股權、存款、有價證券）
- 配偶/直系尊親屬/直系卑親屬/身心障礙/其他撫養人數
- 債務、喪葬費、壽險理賠金（分辨免稅與否）
我會據此產出「免稅額與扣除項」「應稅基」「級距/速算扣除」「試算稅額」。`
    return `${calc}${factsBlock}`
  }
  if (hasAny(c, ["贈與"]) || hasAny(lc, ["gift"])) {
    const calc = amount > 0 ? buildGiftBlock(amount) :
`要估贈與稅，請補：
- 當年度贈與總額
- 是否配偶分攤（split）
- 受贈人關係（未成年、直系）與次數
我會用「年度免稅額」「級距/速算扣除」幫你出示意試算。`
    return `${calc}${factsBlock}`
  }

  // 2) 退休 / 長照 / 醫療
  if (hasAny(c, ["退休", "年金", "生活費"]) || hasAny(lc, ["retire"])) {
    const tip =
`我會以「準備與從容」為軸心，建議三步：
1) 生活現金流：估年支出×25～30倍為安全資本；保留 12～24 個月現金部位。
2) 風險保障：長照日額＋重大疾病一次金，覆蓋 3～5 年缺口；搭配壽險作為遺稅/交棒的流動性預留。
3) 資產桶策略：短（現金/定存）、中（債券/收益）、長（股票/股利/不動產）；每年再平衡一次。
若你願意，提供：現金/金融資產、不動產、每月支出、已有保單與保額，我能回傳「退休缺口與保障缺口」摘要。`
    return `${tip}${factsBlock}`
  }
  if (hasAny(c, ["長照", "醫療", "照護"]) || hasAny(lc, ["ltc", "medical"])) {
    const tip =
`長照規劃建議：
- 日額設計：至少 NTD 2,500～4,000/日，5 年期或終身給付；搭配一次金補裝備/改裝。
- 現金流來源：長照日額＋收益資產（股利/租金）＋緊急備用金。
- 保單結構：檢視等待期、等待金、續保條款；避免單點商品，採「日額＋一次金」雙軌。
若提供年齡/性別/預算，我可回傳一頁式長照方案草稿。`
    return `${tip}${factsBlock}`
  }

  // 3) 企業接班 / 家族治理 / 保單做交棒流動性
  if (hasAny(c, ["接班", "家族", "股權", "信託"]) || hasAny(lc, ["succession", "governance", "trust"])) {
    const tip =
`企業接班三層：
- 家業（決策/治理）：明確股東協議、表決權設計、董事席次與保護性條款。
- 家產（資產/稅務）：以保單預留遺稅與贖回流動性；跨國資產以信託或控股公司整線。
- 家風（價值/規章）：家族憲章＋教育基金（可設績效返還機制）。
若提供：股權結構、二代意願、跨境資產，我能給你「交棒分層架構圖＋現金流表」。`
    return `${tip}${factsBlock}`
  }

  // 4) 一般保單配置（保障→儲蓄→傳承）
  if (hasAny(c, ["保單", "壽險", "醫療險", "意外險", "保障"]) || hasAny(lc, ["insurance", "policy"])) {
    const tip =
`建議從保障開始：意外/醫療/重大疾病 → 收益/儲蓄 → 傳承（壽險/信託）。
快速檢核：
- 家庭責任：負債/子女教育/父母扶養 → 壽險保額是否覆蓋 7～12 年生活費？
- 醫療風險：醫療雜費＋重大疾病一次金是否足以支付 2～3 年？
- 傳承與稅源：是否以保單或信託預留遺稅與接班流動性？
若提供年齡/家庭結構/預算，我可回傳「三層保單結構圖」。`
    return `${tip}${factsBlock}`
  }

  // 5) 其他／無法分類 → 提供下一步與可補資料
  const generic =
`我已收到你的問題。為了給到位的建議，請補充下列任一：
- 你想解的目標：退休 / 長照 / 風險保障 / 遺產 / 贈與 / 接班
- 重要數字（可概略）：金額、年齡、家庭成員、預算
我會據此回你一頁式的「重點建議＋下一步清單」。${factsBlock}`
  return generic
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    const content: string = String(payload?.content || "").trim()

    // 配額（Free/Pro）
    const quota = checkDailyQuota()
    if (!quota.ok) {
      return NextResponse.json(
        { error: `免費版今日已達上限（${quota.limit} 次）。請明天再試或升級 Pro。` },
        { status: 429 }
      )
    }

    // 事實摘要區塊（若辨識到稅務相關事實）
    const factsBlock = buildFactsBlock(content)

    // 產生回覆（移除「固定句」當作預設）
    const reply = makeHeuristicReply(content, factsBlock)

    return NextResponse.json({
      reply,
      isPro: getUserPlan() !== "free"
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "未知錯誤" }, { status: 500 })
  }
}
