// app/api/report/estate/route.ts
import { NextResponse } from "next/server";
import { BRAND, MAIL } from "@/lib/config";
import { simulateCompare } from "@/lib/tax/tw";
import { sendMail } from "@/lib/email";

export const runtime = "nodejs"; // 需要 Node runtime 以使用 pdfkit

function numberFormat(n: number) {
  return n.toLocaleString("zh-TW");
}

async function buildPdfBuffer(params: {
  name?: string;
  grossEstate: number;
  numChildren: number;
  includeSpouse: boolean;
  years: number;
  recipients: number;
}) {
  const PDFDocument = (await import("pdfkit")).default;
  const doc = new PDFDocument({ size: "A4", margin: 48 });
  const chunks: Buffer[] = [];
  doc.on("data", (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>(resolve => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  const res = simulateCompare({
    grossEstate: params.grossEstate,
    numChildren: params.numChildren,
    includeSpouse: params.includeSpouse,
    years: params.years,
    recipients: params.recipients,
  });

  // Header
  doc.fontSize(18).fillColor("#111").text(`${BRAND.NAME}｜財富傳承試算報告`, { align: "left" });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor("#555").text(`申請人：${params.name || "—"}`);
  doc.fontSize(10).fillColor("#555").text(`版本：顧問簡報用 － 僅供參考`);
  doc.moveDown(1);

  // 基本資料
  doc.fontSize(12).fillColor("#111").text("一、基本資料", { underline: true });
  doc.moveDown(0.3);
  doc.fontSize(11).fillColor("#222");
  doc.text(`遺產總額：NT$ ${numberFormat(params.grossEstate)}`);
  doc.text(`子女人數：${params.numChildren}；配偶扣除：${params.includeSpouse ? "是" : "否"}`);
  doc.text(`逐年贈與假設：${params.years} 年 × ${params.recipients} 名受贈人（每人每年 244 萬免稅）`);
  doc.moveDown(0.8);

  // 結果摘要
  doc.fontSize(12).fillColor("#111").text("二、結果摘要", { underline: true });
  doc.moveDown(0.3);
  const row = (label: string, obj: any) => {
    doc.fontSize(11).fillColor("#111").text(label);
    doc.fontSize(10).fillColor("#333");
    if (obj.totalGiftFree != null) doc.text(`累計免稅贈與：NT$ ${numberFormat(obj.totalGiftFree)}`);
    doc.text(`課稅遺產：NT$ ${numberFormat(obj.taxableEstate)}`);
    doc.text(`適用級距：${obj.bracket}%`);
    doc.text(`預估遺產稅：NT$ ${numberFormat(obj.tax)}`);
    doc.moveDown(0.6);
  };

  row("方案 A：現況不規劃", res.baseline);
  row("方案 B：逐年贈與", res.giftingPlan);
  row("方案 C：組合（贈與加碼 + 保險稅源 / 信託控管）", res.comboPlan);

  // 顧問觀點
  doc.moveDown(0.4);
  doc.fontSize(12).fillColor("#111").text("三、顧問觀點（摘要）", { underline: true });
  doc.fontSize(10).fillColor("#333");
  doc.text("1) 逐年贈與能有效降低稅基，但需要時間與多人受贈搭配。");
  doc.text("2) 保單作為稅源把手，確保不因繳稅被迫變賣資產。");
  doc.text("3) 信託可分批給付並控管，用於避免爭產、保障弱勢與企業連續性。");
  doc.text("4) 實務請以申報時點法令與資產價值為準，本報告僅供試算引導。");

  // Footer
  doc.moveDown(1);
  doc.fontSize(9).fillColor("#777").text(`${BRAND.NAME}｜${BRAND.SLOGAN}｜本文件為試算摘要，不構成法律或稅務意見。`, { align: "center" });

  doc.end();
  return done;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { lead, input } = body ?? {};
    // 基本欄位檢查
    if (!lead?.email || !input?.grossEstate || input?.years == null || input?.recipients == null) {
      return NextResponse.json({ error: "缺少必要欄位（email, grossEstate, years, recipients）" }, { status: 400 });
    }

    const buffer = await buildPdfBuffer({
      name: lead?.name,
      grossEstate: Number(input.grossEstate),
      numChildren: Number(input.numChildren || 0),
      includeSpouse: !!input.includeSpouse,
      years: Number(input.years),
      recipients: Number(input.recipients),
    });
    const b64 = buffer.toString("base64");
    const filename = `永傳_傳承試算_${Date.now()}.pdf`;

    // 寄給用戶
    await sendMail({
      to: lead.email,
      subject: `您的傳承試算報告｜${BRAND.NAME}`,
      html: `
        <div style="font-family: system-ui, -apple-system, 'Noto Sans TC', sans-serif;">
          <p>您好${lead?.name ? "，" + lead.name : ""}：</p>
          <p>附上您的試算報告 PDF（僅供參考）。若願意，我們可以安排 20 分鐘線上說明，針對您的狀況給出建議。</p>
          <p>— ${BRAND.NAME}</p>
        </div>
      `,
      attachments: [{ filename, contentBase64: b64 }],
    });

    // 同時抄送給你（內部線索）
    await sendMail({
      to: MAIL.TO,
      subject: `【新線索】${lead?.name || "未填名"}｜傳承試算報告已寄出`,
      html: `
        <div style="font-family: system-ui, -apple-system, 'Noto Sans TC', sans-serif;">
          <p>新線索：</p>
          <ul>
            <li>姓名：${lead?.name || "-"}</li>
            <li>Email：${lead?.email}</li>
            <li>手機：${lead?.phone || "-"}</li>
          </ul>
          <p>系統已把 PDF 報告寄給用戶。</p>
        </div>
      `,
      attachments: [{ filename, contentBase64: b64 }],
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "unknown" }, { status: 500 });
  }
}
