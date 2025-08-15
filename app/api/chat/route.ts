// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { checkDailyQuota, getUserPlan } from "@/lib/entitlements";
import { resolveTaxFacts } from "@/lib/tax-resolver";
import { estimateEstateTW, estimateGiftTW } from "@/lib/estate-gift";

export const runtime = "edge";

function roughNumberIn(text: string): number | null {
  const m = text.replace(/[,，]/g, "").match(/([0-9]+(?:\.[0-9]+)?)/);
  return m ? Number(m[1]) : null;
}

export async function POST(req: NextRequest) {
  try {
    // 配額（Free/Pro）
    const quota = await checkDailyQuota();
    if (!quota.ok) {
      return NextResponse.json(
        { error: `今日免費次數已用完（上限 ${quota.limit} 次）。請升級 Pro 解鎖無限次數與匯出功能。` },
        { status: 402 }
      );
    }

    const { content } = await req.json();
    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "缺少 content" }, { status: 400 });
    }

    // 1) 先用稅務解析器拿到【事實塊】
    const tax = resolveTaxFacts(content);

    // 2) 若使用者句子裡有明顯金額等提示，嘗試給個基本試算（僅示意抓第一個數字）
    let calcBlock = "";
    if (tax.found && tax.topic === "estate") {
      // 嘗試從語句抓總額（你可以改成更完整的欄位抽取）
      const maybeAmount = roughNumberIn(content);
      if (maybeAmount && maybeAmount > 0) {
        const r = estimateEstateTW({
          jurisdiction: "TW",
          gross_estate: maybeAmount,
          debts: 0, funeral_expense: 0, life_insurance_payout: 0,
          spouse_count: 0, lineal_descendants: 0, lineal_ascendants: 0, disabled_count: 0
        });
        calcBlock =
`【系統試算（僅依題句抓到的總額示意）】
- 遺產總額：${r.inputs.gross_estate.toLocaleString()} ${r.currency}
- 基本免稅等合計：${(r.computed.basic_exemptions_total + r.computed.funeral_expense_allowed + r.computed.life_insurance_exempted + r.computed.debts_allowed).toLocaleString()} ${r.currency}
- 應稅基：${r.computed.taxable_base.toLocaleString()} ${r.currency}
- 稅率/級距：${(r.computed.rate_applied*100).toFixed(0)}%
- 試算稅額：${r.computed.tax_due.toLocaleString()} ${r.currency}
（實務請完整輸入：配偶/直系人數、喪葬費、債務、壽險等，才能準確計算）`;
      }
    }
    if (tax.found && tax.topic === "gift") {
      const maybeAmount = roughNumberIn(content);
      if (maybeAmount && maybeAmount > 0) {
        const r = estimateGiftTW({
          jurisdiction: "TW",
          gifts_amount: maybeAmount,
          spouse_split: false,
          minor_children: 0
        });
        calcBlock =
`【系統試算（僅依題句抓到的金額示意）】
- 贈與總額：${r.inputs.gifts_amount.toLocaleString()} ${r.currency}
- 年度免稅合計：${r.computed.annual_exclusion_applied.toLocaleString()} ${r.currency}
- 應稅基：${r.computed.taxable_base.toLocaleString()} ${r.currency}
- 稅率/級距：${(r.computed.rate_applied*100).toFixed(0)}%
- 試算稅額：${r.computed.tax_due.toLocaleString()} ${r.currency}
（實務請補充：是否夫妻合贈、未成年子女、其他扣除規則，才能準確計算）`;
      }
    }

    // 3) 準備提示詞（嚴格規則 + 事實塊 + 可選試算）
    const systemBase =
      "你是專精於家族傳承、保單結構與台灣遺產/贈與稅的助理。請用標題、條列、表格清楚呈現；最後給出可執行的待辦清單。";
    const guard = [
      "若提供了【資料庫】區塊，你必須嚴格依該數據作答，禁止自行杜撰數字。",
      "若【資料庫】標示示例/可能過期，請在答案中加註『需覆核』並指引官方查驗路徑。",
      "若沒有可用數據，請拒絕猜測，改為說明需要哪些資料，以及到哪裡查（財政部/國稅局）。"
    ];
    const demoFlag =
      tax.found && (tax.isDemo || tax.isExpired)
        ? "⚠️【資料庫提醒】此版本為示例或可能過期，請以官方公告為準。"
        : "";

    const dbBlock = tax.found
      ? `【資料庫】\n${tax.factsText}\n${demoFlag}\n${(tax.sources || []).map(s => `- ${s.title}：${s.url}`).join("\n")}`
      : "【資料庫】（無匹配資料）";

    const infoBlocks = [dbBlock];
    if (calcBlock) infoBlocks.push(calcBlock);

    // 4) 呼叫 Groq
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "未設定 GROQ_API_KEY" }, { status: 500 });
    }
    const model = process.env.GROQ_MODEL_ID || "llama-3.1-8b-instant";

    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: `${systemBase}\n\n嚴格規則：\n- ${guard.join("\n- ")}` },
          { role: "system", content: infoBlocks.join("\n\n") },
          { role: "user", content }
        ],
        temperature: 0.2
      })
    });

    const data = await r.json();
    if (!r.ok) {
      return NextResponse.json({ error: data?.error?.message || "上游模型錯誤" }, { status: 500 });
    }

    const plan = await getUserPlan();
    const reply = data?.choices?.[0]?.message?.content || "（沒有回覆）";
    return NextResponse.json({ reply, isPro: plan !== "free" });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "未知錯誤" }, { status: 500 });
  }
}
