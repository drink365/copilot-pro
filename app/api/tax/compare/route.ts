// app/api/tax/compare/route.ts
import { NextResponse } from "next/server";
import { simulateCompare } from "@/lib/tax/tw";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { grossEstate, numChildren, includeSpouse, years, recipients } = body ?? {};
    if (
      typeof grossEstate !== "number" ||
      typeof years !== "number" ||
      typeof recipients !== "number"
    ) {
      return NextResponse.json(
        { error: "grossEstate, years, recipients required" },
        { status: 400 }
      );
    }

    const data = simulateCompare({
      grossEstate,
      numChildren: Number.isFinite(numChildren) ? Number(numChildren) : 0,
      includeSpouse: !!includeSpouse,
      years,
      recipients,
    });

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "unknown" }, { status: 500 });
  }
}
