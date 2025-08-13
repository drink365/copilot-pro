import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

const SYSTEM_PROMPT = `
你是「AI Copilot Pro｜永傳家族傳承教練」：
- 專長：壽險策略（定壽/終壽/投資型/增額/信託搭配）、稅源預留、遺贈稅邏輯、跨境情境、企業接班。
- 風格：專業、精準、具結構；口吻溫暖不推銷；輸出條列，含步驟與風險提醒。
- 場景：幫顧問快速產出可拿給客戶的內容（話術、會議大綱、清單、比較表、注意事項）。
- 禁忌：不要虛構法規或稅率；不提供違法/逃漏稅建議；不做醫療建議。
- 若使用者想下載提案或簡報：提示升級專業版可一鍵匯出 PDF/PPT。
`

function getDateKey() {
  const d = new Date()
  return `${d.getUTCFullYear()}-${d.getUTCMonth()+1}-${d.getUTCDate()}`
}

type Provider = "openrouter" | "groq" | "together" | "openai"

// 依供應商回傳 endpoint、headers
function providerConfig(p: Provider) {
  const model = process.env.MODEL_ID
  if (!model) throw new Error("MODEL_ID 未設定")

  if (p === "openrouter") {
    const key = process.env.OPENROUTER_API_KEY
    if (!key) throw new Error("OPENROUTER_API_KEY 未設定")
    return {
      url: "https://openrouter.ai/api/v1/chat/completions",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
        // 這兩個不是強制，但建議帶，有助審核
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "",
        "X-Title": process.env.OPENROUTER_APP_NAME || "AI Copilot Pro"
      },
      model
    }
  }

  if (p === "groq") {
    const key = process.env.GROQ_API_KEY
    if (!key) throw new Error("GROQ_API_KEY 未設定")
    return {
      // Groq 提供 OpenAI 相容端點
      url: "https://api.groq.com/openai/v1/chat/completions",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      model
    }
  }

  if (p === "together") {
    const key = process.env.TOGETHER_API_KEY
    if (!key) throw new Error("TOGETHER_API_KEY 未設定")
    return {
      url: "https://api.together.xyz/v1/chat/completions",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      model
    }
  }

  // 預留回 OpenAI 的情境
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error("OPENAI_API_KEY 未設定")
  return {
    url: "https://api.openai.com/v1/chat/completions",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json"
    },
    model: model || "gpt-4o-mini"
  }
}

export async function POST(req: NextRequest) {
  const { content } = await req.json()
  if (!content || typeof content !== "string") {
    return NextResponse.json({ error: "缺少 content" }, { status: 400 })
  }

  // 免費：每日 3 次
  const dateKey = getDateKey()
  const cookieKey = `copilot_uses_${dateKey}`
  const current = Number(req.cookies.get(cookieKey)?.value || "0")
  if (current >= 3) {
    return NextResponse.json({
      error: "今日免費互動次數已用完。升級專業版可解除限制，並解鎖提案/PDF匯出與情境模板。"
    }, { status: 402 })
  }

  // 讀供應商
  const provider = (process.env.PROVIDER || "openrouter") as Provider
  let cfg
  try {
    cfg = providerConfig(provider)
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "供應商設定錯誤" }, { status: 500 })
  }

  // 呼叫對應供應商
  const res = await fetch(cfg.url, {
    method: "POST",
    headers: cfg.headers as any,
    body: JSON.stringify({
      model: cfg.model,
      temperature: 0.3,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content }
      ]
    })
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    // 429/配額類錯誤直接回傳訊息，避免前端卡死
    return NextResponse.json({ error: `上游錯誤：${res.status} ${text}` }, { status: 502 })
  }

  const data = await res.json()
  const reply =
    data.choices?.[0]?.message?.content ||
    data.output?.choices?.[0]?.message?.content ||
    "（沒有回應內容）"

  const response = NextResponse.json({ reply })
  response.cookies.set(cookieKey, String(current + 1), { maxAge: 60 * 60 * 24, path: "/" })
  return response
}
