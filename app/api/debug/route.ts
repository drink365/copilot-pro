import { NextResponse } from "next/server"
import { getDailyLimit, getUserPlan } from "@/lib/entitlements"

export const runtime = "edge"

export async function GET() {
  const plan = getUserPlan()
  const limit = getDailyLimit(plan)
  return NextResponse.json({ plan, limit })
}
