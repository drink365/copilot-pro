// app/api/ecpay/verify/route.ts
import { NextRequest, NextResponse } from "next/server"
import { genCheckMacValue, getConfig } from "../_lib"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const cfg = getConfig()
  const proSecret = process.env.PRO_SECRET
  if (!proSecret) {
    return NextResponse.json({ ok: false, error: "PRO_SECRET 未設定" }, { status: 500 })
  }

  const url = new URL(req.url)
  // ECPay 回傳的可能參數（實際會依支付方式不同略有差異）
  const params = Object.fromEntries(url.searchParams.entries())

  // 1) 基本狀態
  const rtn = params["RtnCode"] // "1" 表成功
  if (rtn !== "1") {
    return NextResponse.json({ ok: false, error: "未完成付款", detail: params }, { status: 402 })
  }

  // 2) 驗證 CheckMacValue
  // 注意：ECPay 導回頁有時不附 CheckMacValue；若你的方案沒帶回，可改走 /api/ecpay/notify 實作驗證後，前端改用輪詢
  if (params["CheckMacValue"]) {
    const copy = { ...params }
    delete copy["CheckMacValue"]
    const local = genCheckMacValue(copy, cfg.hashKey, cfg.hashIV)
    if (local !== params["CheckMacValue"]) {
      return NextResponse.json({ ok: false, error: "CheckMacValue 不符" }, { status: 400 })
    }
  }

  // 3) 簽發 Pro Cookie（30天）
  const res = NextResponse.json({ ok: true })
  res.cookies.set("proToken", proSecret, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 })
  // 可選：若你想記住客戶代號，可從 params 取出 CustomField1~4
  return res
}
