// app/api/tax/estimate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { estimateEstateTW, estimateGiftTW } from "@/lib/estate-gift";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    if (payload?.type === "estate") {
      const r = estimateEstateTW({
        jurisdiction: "TW",
        gross_estate: Number(payload.gross_estate || 0),
        debts: Number(payload.debts || 0),
        funeral_expense: Number(payload.funeral_expense || 0),
        life_insurance_payout: Number(payload.life_insurance_payout || 0),
        spouse_count: Number(payload.spouse_count || 0),
        lineal_descendants: Number(payload.lineal_descendants || 0),
        lineal_ascendants: Number(payload.lineal_ascendants || 0),
        disabled_count: Number(payload.disabled_count || 0),
      });
      return NextResponse.json({ ok: true, result: r });
    }

    if (payload?.type === "gift") {
      const r = estimateGiftTW({
        jurisdiction: "TW",
        gifts_amount: Number(payload.gifts_amount || 0),
        spouse_split: !!payload.spouse_split,
        minor_children: Number(payload.minor_children || 0),
      });
      return NextResponse.json({ ok: true, result: r });
    }

    return NextResponse.json({ ok: false, error: "缺少或不支援的 type" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "未知錯誤" }, { status: 500 });
  }
}
