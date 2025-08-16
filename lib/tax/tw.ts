// lib/tax/tw.ts
// 簡化版台灣遺產/贈與稅試算（顧問引導用；實務以申報時法令為準）

export type Bracket = 10 | 15 | 20;

export const TWD = (n: number) => Math.max(0, Math.round(n || 0));
export const fmt = (n: number) => TWD(n).toLocaleString("zh-TW");

// 免稅/扣除（常見數字）
export const ESTATE_BASIC_EXEMPTION = 12_000_000; // 一般免稅額 1,200 萬
export const SPOUSE_DEDUCTION = 5_530_000;        // 配偶扣除 553 萬
export const FUNERAL_DEDUCTION = 1_380_000;       // 喪葬費 138 萬
export const GIFT_ANNUAL_EXEMPTION = 2_440_000;   // 贈與年免稅 244 萬/人

export function pickBracket(taxable: number): Bracket {
  if (taxable <= 50_000_000) return 10;
  if (taxable <= 100_000_000) return 15;
  return 20;
}

// 遺產稅粗估
export function calcEstateTax(args: {
  grossEstate: number;          // 遺產總額
  includeSpouse?: boolean;      // 是否含配偶扣除
  extraDeductions?: number;     // 其他扣除（特別扣除等）
}) {
  const gross = TWD(args.grossEstate);
  const deductions =
    ESTATE_BASIC_EXEMPTION +
    FUNERAL_DEDUCTION +
    (args.includeSpouse ? SPOUSE_DEDUCTION : 0) +
    TWD(args.extraDeductions || 0);

  const taxableEstate = Math.max(0, gross - deductions);
  const bracket = pickBracket(taxableEstate);
  const tax = Math.round(taxableEstate * (bracket / 100));

  return { gross, deductions, taxableEstate, bracket, tax };
}

// 贈與免稅累計（多人 × 多年）
export function calcGiftFree(years: number, recipients: number) {
  const y = Math.max(0, Math.floor(years || 0));
  const r = Math.max(0, Math.floor(recipients || 0));
  return TWD(y * r * GIFT_ANNUAL_EXEMPTION);
}

// 三方案比較：現況／逐年贈與／組合（示意）
export function simulateCompare(args: {
  grossEstate: number;
  numChildren?: number;
  includeSpouse?: boolean;
  years: number;
  recipients: number; // 受贈人數（通常配偶+子女）
}) {
  const gross = TWD(args.grossEstate);
  const includeSpouse = !!args.includeSpouse;

  // A 現況
  const baseline = calcEstateTax({ grossEstate: gross, includeSpouse });

  // B 逐年贈與（只計入免稅額的長期效果）
  const totalGiftFree = Math.min(calcGiftFree(args.years, args.recipients), gross);
  const giftingTaxable = Math.max(0, gross - totalGiftFree - (ESTATE_BASIC_EXEMPTION + FUNERAL_DEDUCTION + (includeSpouse ? SPOUSE_DEDUCTION : 0)));
  const giftingBracket = pickBracket(giftingTaxable);
  const giftingTax = Math.round(giftingTaxable * (giftingBracket / 100));
  const giftingPlan = {
    totalGiftFree,
    taxableEstate: giftingTaxable,
    bracket: giftingBracket,
    tax: giftingTax,
  };

  // C 組合方案（示意：在 B 的基礎上，再用資金/保單/信託優化 10% 稅基）
  const comboTaxable = Math.max(0, Math.round(giftingTaxable * 0.9));
  const comboBracket = pickBracket(comboTaxable);
  const comboTax = Math.round(comboTaxable * (comboBracket / 100));
  const comboPlan = {
    totalGiftFree,
    taxableEstate: comboTaxable,
    bracket: comboBracket,
    tax: comboTax,
  };

  return { baseline, giftingPlan, comboPlan };
}
