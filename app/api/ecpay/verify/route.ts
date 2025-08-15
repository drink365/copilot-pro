// app/api/ecpay/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { setUserPlan } from "@/lib/entitlements";

// 你應該已經有 ECPay 驗證邏輯
// 在驗證成功的地方加上 setUserPlan()

export async function GET(req: NextRequest) {
  // TODO: 這裡是你的 ECPay 驗證流程
  // 驗證成功後：
  await setUserPlan("pro"); // 如果是 Pro+
  // await setUserPlan("pro_plus");

  return NextResponse.json({ ok: true });
}
