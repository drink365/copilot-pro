// app/api/chat/route.ts
import { NextResponse } from "next/server";
import { LEGACY_COACH_SYSTEM } from "@/lib/prompts/coach";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, model } = body ?? {};

    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: "messages must be an array" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });
    }

    const usedModel = model || process.env.OPENAI_MODEL || "gpt-5-nano";

    const payload = {
      model: usedModel,
      messages: [
        { role: "system", content: LEGACY_COACH_SYSTEM },
        ...messages,
      ],
      temperature: 0.4,
    };

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json({ error: `OpenAI error: ${resp.status} ${text}` }, { status: 500 });
    }

    const data = await resp.json();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "unknown" }, { status: 500 });
  }
}
