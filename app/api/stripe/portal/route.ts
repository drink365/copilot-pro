// app/api/stripe/portal/route.ts
import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

export async function POST(req: NextRequest) {
  const sk = process.env.STRIPE_SECRET_KEY
  const site = process.env.SITE_URL
  const customer = req.cookies.get("stripeCustomer")?.value

  if (!sk || !site) {
    return NextResponse.json({ error: "Stripe/SITE_URL 環境變數未設定完整" }, { status: 500 })
  }
  if (!customer) {
    return NextResponse.json({ error: "找不到客戶資訊，尚未完成升級？" }, { status: 400 })
  }

  const resp = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${sk}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      customer,
      return_url: `${site}/copilot`
    })
  })
  const data = await resp.json()
  if (!resp.ok) {
    return NextResponse.json({ error: data?.error?.message || "建立 Portal 失敗" }, { status: 500 })
  }
  return NextResponse.json({ url: data.url })
}
