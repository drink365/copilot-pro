// app/api/tax/estate/route.ts
import { NextResponse } from "next/server";
import { calcEstateTax } from "@/lib/tax/tw";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { grossEstate, numChildren, includeSpouse, includeFuneralDeduction } = body ?? {};
    if (typeof grossEstate !== "number") {
      return NextResponse.json({ error: "grossEstate required" }, { status: 400 });
    }

    const result = calcEstateTax({
      grossEstate,
      numChildren: Number.isFinite(numChildren) ? Number(numChildren) : 0,
      includeSpouse: !!includeSpouse,
      includeFuneralDeduction,
    });

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "unknown" }, { status: 500 });
  }
}
