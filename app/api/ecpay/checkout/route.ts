// app/api/ecpay/checkout/route.ts
import { NextRequest, NextResponse } from "next/server"
import { genCheckMacValue, getConfig, ecpayEndpoint, genTradeNo } from "../_lib"

export const runtime = "nodejs"

export async function POST(_req: NextRequest) {
  const cfg = getConfig()
  const endpoint = ecpayEndpoint(cfg.mode)

  // 你可以把金額/商品名稱抽到 .env 或資料表
  const totalAmount = process.env.PRO_PRICE_TWD ? Number(process.env.PRO_PRICE_TWD) : 990 // NTD
  const itemName = process.env.PRO_ITEM_NAME || "AI Copilot Pro 專業版（月費）"

  // ECPay 必填參數（AIO v5）
  const form: Record<string, string> = {
    MerchantID: cfg.merchantId,
    MerchantTradeNo: genTradeNo("PRO"),
    MerchantTradeDate: new Date().toISOString().replace("T", " ").slice(0, 19), // yyyy-MM-dd HH:mm:ss
    PaymentType: "aio",
    TotalAmount: String(totalAmount),
    TradeDesc: "Copilot Pro Subscription",
    ItemName: itemName,
    ReturnURL: `${cfg.siteUrl}/api/ecpay/notify`,            // 伺服器背景通知
    OrderResultURL: `${cfg.siteUrl}/copilot`,                 // 付款完成導回頁（帶結果）
    ClientBackURL: `${cfg.siteUrl}/copilot`,                  // 使用者取消或返回
    ChoosePayment: "ALL",
    EncryptType: "1" // 1=SHA256
  }

  // 產生 CheckMacValue
  const CheckMacValue = genCheckMacValue(form, cfg.hashKey, cfg.hashIV)

  // 回傳可自動送出的 HTML（前端新視窗寫入）
  const html = `
<!doctype html>
<html lang="zh-Hant">
<head><meta charset="UTF-8"><title>Redirecting…</title></head>
<body onload="document.forms[0].submit()">
  <p>連線至金流中，請稍候…</p>
  <form method="post" action="${endpoint}">
    ${Object.entries(form).map(([k, v]) => `<input type="hidden" name="${k}" value="${String(v).replace(/"/g, "&quot;")}" />`).join("\n")}
    <input type="hidden" name="CheckMacValue" value="${CheckMacValue}" />
    <noscript><button type="submit">前往付款</button></noscript>
  </form>
</body>
</html>
`.trim()

  return NextResponse.json({ html })
}
