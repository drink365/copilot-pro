// app/api/ecpay/checkout/route.ts
import { NextRequest, NextResponse } from "next/server"

// 這支 API 會依照 { method, plan, period } 建立 ECPay 訂單表單 HTML
// 注意：此為範例邏輯，請與你既有的 ECPay 參數組合整合（MerchantID、HashKey、HashIV 等）

type PayMethod = "Credit" | "CVS" | "ATM"
type Period = "monthly" | "yearly"
type PlanId = "pro" | "pro_plus"

const PRICES_TWD: Record<PlanId, Record<Period, number>> = {
  pro: { monthly: 490, yearly: 4900 },
  pro_plus: { monthly: 890, yearly: 8900 },
}

export async function POST(req: NextRequest) {
  try {
    const { method, plan, period } = await req.json() as {
      method: PayMethod
      plan: PlanId
      period: Period
    }

    if (!method || !plan || !period) {
      return NextResponse.json({ error: "缺少參數" }, { status: 400 })
    }

    const amount = PRICES_TWD[plan][period]
    const tradeNo = `CP${Date.now()}`

    // 這裡產生 ECPay 需要的表單內容（你既有的流程）
    // 範例：回傳一段 <form> 自動提交到綠界；為簡化示意，僅回傳模擬 HTML
    // 請將下方的 action / hidden fields 換成你的 ECPay 參數（包含 CheckMacValue）
    const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Redirecting...</title></head>
<body onload="document.forms[0].submit();">
  <form method="post" action="https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5">
    <input type="hidden" name="MerchantTradeNo" value="${tradeNo}">
    <input type="hidden" name="TotalAmount" value="${amount}">
    <input type="hidden" name="ChoosePayment" value="${method}">
    <input type="hidden" name="ItemName" value="${plan.toUpperCase()}-${period}">
    <input type="hidden" name="CustomField1" value="${plan}">
    <input type="hidden" name="CustomField2" value="${period}">
    <!-- 這裡要帶上你計算好的 CheckMacValue、MerchantID、ReturnURL、ClientBackURL 等欄位 -->
    <noscript><button type="submit">Continue</button></noscript>
  </form>
</body></html>
    `.trim()

    return NextResponse.json({ html, tradeNo })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "建立訂單失敗" }, { status: 500 })
  }
}
