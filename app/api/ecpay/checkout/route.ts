// app/api/ecpay/checkout/route.ts
import { NextRequest, NextResponse } from "next/server"
import { ecpayEndpoint, genCheckMacValue, getConfig, genTradeNo } from "../_lib"

export const runtime = "nodejs"

type PayMethod = "Credit" | "CVS" | "ATM"
type Period = "monthly" | "yearly"
type PlanId = "pro" | "pro_plus"

const PRICES_TWD: Record<PlanId, Record<Period, number>> = {
  pro: { monthly: 490, yearly: 4900 },
  pro_plus: { monthly: 890, yearly: 8900 },
}

export async function POST(req: NextRequest) {
  try {
    const cfg = getConfig()
    const body = await req.json()
    const method: PayMethod = (body?.method || "Credit")
    const plan: PlanId = (body?.plan || "pro")
    const period: Period = (body?.period || "monthly")
    const amt = PRICES_TWD[plan][period]

    const MerchantTradeNo = genTradeNo(plan === "pro" ? "PRO" : "PRP")
    const MerchantTradeDate = new Date().toISOString().slice(0, 19).replace("T", " ")

    const basePairs: Record<string, string> = {
      MerchantID: cfg.merchantId,
      MerchantTradeNo,
      MerchantTradeDate,
      PaymentType: "aio",
      TotalAmount: String(amt),
      TradeDesc: `Copilot ${plan} ${period}`,
      ItemName: `Copilot ${plan} ${period}`,
      ReturnURL: `${cfg.siteUrl}/api/ecpay/notify`,
      ChoosePayment: method,
      ClientBackURL: `${cfg.siteUrl}/pricing?done=1`,
      OrderResultURL: `${cfg.siteUrl}/api/ecpay/verify`, // 付款完成頁（可改成你的成功頁）
      EncryptType: "1",
    }

    const CheckMacValue = genCheckMacValue(basePairs, cfg.hashKey, cfg.hashIV)
    const action = ecpayEndpoint(cfg.mode)

    const html = `<!doctype html><html><body>
      <form id="f" method="post" action="${action}">
        ${Object.entries({ ...basePairs, CheckMacValue })
          .map(([k, v]) => `<input type="hidden" name="${k}" value="${String(v)}" />`)
          .join("\n")}
      </form>
      <script>document.getElementById('f').submit()</script>
    </body></html>`

    return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "未知錯誤" }, { status: 500 })
  }
}
