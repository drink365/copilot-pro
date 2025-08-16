// lib/config.ts
export const BRAND = {
  NAME: process.env.BRAND_NAME || "永傳家族辦公室",
  SLOGAN: "傳承您的影響力",
};

export const MAIL = {
  TO: process.env.BOOKING_TO_EMAIL || "123@gracefo.com",
  FROM: process.env.MAIL_FROM || "Grace Family Office <123@gracefo.com>",
};

export const MODEL = {
  OPENAI_KEY: process.env.OPENAI_API_KEY || "",
  OPENAI_MODEL: process.env.OPENAI_MODEL || "gpt-5-nano",
};
