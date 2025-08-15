// data/tax/index.ts
import twEstate from "./tw.estate.json";
import twGift from "./tw.gift.json";

// 之後要擴充其他國家/稅目，照這個 pattern import & 加進 TAX_DATA 即可
export const TAX_DATA = {
  TW: {
    estate: twEstate,
    gift: twGift,
  },
} as const;

export type TaxDataRoot = typeof TAX_DATA;
