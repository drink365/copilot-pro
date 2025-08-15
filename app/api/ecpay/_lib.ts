import crypto from "crypto"

export type ECPayConfig = {
  merchantId: string
  hashKey: string
  hashIV: string
  siteUrl: string
  mode: "Stage" | "Prod"
}

export function getConfig(): ECPayConfig {
  const merchantId = process.env.ECPAY_MERCHANT_ID || ""
  const hashKey = process.env.ECPAY_HASH_KEY || ""
  const hashIV = process.env.ECPAY_HASH_IV || ""
  const siteUrl = process.env.SITE_URL || ""
  const mode = (process.env.ECPAY_MODE || "Stage") as "Stage" | "Prod"
  if (!merchantId || !hashKey || !hashIV || !siteUrl) {
    throw new Error("ECPay 參數未設定完整：請設定 ECPAY_MERCHANT_ID / ECPAY_HASH_KEY / ECPAY_HASH_IV / SITE_URL")
  }
  return { merchantId, hashKey, hashIV, siteUrl, mode }
}

function encodePairs(pairs: Record<string, string>) {
  const keys = Object.keys(pairs).sort((a, b) => a.localeCompare(b))
  const query = keys.map(k => `${k}=${pairs[k]}`).join("&")
  return query
}

export function genCheckMacValue(pairs: Record<string, string>, hashKey: string, hashIV: string) {
  // 依綠界規定：HashKey + 排序後字串 + HashIV → URL encode（.NET 互通）→ SHA256 → 大寫
  const raw = `HashKey=${hashKey}&${encodePairs(pairs)}&HashIV=${hashIV}`
  const encoded = encodeURIComponent(raw)
    .toLowerCase()
    .replace(/%20/g, "+")
    .replace(/%21/g, "!")
    .replace(/%28/g, "(")
    .replace(/%29/g, ")")
    .replace(/%2a/g, "*")
  return crypto.createHash("sha256").update(encoded).digest("hex").toUpperCase()
}

export function ecpayEndpoint(mode: "Stage" | "Prod") {
  return mode === "Prod"
    ? "https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5"
    : "https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5"
}

export function ecpayQueryEndpoint(mode: "Stage" | "Prod") {
  return mode === "Prod"
    ? "https://payment.ecpay.com.tw/Cashier/QueryTradeInfo/V5"
    : "https://payment-stage.ecpay.com.tw/Cashier/QueryTradeInfo/V5"
}

export function genTradeNo(prefix = "PRO"): string {
  const now = new Date()
  const yyyy = String(now.getFullYear())
  const mm = String(now.getMonth() + 1).padStart(2, "0")
  const dd = String(now.getDate()).padStart(2, "0")
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `${prefix}${yyyy}${mm}${dd}${rand}`.slice(0, 20)
}
