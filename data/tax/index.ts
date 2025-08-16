// data/tax/index.ts
import estate from "./tw.estate.json";
import gift from "./tw.gift.json";

/**
 * 統一的稅制資料模型：
 * {
 *   estate: { brackets: [{ up_to, rate, quick_deduction? }...], basic_exemption, spouse, funeral },
 *   gift:   { brackets: [{ up_to, rate, quick_deduction? }...], annual_exemption }
 * }
 */
export const TAX_DATA = {
  estate,
  gift,
} as const;

export type TaxData = typeof TAX_DATA;
