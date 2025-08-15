// app/api/book/route.ts
import { NextResponse } from "next/server";
import { sendMail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name, phone, email, caseId, date, period, note,
    } = body ?? {};

    // 簡單驗證
    if (!name || !phone || !date || !period) {
      return NextResponse.json({ error: "缺少必要欄位（姓名、手機、日期、時段）" }, { status: 400 });
    }

    const to = process.env.BOOKING_TO_EMAIL || process.env.MAIL_TO || "your@mail.com";
    const brand = process.env.BRAND_NAME || "永傳家族辦公室";

    const subject = `📅 ${brand} 預約：${name}（${date}｜${period}）`;
    const html = `
      <div style="font-family: system-ui, -apple-system, 'Noto Sans TC', sans-serif;">
        <h2>${brand}｜線上預約</h2>
        <p><b>姓名：</b>${name}</p>
        <p><b>手機：</b>${phone}</p>
        <p><b>Email：</b>${email || "-"}</p>
        <p><b>案件碼：</b>${caseId || "-"}</p>
        <p><b>期望日期：</b>${date}</p>
        <p><b>時段：</b>${period}</p>
        <p><b>備註：</b>${note || "-"}</p>
        <hr/>
        <p style="color:#666;">此信由系統發送，請直接以您的工作流程回覆客戶。</p>
      </div>
    `;

    await sendMail({ to, subject, html });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "unknown" }, { status: 500 });
  }
}
