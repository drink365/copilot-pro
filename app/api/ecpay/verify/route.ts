// app/api/ecpay/verify/route.ts
import { NextRequest, NextResponse } from "next/server"
import { genCheckMacValue, getConfig } from "../_lib"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const cfg = getConfig()
  const proSecret = process.env.PRO_SECRET
  if (!proSecret) return NextResponse.json({ ok: false, error: "PRO_SECRET 未設定" }, { status: 500 })

  const url = new URL(req.url)
  const params = Object.fromEntries(url.searchParams.entries())

  const rtn = params["RtnCode"]
  if (rtn !== "1") {
    return NextResponse.json({ ok: false, error: "未完成付款", detail: params }, { status: 402 })
  }

  if (params["CheckMacValue"]) {
    const copy = { ...params }
    delete copy["CheckMacValue"]
    const local = genCheckMacValue(copy, cfg.hashKey, cfg.hashIV)
    if (local !== params["CheckMacValue"]) {
      return NextResponse.json({ ok: false, error: "CheckMacValue 不符" }, { status: 400 })
    }
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set("proToken", proSecret, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 })
  return res
}
