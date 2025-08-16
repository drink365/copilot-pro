// lib/estate-gift.ts
import { TAX_DATA } from "@/data/tax/index";

type RateBracket = { up_to: number | null; rate: number; quick_deduction?: number };
type RateModel = {
  estate: { brackets: RateBracket[]; basic_exemption: number; spouse: number; funeral: number };
  gift:   { brackets: RateBracket[]; annual_exemption: number };
};

const MODEL = TAX_DATA as RateModel;

/** 取得遺產稅級距（含速算扣除可自行擴充） */
export function getEstateBracket(taxable: number) {
  for (const b of MODEL.estate.brackets) {
    if (b.up_to === null || taxable <= b.up_to) return b;
  }
  return MODEL.estate.brackets[MODEL.estate.brackets.length - 1];
}

/** 取得贈與稅級距 */
export function getGiftBracket(taxable: number) {
  for (const b of MODEL.gift.brackets) {
    if (b.up_to === null || taxable <= b.up_to) return b;
  }
  return MODEL.gift.brackets[MODEL.gift.brackets.length - 1];
}

/** 範例：依級距計稅（可擴充速算扣除） */
export function calcByBracket(taxable: number, kind: "estate" | "gift") {
  const b = kind === "estate" ? getEstateBracket(taxable) : getGiftBracket(taxable);
  const tax = Math.round(taxable * (b.rate / 100) - (b.quick_deduction || 0));
  return { bracket: b.rate, tax: Math.max(0, tax) };
}
