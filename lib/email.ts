// lib/email.ts
import nodemailer from "nodemailer";
import { MAIL } from "./config";

type Attachment = {
  filename: string;
  contentBase64: string; // base64 without data: prefix
  contentType?: string;
};

type MailArgs = {
  to: string;
  subject: string;
  html: string;
  from?: string;
  attachments?: Attachment[];
};

export async function sendMail(args: MailArgs) {
  const from = args.from ?? MAIL.FROM;

  // 1) Resend（優先）
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (RESEND_API_KEY) {
    const body: any = {
      from,
      to: [args.to],
      subject: args.subject,
      html: args.html,
    };
    if (args.attachments?.length) {
      body.attachments = args.attachments.map(a => ({
        filename: a.filename,
        content: a.contentBase64, // Resend 接收 base64 字串
      }));
    }
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Resend failed: ${resp.status} ${text}`);
    }
    return await resp.json();
  }

  // 2) SMTP（Gmail / 其他）
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    console.warn("[sendMail] No email provider configured. Email not sent.");
    return { ok: true, simulated: true };
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  const info = await transporter.sendMail({
    from,
    to: args.to,
    subject: args.subject,
    html: args.html,
    attachments: args.attachments?.map(a => ({
      filename: a.filename,
      content: Buffer.from(a.contentBase64, "base64"),
      contentType: a.contentType || "application/pdf",
    })),
  });

  return { ok: true, messageId: info.messageId };
}
