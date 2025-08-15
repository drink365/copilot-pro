// lib/tax/tw.ts
export type EstateInput = {
  grossEstate: number;           // 總遺產(元)
  numChildren: number;           // 子女數
  includeSpouse: boolean;        // 配偶是否健在且可扣除
  includeFuneralDeduction?: boolean; // 是否列喪葬費扣除(預設 true)
};

export type EstateResult = {
  deductions: {
    base: number;
    spouse: number;
    children: number;
    funeral: number;
    total: number;
  };
  taxableEstate: number;
  tax: number;
  bracket: 10 | 15 | 20;
};

export type GiftInput = {
  giftAmount: number;   // 贈與金額(元)
  useAnnualExemption?: boolean; // 是否先扣除每年免稅額(預設 true)
};

export type GiftResult = {
  taxableGift: number;
  tax: number;
  bracket: 10 | 15 | 20;
};

export const TW = {
  // 扣除額（依你提供與近年實務慣用值）
  ESTATE_BASE_EXEMPTION: 13_330_000,
  ESTATE_SPOUSE_DEDUCTION: 5_530_000,
  ESTATE_CHILD_DEDUCTION_EACH: 560_000,
  ESTATE_FUNERAL_DEDUCTION: 1_380_000,

  // 累進級距（元）與速算扣除（元）——遺產稅
  ESTATE_BRACKETS: [
    { upTo: 56_210_000, rate: 0.10, quick: 0, label: 10 as const },
    { upTo: 112_420_000, rate: 0.15, quick: 2_810_000, label: 15 as const },
    { upTo: Infinity, rate: 0.20, quick: 8_430_000, label: 20 as const },
  ],

  // 贈與稅年度免稅額
  GIFT_ANNUAL_EXEMPTION: 2_440_000,

  // 累進級距（元）與速算扣除（元）——贈與稅（與你提供數據一致）
  GIFT_BRACKETS: [
    { upTo: 28_110_000, rate: 0.10, quick: 0, label: 10 as const },
    { upTo: 56_210_000, rate: 0.15, quick: 1_405_000, label: 15 as const },
    { upTo: Infinity, rate: 0.20, quick: 4_215_000, label: 20 as const },
  ],
};

function applyBrackets(amount: number, brackets: { upTo: number; rate: number; quick: number; label: 10|15|20 }[]) {
  for (const b of brackets) {
    if (amount <= b.upTo) {
      return { tax: Math.max(0, Math.round(amount * b.rate - b.quick)), bracket: b.label };
    }
  }
  return { tax: 0, bracket: 10 as const };
}

export function calcEstateTax(input: EstateInput): EstateResult {
  const funeralOn = input.includeFuneralDeduction ?? true;
  const deductions = {
    base: TW.ESTATE_BASE_EXEMPTION,
    spouse: input.includeSpouse ? TW.ESTATE_SPOUSE_DEDUCTION : 0,
    children: Math.max(0, input.numChildren) * TW.ESTATE_CHILD_DEDUCTION_EACH,
    funeral: funeralOn ? TW.ESTATE_FUNERAL_DEDUCTION : 0,
    total: 0,
  };
  deductions.total = deductions.base + deductions.spouse + deductions.children + deductions.funeral;

  const taxableEstate = Math.max(0, input.grossEstate - deductions.total);
  const { tax, bracket } = applyBrackets(taxableEstate, TW.ESTATE_BRACKETS);
  return { deductions, taxableEstate, tax, bracket };
}

export function calcGiftTax(input: GiftInput): GiftResult {
  const useEx = input.useAnnualExemption ?? true;
  const taxableGift = Math.max(0, input.giftAmount - (useEx ? TW.GIFT_ANNUAL_EXEMPTION : 0));
  const { tax, bracket } = applyBrackets(taxableGift, TW.GIFT_BRACKETS);
  return { taxableGift, tax, bracket };
}

/**
 * 簡易比較邏輯：
 * - 逐年贈與：years 年 × recipients × 年免稅額，先從遺產總額中扣除（不得小於0），再做遺產稅估算
 * - 組合方案：以「較積極的贈與」降低遺產底盤 + 保險作稅源預留（稅額不變但現金流改善），此處回傳兩組資訊
 */
export function simulateCompare(params: {
  grossEstate: number;
  numChildren: number;
  includeSpouse: boolean;
  years: number;            // 贈與年數（例如 10 年）
  recipients: number;       // 受贈人數（可含配偶、子女、孫子女）
}) {
  const base = calcEstateTax({
    grossEstate: params.grossEstate,
    numChildren: params.numChildren,
    includeSpouse: params.includeSpouse,
  });

  const totalGiftFree = params.years * params.recipients * TW.GIFT_ANNUAL_EXEMPTION;
  const estateAfterGifting = Math.max(0, params.grossEstate - totalGiftFree);

  const giftingEstate = calcEstateTax({
    grossEstate: estateAfterGifting,
    numChildren: params.numChildren,
    includeSpouse: params.includeSpouse,
  });

  // 組合：假設較積極贈與（再加碼 30% 受贈力道）後的估算
  const aggressiveGift = Math.max(0, estateAfterGifting - totalGiftFree * 0.3);
  const comboEstate = calcEstateTax({
    grossEstate: aggressiveGift,
    numChildren: params.numChildren,
    includeSpouse: params.includeSpouse,
  });

  return {
    baseline: base,
    giftingPlan: { ...giftingEstate, totalGiftFree },
    comboPlan: { ...comboEstate, totalGiftFree: totalGiftFree * 1.3, note: "贈與加碼 + 保險預留稅源/信託控管" },
  };
}
