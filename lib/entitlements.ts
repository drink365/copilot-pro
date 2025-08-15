// lib/entitlements.ts
import { cookies } from "next/headers"
import { PLANS, type PlanId } from "./plans"

const COOKIE_PLAN = "cp_plan"
const COOKIE_COUNT = "cp_daily_count"
const COOKIE_DATE = "cp_daily_date"

export function getUserPlan(): PlanId {
  const c = cookies()
  const v = c.get(COOKIE_PLAN)?.value as PlanId | undefined
  if (v === "pro" || v === "pro_plus") return v
  return "free"
}

export async function setUserPlan(plan: PlanId) {
  const c = cookies()
  c.set(COOKIE_PLAN, plan, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365
  })
  // 重置每日計數
  c.set(COOKIE_COUNT, "0", { path: "/", httpOnly: true, sameSite: "lax" })
  c.set(COOKIE_DATE, "", { path: "/", httpOnly: true, sameSite: "lax" })
}

export function checkDailyQuota() {
  const c = cookies()
  const plan = getUserPlan()
  const limit = PLANS[plan].dailyFreeChats

  // 付費視為近乎無上限
  if (plan !== "free") return { ok: true, remaining: 999, used: 0, limit }

  const today = new Date().toISOString().slice(0, 10)
  const savedDay = c.get(COOKIE_DATE)?.value || ""
  let count = Number(c.get(COOKIE_COUNT)?.value || "0")
  if (savedDay !== today) {
    count = 0
  }
  if (count >= limit) {
    return { ok: false, remaining: 0, used: count, limit }
  }
  c.set(COOKIE_COUNT, String(count + 1), { path: "/", httpOnly: true, sameSite: "lax" })
  if (savedDay !== today) {
    c.set(COOKIE_DATE, today, { path: "/", httpOnly: true, sameSite: "lax" })
  }
  return { ok: true, remaining: limit - (count + 1), used: count + 1, limit }
}
