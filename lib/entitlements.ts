// lib/entitlements.ts
import { cookies } from "next/headers"

export type Plan = "free" | "pro" | "pro_plus"

const DAILY_LIMIT: Record<Plan, number> = {
  free: 10,      // 自行調整
  pro: 100,      // 自行調整
  pro_plus: 300, // 自行調整
}

// 讀取目前方案：依據 proToken 與 PRO_SECRET 比對
export function getUserPlan(): Plan {
  const jar = cookies()
  const token = jar.get("proToken")?.value
  const secret = process.env.PRO_SECRET
  if (!secret) return "free"
  if (token === secret) return "pro" // 你要把 pro_plus 也用同一把 key 也可以在此細分
  return "free"
}

// 設定方案（會直接寫 cookie）。在 Route Handler 或 Server Action 內呼叫即可。
export async function setUserPlan(plan: Plan) {
  const jar = cookies()
  if (plan === "free") {
    jar.delete("proToken")
    return
  }
  const secret = process.env.PRO_SECRET
  if (!secret) throw new Error("PRO_SECRET 未設定，無法升級方案")
  // 注意：這裡簡化為同一把 proToken，若要區分 pro / pro_plus 可用不同 secret 或在 cookie 中序列化方案
  jar.set("proToken", secret, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 天
  })
}

// 取得每日上限
export function getDailyLimit(plan?: Plan): number {
  const p = plan ?? getUserPlan()
  return DAILY_LIMIT[p]
}

// 讀寫今日用量的 cookie key
function todayKey() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `quota-${y}${m}${dd}`
}

// 檢查與遞增配額：回傳 { ok, used, limit }；若達上限 ok=false
export function checkDailyQuota(): { ok: boolean; used: number; limit: number } {
  const jar = cookies()
  const plan = getUserPlan()
  const limit = getDailyLimit(plan)
  const key = todayKey()

  const used = Number(jar.get(key)?.value || "0")
  if (used >= limit) {
    return { ok: false, used, limit }
  }

  // 尚未達上限 → 立刻 +1 並寫回 cookie
  const next = used + 1
  jar.set(key, String(next), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    // 設置到今日 23:59:59 到期
    expires: new Date(new Date().setHours(23, 59, 59, 999)),
  })

  return { ok: true, used: next, limit }
}
