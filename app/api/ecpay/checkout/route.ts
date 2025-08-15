// app/api/ecpay/checkout/route.ts
import { NextRequest, NextResponse } from "next/server"

// 範例：回傳一段提交到 ECPay 的 HTML 表單（實務需帶入商店參數與 CheckMacValue）
type PayMethod = "Credit" | "CVS" | "ATM"
type Period = "monthly" | "yearly"
type PlanId = "pro" | "pro_plus"

const PRICES_TWD: Record<PlanId, Record<Period, number>> = {
  pro: { monthly: 490, yearly: 4900 },
  pro_plus: { monthly: 890, yearly: 8900 },
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const method: PayMethod = (body?.method || "Credit")
    const plan: PlanId = (body?.plan || "pro")
    const period: Period = (body?.period || "monthly")
    const amt = PRICES_TWD[plan][period]

    const html = `<!doctype html><html><body>
  <form id="f" method="post" action="https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5">
    <input type="hidden" name="MerchantID" value="PLEASE_SET" />
    <input type="hidden" name="MerchantTradeNo" value="${Date.now()}" />
    <input type="hidden" name="MerchantTradeDate" value="${new Date().toISOString().slice(0,19).replace('T',' ')}" />
    <input type="hidden" name="PaymentType" value="aio" />
    <input type="hidden" name="TotalAmount" value="${amt}" />
    <input type="hidden" name="TradeDesc" value="Copilot Pro" />
    <input type="hidden" name="ItemName" value="${plan.toUpperCase()}-${period}" />
    <input type="hidden" name="ChoosePayment" value="${method}" />
    <!-- 你需要補上 ReturnURL / ClientBackURL / CheckMacValue 等 -->
    <noscript><button type="submit">Continue</button></noscript>
  </form>
  <script>document.getElementById("f").submit()</script>
</body></html>`

    return NextResponse.json({ html })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "建立訂單失敗" }, { status: 500 })
  }
}
