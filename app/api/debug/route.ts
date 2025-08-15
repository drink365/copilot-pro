// app/api/debug/route.ts
import { NextResponse } from "next/server"
import { checkDailyQuota, getDailyLimit, getUserPlan } from "@/lib/entitlements"

export const runtime = "edge"

export async function GET() {
  const plan = getUserPlan()
  const limit = getDailyLimit(plan)
  // 這邊不遞增，只讀目前 cookie 用量（為了避免 GET 造成副作用，我們額外讀 cookie）
  // 如果想看「下一次請求會不會被擋」，可以在前端呼叫 /api/chat 看返回的 quota 狀態
  return NextResponse.json({ plan, limit })
}
