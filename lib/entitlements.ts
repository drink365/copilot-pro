// lib/entitlements.ts
import { cookies } from "next/headers";
import { PLANS, type PlanId } from "./plans";
import crypto from "crypto";

const COOKIE_NAME = "cp_plan";
const COOKIE_COUNT = "cp_daily_count";
const COOKIE_DATE = "cp_daily_date";

const ONE_YEAR = 365 * 24 * 60 * 60;

function sign(value: string) {
  const secret = process.env.ADMIN_SECRET || "dev-secret";
  const h = crypto.createHmac("sha256", secret).update(value).digest("hex");
  return `${value}.${h}`;
}

function verify(signed: string | undefined): string | null {
  if (!signed) return null;
  const [value, sig] = signed.split(".");
  const secret = process.env.ADMIN_SECRET || "dev-secret";
  const h = crypto.createHmac("sha256", secret).update(value).digest("hex");
  return h === sig ? value : null;
}

export async function getUserPlan(): Promise<PlanId> {
  const c = cookies();
  const raw = c.get(COOKIE_NAME)?.value;
  const plan = verify(raw) as PlanId | null;
  return (plan && PLANS[plan]) ? plan : "free";
}

export async function setUserPlan(plan: PlanId) {
  const c = cookies();
  c.set(COOKIE_NAME, sign(plan), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR
  });
}

export async function checkDailyQuota(): Promise<{
  ok: boolean;
  remaining: number;
  used: number;
  limit: number;
}> {
  const plan = await getUserPlan();
  const limit = PLANS[plan].dailyFreeChats;

  // Pro / Pro+ 無限制
  if (plan !== "free") return { ok: true, remaining: 999, used: 0, limit };

  const c = cookies();
  const today = new Date().toISOString().slice(0, 10);
  const savedDay = c.get(COOKIE_DATE)?.value || "";
  let count = parseInt(c.get(COOKIE_COUNT)?.value || "0", 10);

  if (savedDay !== today) {
    count = 0;
    c.set(COOKIE_DATE, today, { path: "/", httpOnly: true, sameSite: "lax" });
  }

  if (count >= limit) {
    return { ok: false, remaining: 0, used: count, limit };
  }

  c.set(COOKIE_COUNT, String(count + 1), {
    path: "/",
    httpOnly: true,
    sameSite: "lax"
  });
  if (!savedDay) {
    c.set(COOKIE_DATE, today, { path: "/", httpOnly: true, sameSite: "lax" });
  }

  return { ok: true, remaining: limit - (count + 1), used: count + 1, limit };
}
