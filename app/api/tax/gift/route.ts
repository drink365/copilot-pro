// app/api/tax/gift/route.ts
import { NextResponse } from "next/server";
import { calcGiftTax } from "@/lib/tax/tw";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { giftAmount, useAnnualExemption } = body ?? {};
    if (typeof giftAmount !== "number") {
      return NextResponse.json({ error: "giftAmount required" }, { status: 400 });
    }

    const result = calcGiftTax({ giftAmount, useAnnualExemption });
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "unknown" }, { status: 500 });
  }
}
