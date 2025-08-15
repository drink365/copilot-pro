// lib/email.ts
import nodemailer from "nodemailer";

type MailArgs = {
  to: string;
  subject: string;
  html: string;
  from?: string;
};

export async function sendMail(args: MailArgs) {
  const from = args.from ?? process.env.MAIL_FROM ?? "no-reply@yourdomain.com";

  // 優先使用 Resend
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (RESEND_API_KEY) {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [args.to],
        subject: args.subject,
        html: args.html,
      }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Resend failed: ${resp.status} ${text}`);
    }
    return await resp.json();
  }

  // 其次使用 SMTP
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    // 沒有任何郵件服務設定就當作成功，但提醒開發者
    console.warn("[sendMail] No email provider configured (Resend/SMTP). Email was not sent.");
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
  });

  return { ok: true, messageId: info.messageId };
}
