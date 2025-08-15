// lib/tax-resolver.ts
import { TAX_DATA } from "@/data/tax"
import { pickActiveVersion } from "./estate-gift"

export function resolveTaxFacts(query: string) {
  const q = (query || "").toLowerCase()
  const today = new Date().toISOString().slice(0, 10)

  function factsForEstate() {
    const data: any = (TAX_DATA.TW as any).estate
    const ver = pickActiveVersion(data)
    if (!ver) return null

    const lines: string[] = []
    lines.push(`稅制：台灣｜遺產稅（幣別：${data.currency || "TWD"}）`)
    lines.push(`適用期間：${ver.effective_from || "（未標註）"} ～ ${ver.effective_to || "（未標註）"}`)

    const B = ver.basic_exemptions || {}
    const O = ver.other_deductions || {}
    lines.push(`免稅/扣除摘要：`)
    if (B.basic != null) lines.push(`- 基本免稅：${Number(B.basic).toLocaleString()}`)
    if (B.spouse_deduction != null) lines.push(`- 配偶扣除：${Number(B.spouse_deduction).toLocaleString()}`)
    if (B.lineal_descendant_deduction_per_person != null) lines.push(`- 直系卑親屬每人：${Number(B.lineal_descendant_deduction_per_person).toLocaleString()}`)
    if (B.lineal_ascendant_deduction_per_person != null) {
      const cap = B.lineal_ascendant_max_count ? `（最多 ${B.lineal_ascendant_max_count} 人）` : ""
      lines.push(`- 直系尊親屬每人：${Number(B.lineal_ascendant_deduction_per_person).toLocaleString()}${cap}`)
    }
    if (B.disabled_deduction_per_person != null) lines.push(`- 身心障礙每人：${Number(B.disabled_deduction_per_person).toLocaleString()}`)
    if (B.other_dependents_deduction_per_person != null) lines.push(`- 其他撫養每人：${Number(B.other_dependents_deduction_per_person).toLocaleString()}`)
    if (O.funeral_expense_cap != null) lines.push(`- 喪葬費上限：${Number(O.funeral_expense_cap).toLocaleString()}`)
    if (O.life_insurance_exempt_cap != null) lines.push(`- 壽險給付免稅上限：${Number(O.life_insurance_exempt_cap).toLocaleString()}`)
    if (O.debts_allowable) lines.push(`- 債務得扣除：是`)

    const R = ver.rate_model || {}
    if (Array.isArray(R.brackets) && R.brackets.length) {
      lines.push(`級距稅率：`)
      R.brackets.forEach((b: any, i: number) => {
        const cap = b.up_to === null ? "以上" : `至 ${Number(b.up_to).toLocaleString()}`
        const qd = b.quick_deduction ? `（速算扣除 ${Number(b.quick_deduction).toLocaleString()}）` : ""
        lines.push(`- 第 ${i + 1} 級：${cap}，稅率 ${(b.rate * 100).toFixed(0)}%${qd}`)
      })
    }

    return {
      found: true,
      topic: "estate" as const,
      factsText: lines.join("\n"),
      sources: (ver.sources || []).map((s: any) => ({ title: s.title, url: s.url })),
      isDemo: !!ver.is_demo,
      isExpired: !!(ver.effective_to && ver.effective_to < today)
    }
  }

  function factsForGift() {
    const data: any = (TAX_DATA.TW as any).gift
    const ver = pickActiveVersion(data)
    if (!ver) return null

    const lines: string[] = []
    lines.push(`稅制：台灣｜贈與稅（幣別：${data.currency || "TWD"}）`)
    lines.push(`適用期間：${ver.effective_from || "（未標註）"} ～ ${ver.effective_to || "（未標註）"}`)

    const E = ver.exemptions || {}
    lines.push(`免稅摘要：`)
    if (E.annual_exclusion_per_donor != null) lines.push(`- 贈與人年度免稅額：${Number(E.annual_exclusion_per_donor).toLocaleString()}`)
    if (E.spouse_split_allowed != null) lines.push(`- 夫妻合贈分攤：${E.spouse_split_allowed ? "可" : "否"}`)
    if (E.minor_child_exclusion != null && E.minor_child_exclusion > 0) lines.push(`- 未成年子女額外免稅：${Number(E.minor_child_exclusion).toLocaleString()}`)

    const R = ver.rate_model || {}
    if (Array.isArray(R.brackets) && R.brackets.length) {
      lines.push(`級距稅率：`)
      R.brackets.forEach((b: any, i: number) => {
        const cap = b.up_to === null ? "以上" : `至 ${Number(b.up_to).toLocaleString()}`
        const qd = b.quick_deduction ? `（速算扣除 ${Number(b.quick_deduction).toLocaleString()}）` : ""
        lines.push(`- 第 ${i + 1} 級：${cap}，稅率 ${(b.rate * 100).toFixed(0)}%${qd}`)
      })
    }

    return {
      found: true,
      topic: "gift" as const,
      factsText: lines.join("\n"),
      sources: (ver.sources || []).map((s: any) => ({ title: s.title, url: s.url })),
      isDemo: !!ver.is_demo,
      isExpired: !!(ver.effective_to && ver.effective_to < today)
    }
  }

  if (q.includes("遺產") || q.includes("estate")) return factsForEstate()
  if (q.includes("贈與") || q.includes("gift")) return factsForGift()
  return { found: false }
}
