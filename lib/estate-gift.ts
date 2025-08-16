// lib/estate-gift.ts
// 統一從 data/tax 匯入模型，不要寫到 /index，避免環境對資料夾索引解析差異
import { TAX_DATA } from "@/data/tax";

type RateBracket = { up_to: number | null; rate: number; quick_deduction?: number };
type RateModel = {
  estate: { brackets: RateBracket[]; basic_exemption: number; spouse: number; funeral: number };
  gift:   { brackets: RateBracket[]; annual_exemption: number };
};

const MODEL = TAX_DATA as RateModel;

/** 依遺產稅級距取 bracket（可擴充速算扣除） */
export function getEstateBracket(taxable: number) {
  for (const b of MODEL.estate.brackets) {
    if (b.up_to === null || taxable <= b.up_to) return b;
  }
  return MODEL.estate.brackets[MODEL.estate.brackets.length - 1];
}

/** 依贈與稅級距取 bracket */
export function getGiftBracket(taxable: number) {
  for (const b of MODEL.gift.brackets) {
    if (b.up_to === null || taxable <= b.up_to) return b;
  }
  return MODEL.gift.brackets[MODEL.gift.brackets.length - 1];
}

/** 範例：按級距計稅（速算扣除 quick_deduction 可依需要補） */
export function calcByBracket(taxable: number, kind: "estate" | "gift") {
  const b = kind === "estate" ? getEstateBracket(taxable) : getGiftBracket(taxable);
  const tax = Math.round(taxable * (b.rate / 100) - (b.quick_deduction || 0));
  return { bracket: b.rate, tax: Math.max(0, tax) };
}
