// app/api/ecpay/query/route.ts
import { NextRequest, NextResponse } from "next/server"
import { ecpayQueryEndpoint, genCheckMacValue, getConfig } from "../_lib"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const cfg = getConfig()
  const proSecret = process.env.PRO_SECRET
  if (!proSecret) return NextResponse.json({ ok: false, error: "PRO_SECRET 未設定" }, { status: 500 })

  const url = new URL(req.url)
  const MerchantTradeNo = url.searchParams.get("MerchantTradeNo")
  if (!MerchantTradeNo) {
    return NextResponse.json({ ok: false, error: "缺少 MerchantTradeNo" }, { status: 400 })
  }

  const pairs: Record<string, string> = {
    MerchantID: cfg.merchantId,
    MerchantTradeNo,
    TimeStamp: String(Math.floor(Date.now() / 1000))
  }
  const CheckMacValue = genCheckMacValue(pairs, cfg.hashKey, cfg.hashIV)
  const body = new URLSearchParams({ ...pairs, CheckMacValue })

  const res0 = await fetch(ecpayQueryEndpoint(cfg.mode), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  })
  const text = await res0.text()

  const data = new URLSearchParams(text)
  const TradeStatus = data.get("TradeStatus") // "1" 表示已付款
  const PaymentType = data.get("PaymentType") || ""
  const RtnMsg = data.get("RtnMsg") || ""
  const TradeAmt = data.get("TradeAmt") || ""

  if (TradeStatus !== "1") {
    return NextResponse.json({ ok: false, paid: false, message: RtnMsg || "尚未入帳", paymentType: PaymentType, amount: TradeAmt })
  }

  const res = NextResponse.json({ ok: true, paid: true, paymentType: PaymentType, amount: TradeAmt })
  res.cookies.set("proToken", proSecret, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 })
  return res
}
