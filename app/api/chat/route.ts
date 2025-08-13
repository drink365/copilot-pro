import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

const SYSTEM_PROMPT = `
你是「AI Copilot Pro｜永傳家族傳承教練」：
- 專長：壽險策略（定壽/終壽/投資型/增額/信託搭配）、稅源預留、遺贈稅邏輯、跨境情境、企業接班。
- 風格：專業、精準、具結構；口吻溫暖不推銷；輸出條列，含步驟與風險提醒。
- 場景：幫顧問快速產出可拿給客戶的內容（話術、會議大綱、清單、比較表、注意事項）。
- 禁忌：不要虛構法規或稅率；不提供違法/逃漏稅建議；不做醫療建議。
- 如果使用者需要可下載提案/簡報，請提示：升級專業版可一鍵匯出 PDF/PPT。
`

function getDateKey() {
  const d = new Date()
  return `${d.getUTCFullYear()}-${d.getUTCMonth()+1}-${d.getUTCDate()}`
}

export async function POST(req: NextRequest) {
  const { content } = await req.json()
  if (!content || typeof content !== "string") {
    return NextResponse.json({ error: "缺少 content" }, { status: 400 })
  }

  // 免費方案：每日 3 次（以 cookie + UTC 日期做簡易限制）
  const dateKey = getDateKey()
  const cookieKey = `copilot_uses_${dateKey}`
  const current = Number(req.cookies.get(cookieKey)?.value || "0")
  if (current >= 3) {
    return NextResponse.json({
      error: "今日免費互動次數已用完。升級專業版可解除限制，並解鎖提案/PDF匯出與情境模板。"
    }, { status: 402 })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY 未設定" }, { status: 500 })
  }

  // 呼叫 OpenAI
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content }
      ]
    })
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    return NextResponse.json({ error: `上游錯誤：${res.status} ${text}` }, { status: 500 })
  }

  const data = await res.json()
  const reply = data.choices?.[0]?.message?.content || "（沒有回應內容）"
  const response = NextResponse.json({ reply })

  // 累計次數（cookie 24h）
  response.cookies.set(cookieKey, String(current + 1), { maxAge: 60 * 60 * 24, path: "/" })
  return response
}
