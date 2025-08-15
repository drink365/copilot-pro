// app/api/ecpay/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { setUserPlan } from "@/lib/entitlements";

export const runtime = "nodejs"

export async function GET(_req: NextRequest) {
  // TODO：正式上線時請依你的交易流程驗證（可查詢 /api/ecpay/query）
  // 這裡僅示範付款完成後設定方案：
  await setUserPlan("pro"); // Pro+
  // await setUserPlan("pro_plus");

  return NextResponse.redirect(new URL("/pricing?success=1", process.env.SITE_URL || "https://example.com"));
}
