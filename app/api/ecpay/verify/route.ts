// app/api/ecpay/verify/route.ts
import { NextRequest, NextResponse } from "next/server"
import { setUserPlan } from "@/lib/entitlements"
// ...（你原本的驗證邏輯）

export async function GET(req: NextRequest) {
  // 1) 驗證 ECPay 回傳參數 + 檢核 CheckMacValue（略，沿用你現有）
  // 2) 若 RtnCode === 1 且交易有效：
  await setUserPlan("pro") // 或 "pro_plus"
  return NextResponse.json({ ok: true })
}
