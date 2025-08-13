// app/api/ecpay/_lib.ts
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
  const mode = (process.env.ECPAY_MODE === "Prod" ? "Prod" : "Stage") as "Stage" | "Prod"
  if (!merchantId || !hashKey || !hashIV || !siteUrl) {
    throw new Error("ECPay/SITE_URL 環境變數未設定完整")
  }
  return { merchantId, hashKey, hashIV, siteUrl, mode }
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

// ECPay CheckMacValue：依文件規則（鍵名排序、串接、URL encode、SHA256 大寫）
export function genCheckMacValue(params: Record<string, string>, hashKey: string, hashIV: string): string {
  const sorted = Object.keys(params)
    .filter(k => k !== "CheckMacValue")
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
  const query = sorted.map(k => `${k}=${params[k]}`).join("&")
  const raw = `HashKey=${hashKey}&${query}&HashIV=${hashIV}`
  const encoded = encodeURIComponent(raw)
    .toLowerCase()
    .replace(/%20/g, "+")
    .replace(/%21/g, "!")
    .replace(/%28/g, "(")
    .replace(/%29/g, ")")
    .replace(/%2a/g, "*")
  return crypto.createHash("sha256").update(encoded).digest("hex").toUpperCase()
}

// 快速產生訂單編號（避免重複）
export function genTradeNo(prefix = "PRO"): string {
  const now = new Date()
  const yyyy = String(now.getFullYear())
  const mm = String(now.getMonth() + 1).padStart(2, "0")
  const dd = String(now.getDate()).padStart(2, "0")
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `${prefix}${yyyy}${mm}${dd}${rand}`.slice(0, 20)
}
