// app/api/stripe/checkout/route.ts
import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

export async function POST(_req: NextRequest) {
  const sk = process.env.STRIPE_SECRET_KEY
  const priceId = process.env.STRIPE_PRICE_ID
  const site = process.env.SITE_URL
  if (!sk || !priceId || !site) {
    return NextResponse.json({ error: "Stripe/SITE_URL 環境變數未設定完整" }, { status: 500 })
  }

  const resp = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${sk}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      mode: "subscription",
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      success_url: `${site}/copilot?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}/copilot`
    })
  })
  const data = await resp.json()
  if (!resp.ok) {
    return NextResponse.json({ error: data?.error?.message || "建立結帳連結失敗" }, { status: 500 })
  }
  return NextResponse.json({ url: data.url })
}
