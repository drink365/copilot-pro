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

  const payload: Record<string, string> = {
    MerchantID: cfg.merchantId,
    MerchantTradeNo,
    TimeStamp: String(Math.floor(Date.now() / 1000))
  }
  payload["CheckMacValue"] = genCheckMacValue(payload, cfg.hashKey, cfg.hashIV)

  const endpoint = ecpayQueryEndpoint(cfg.mode)
  const resp = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(payload)
  })
  const text = await resp.text()
  if (!resp.ok) {
    return NextResponse.json({ ok: false, error: "查詢失敗", detail: text }, { status: 500 })
  }

  // QueryTradeInfo 回應為 querystring 格式
  const pairs = new URLSearchParams(text)
  const TradeStatus = pairs.get("TradeStatus") // "1" 表示已付款
  const PaymentType = pairs.get("PaymentType") || ""
  const RtnMsg = pairs.get("RtnMsg") || ""
  const TradeAmt = pairs.get("TradeAmt") || ""

  if (TradeStatus !== "1") {
    return NextResponse.json({ ok: false, paid: false, message: RtnMsg || "尚未入帳", paymentType: PaymentType, amount: TradeAmt })
  }

  const res = NextResponse.json({ ok: true, paid: true, paymentType: PaymentType, amount: TradeAmt })
  res.cookies.set("proToken", proSecret, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 })
  return res
}
