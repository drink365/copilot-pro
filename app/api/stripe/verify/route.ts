// app/api/stripe/verify/route.ts
import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

export async function GET(req: NextRequest) {
  const sk = process.env.STRIPE_SECRET_KEY
  const proSecret = process.env.PRO_SECRET
  const { searchParams } = new URL(req.url)
  const session_id = searchParams.get("session_id")

  if (!sk || !proSecret) {
    return NextResponse.json({ ok: false, error: "環境變數未設定完整" }, { status: 500 })
  }
  if (!session_id) {
    return NextResponse.json({ ok: false, error: "缺少 session_id" }, { status: 400 })
  }

  const resp = await fetch(`https://api.stripe.com/v1/checkout/sessions/${session_id}`, {
    headers: { "Authorization": `Bearer ${sk}` }
  })
  const data = await resp.json()

  if (!resp.ok) {
    return NextResponse.json({ ok: false, error: data?.error?.message || "查詢失敗" }, { status: 400 })
  }

  const paid = (data.status === "complete") && (data.payment_status === "paid" || !!data.subscription)
  if (!paid) {
    return NextResponse.json({ ok: false, error: "未完成付款" }, { status: 402 })
  }

  const res = NextResponse.json({ ok: true })
  // —— 發 Pro Cookie（簡化處理）——
  res.cookies.set("proToken", proSecret, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 })
  if (data.customer) {
    res.cookies.set("stripeCustomer", String(data.customer), { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 })
  }
  return res
}
