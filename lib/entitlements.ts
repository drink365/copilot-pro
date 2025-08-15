import { cookies } from "next/headers"

export type Plan = "free" | "pro" | "pro_plus"

const DAILY_LIMIT: Record<Plan, number> = {
  free: 10,
  pro: 100,
  pro_plus: 300
}

export function getUserPlan(): Plan {
  const jar = cookies()
  const token = jar.get("proToken")?.value
  const secret = process.env.PRO_SECRET
  if (!secret) return "free"
  if (token === secret) return "pro"
  return "free"
}

export async function setUserPlan(plan: Plan) {
  const jar = cookies()
  if (plan === "free") {
    jar.delete("proToken")
    return
  }
  const secret = process.env.PRO_SECRET
  if (!secret) throw new Error("PRO_SECRET 未設定，無法升級方案")
  jar.set("proToken", secret, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  })
}

export function getDailyLimit(plan?: Plan): number {
  const p = plan ?? getUserPlan()
  return DAILY_LIMIT[p]
}

function todayKey() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `quota-${y}${m}${dd}`
}

export function checkDailyQuota(): { ok: boolean; used: number; limit: number } {
  const jar = cookies()
  const plan = getUserPlan()
  const limit = getDailyLimit(plan)
  const key = todayKey()

  const used = Number(jar.get(key)?.value || "0")
  if (used >= limit) return { ok: false, used, limit }

  const next = used + 1
  jar.set(key, String(next), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(new Date().setHours(23, 59, 59, 999))
  })
  return { ok: true, used: next, limit }
}
