import { NextRequest, NextResponse } from "next/server"
import { setUserPlan } from "@/lib/entitlements"

export const runtime = "edge"

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const secret = url.searchParams.get("secret") || ""
  const plan = (url.searchParams.get("plan") || "pro") as "free" | "pro" | "pro_plus"

  if (!process.env.ADMIN_SECRET) {
    return NextResponse.json({ ok: false, error: "ADMIN_SECRET 未設定" }, { status: 500 })
  }
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ ok: false, error: "密鑰不正確" }, { status: 401 })
  }

  await setUserPlan(plan)
  return NextResponse.json({ ok: true, plan })
}
