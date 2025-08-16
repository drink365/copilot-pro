// app/api/tax/gift/route.ts
import { NextResponse } from "next/server";
import { calcGiftFree, TWD } from "@/lib/tax/tw";

/**
 * 贈與免稅量化 API（不計贈與稅額，只回傳「免稅可搬出的總額」）
 * 請求 JSON：
 * {
 *   "years": number,        // 贈與年數
 *   "recipients": number,   // 受贈人數
 *   "grossEstate": number   // 用來限制上限（可選）
 * }
 * 回應 JSON：
 * {
 *   "totalGiftFree": number, // 逐年免稅可搬出總額
 *   "cappedByEstate": boolean
 * }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const years = Number(body?.years ?? 0);
    const recipients = Number(body?.recipients ?? 0);
    const grossEstate = body?.grossEstate != null ? Number(body.grossEstate) : null;

    if (Number.isNaN(years) || Number.isNaN(recipients) || years < 0 || recipients < 0) {
      return NextResponse.json({ error: "years / recipients 需為非負數" }, { status: 400 });
    }

    let totalGiftFree = calcGiftFree(years, recipients);
    let cappedByEstate = false;
    if (grossEstate != null && !Number.isNaN(grossEstate) && grossEstate >= 0) {
      if (totalGiftFree > grossEstate) {
        totalGiftFree = TWD(grossEstate);
        cappedByEstate = true;
      }
    }

    return NextResponse.json({ totalGiftFree, cappedByEstate });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "unknown" }, { status: 500 });
  }
}
