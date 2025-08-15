// lib/estate-gift.ts
import { TAX_DATA } from "@/data/tax";

type RateBracket = { up_to: number | null; rate: number; quick_deduction?: number };
type RateModel =
  | { kind: "flat_or_brackets"; flat_rate?: number; brackets?: RateBracket[] }
  | { kind: "brackets"; brackets: RateBracket[] };

type EstateInputs = {
  jurisdiction: "TW";
  gross_estate: number;             // 遺產總額
  debts?: number;                   // 債務
  funeral_expense?: number;         // 喪葬費
  life_insurance_payout?: number;   // 壽險給付
  spouse_count?: number;            // 配偶數（0/1）
  lineal_descendants?: number;      // 直系血親卑親屬人數
  lineal_ascendants?: number;       // 直系血親尊親屬人數（最多按版本 cap 計）
  disabled_count?: number;          // 身心障礙扣除人數
  other_dependents?: number;        // 其他撫養人數
};

type GiftInputs = {
  jurisdiction: "TW";
  gifts_amount: number;             // 本年度贈與總額
  spouse_split?: boolean;           // 是否夫妻合贈（此版預設不適用）
  minor_children?: number;          // 未成年子女人數（若有特別免稅）
};

export function pickActiveVersion(tax: any) {
  const today = new Date().toISOString().slice(0, 10);
  const vers = tax?.versions || [];
  const found = vers.find(
    (v: any) =>
      (!v.effective_from || v.effective_from <= today) &&
      (!v.effective_to || v.effective_to >= today)
  );
  return found || vers[0];
}

function applyBrackets(taxable: number, model: RateModel): { tax: number; rate: number; bracketIndex: number } {
  if (model.kind === "flat_or_brackets" && model.flat_rate && model.flat_rate > 0) {
    return { tax: taxable * model.flat_rate, rate: model.flat_rate, bracketIndex: -1 };
  }
  const brackets = (model as any).brackets as RateBracket[] | undefined;
  if (!brackets || brackets.length === 0) return { tax: 0, rate: 0, bracketIndex: -1 };

  for (let i = 0; i < brackets.length; i++) {
    const b = brackets[i];
    const cap = b.up_to ?? Infinity;
    if (taxable <= cap) {
      const tax = b.quick_deduction != null ? taxable * b.rate - b.quick_deduction : taxable * b.rate;
      return { tax: Math.max(0, tax), rate: b.rate, bracketIndex: i };
    }
  }
  const last = brackets[brackets.length - 1];
  const tax = last.quick_deduction != null ? taxable * last.rate - last.quick_deduction : taxable * last.rate;
  return { tax: Math.max(0, tax), rate: last.rate, bracketIndex: brackets.length - 1 };
}

/** 遺產稅試算（依 JSON 版本設定） */
export function estimateEstateTW(inputs: EstateInputs) {
  const data: any = (TAX_DATA.TW as any).estate;
  const ver = pickActiveVersion(data);
  if (!ver) throw new Error("找不到遺產稅版本設定");

  const B = ver.basic_exemptions || {};
  const O = ver.other_deductions || {};
  const R = ver.rate_model as RateModel;

  const spouse = inputs.spouse_count ?? 0;
  const descendants = inputs.lineal_descendants ?? 0;
  const ascendantsInput = inputs.lineal_ascendants ?? 0;
  const ascCap = Math.max(0, B.lineal_ascendant_max_count ?? Infinity);
  const ascendants = Math.min(ascendantsInput, ascCap);
  const disabled = inputs.disabled_count ?? 0;
  const others = inputs.other_dependents ?? 0;

  const basic =
    (B.basic || 0) +
    spouse * (B.spouse_deduction || 0) +
    descendants * (B.lineal_descendant_deduction_per_person || 0) +
    ascendants * (B.lineal_ascendant_deduction_per_person || 0) +
    disabled * (B.disabled_deduction_per_person || 0) +
    others * (B.other_dependents_deduction_per_person || 0);

  const funeralCap = Math.min(inputs.funeral_expense || 0, O.funeral_expense_cap || 0);
  const lifeInsCap = Math.min(inputs.life_insurance_payout || 0, O.life_insurance_exempt_cap || 0);
  const debts = (O.debts_allowable ? (inputs.debts || 0) : 0);

  const deductions = basic + funeralCap + lifeInsCap + debts;

  const taxableBase = Math.max(0, (inputs.gross_estate || 0) - deductions);
  const { tax, rate, bracketIndex } = applyBrackets(taxableBase, R);

  return {
    version: ver,
    inputs,
    currency: data.currency || "TWD",
    computed: {
      basic_exemptions_total: basic,
      funeral_expense_allowed: funeralCap,
      life_insurance_exempted: lifeInsCap,
      debts_allowed: debts,
      taxable_base: taxableBase,
      rate_applied: rate,
      bracket_index: bracketIndex,
      tax_due: Math.round(tax)
    }
  };
}

/** 贈與稅試算（年度免稅 + 級距/速算） */
export function estimateGiftTW(inputs: GiftInputs) {
  const data: any = (TAX_DATA.TW as any).gift;
  const ver = pickActiveVersion(data);
  if (!ver) throw new Error("找不到贈與稅版本設定");

  const R = ver.rate_model as RateModel;
  const E = ver.exemptions || {};

  let base = inputs.gifts_amount || 0;

  // 年度免稅（每位贈與人）
  let annualEx = E.annual_exclusion_per_donor || 0;
  if (inputs.spouse_split && E.spouse_split_allowed) {
    // 目前此版設定 spouse_split_allowed=false；若未來開放合贈，可改 true 以加倍免稅
    annualEx *= 2;
  }

  const minorEx = (inputs.minor_children || 0) * (E.minor_child_exclusion || 0);

  const taxableBase = Math.max(0, base - annualEx - minorEx);
  const { tax, rate, bracketIndex } = applyBrackets(taxableBase, R);

  return {
    version: ver,
    inputs,
    currency: data.currency || "TWD",
    computed: {
      annual_exclusion_applied: annualEx,
      minor_children_exclusion_total: minorEx,
      taxable_base: taxableBase,
      rate_applied: rate,
      bracket_index: bracketIndex,
      tax_due: Math.round(tax)
    }
  };
}
