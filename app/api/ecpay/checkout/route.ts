// app/api/ecpay/checkout/route.ts
import { NextRequest, NextResponse } from "next/server"
import { genCheckMacValue, getConfig, ecpayEndpoint, genTradeNo } from "../_lib"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const cfg = getConfig()
  const endpoint = ecpayEndpoint(cfg.mode)

  const body = await req.json().catch(() => ({} as any))
  const method = (body?.method || "Credit") as "Credit" | "CVS" | "ATM"

  const totalAmount = process.env.PRO_PRICE_TWD ? Number(process.env.PRO_PRICE_TWD) : 990 // NTD
  const itemName = process.env.PRO_ITEM_NAME || "AI Copilot Pro 專業版（月費）"
  const tradeNo = genTradeNo("PRO")

  const base: Record<string, string> = {
    MerchantID: cfg.merchantId,
    MerchantTradeNo: tradeNo,
    MerchantTradeDate: new Date().toISOString().replace("T", " ").slice(0, 19),
    PaymentType: "aio",
    TotalAmount: String(totalAmount),
    TradeDesc: "Copilot Pro Subscription",
    ItemName: itemName,
    ReturnURL: `${cfg.siteUrl}/api/ecpay/notify`, // server to server
    OrderResultURL: `${cfg.siteUrl}/copilot`,      // 使用者導回頁
    ClientBackURL: `${cfg.siteUrl}/copilot`,
    ChoosePayment: method,
    EncryptType: "1"
  }

  // CVS/ATM 需要繳費期限（分鐘）
  if (method === "CVS" || method === "ATM") {
    base["StoreExpireDate"] = process.env.PRO_STORE_EXPIRE_MIN || "4320" // 3 days
    // 你也可以加 PaymentInfoURL 接收取號資訊：`${cfg.siteUrl}/api/ecpay/info`
  }

  const CheckMacValue = genCheckMacValue(base, cfg.hashKey, cfg.hashIV)

  const html = `
<!doctype html>
<html lang="zh-Hant">
<head><meta charset="UTF-8"><title>Redirecting…</title></head>
<body onload="document.forms[0].submit()">
  <p>連線至金流中，請稍候…</p>
  <form method="post" action="${endpoint}">
    ${Object.entries(base).map(([k, v]) => `<input type="hidden" name="${k}" value="${String(v).replace(/"/g, "&quot;")}" />`).join("\n")}
    <input type="hidden" name="CheckMacValue" value="${CheckMacValue}" />
    <noscript><button type="submit">前往付款</button></noscript>
  </form>
</body>
</html>
`.trim()

  return NextResponse.json({ html, tradeNo, method })
}
