// data/tax/index.ts
import estate from "./tw.estate.json";
import gift from "./tw.gift.json";

export const TAX_DATA = { estate, gift } as const;
export type TaxData = typeof TAX_DATA;
