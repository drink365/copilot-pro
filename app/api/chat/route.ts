// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { checkDailyQuota, getUserPlan } from "@/lib/entitlements";

export const runtime = "edge"; // 建議 Edge Runtime

export async function POST(req: NextRequest) {
  try {
    // 1) 免費配額檢查
    const quota = await checkDailyQuota();
    if (!quota.ok) {
      return NextResponse.json(
        {
          error: `今日免費次數已用完（上限 ${quota.limit} 次）。請升級 Pro 解鎖無限次數與匯出功能。`
        },
        { status: 402 }
      );
    }

    const { content } = await req.json();
    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "缺少 content" }, { status: 400 });
    }

    // 2) 呼叫 Groq API
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "未設定 GROQ_API_KEY" }, { status: 500 });
    }

    const model = process.env.GROQ_MODEL_ID || "llama-3.1-8b-instant";

    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "你是專精於家族傳承、保單結構、台美跨境稅務的助理。請用條列、標題與表格呈現重點，最後給出行動清單。"
          },
          { role: "user", content }
        ],
        temperature: 0.3
      })
    });

    const data = await r.json();
    if (!r.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "上游模型錯誤" },
        { status: 500 }
      );
    }

    const plan = await getUserPlan();
    const reply = data?.choices?.[0]?.message?.content || "（沒有回覆）";
    return NextResponse.json({ reply, isPro: plan !== "free" });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "未知錯誤" },
      { status: 500 }
    );
  }
}
