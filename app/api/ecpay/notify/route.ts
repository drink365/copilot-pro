// app/api/ecpay/notify/route.ts
import { NextRequest, NextResponse } from "next/server"
import { genCheckMacValue, getConfig } from "../_lib"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const cfg = getConfig()
  const formData = await req.formData()
  const params: Record<string, string> = {}
  for (const [k, v] of formData.entries()) {
    params[k] = String(v)
  }

  // 驗證 CheckMacValue
  const remote = params["CheckMacValue"]
  const copy = { ...params }
  delete copy["CheckMacValue"]
  const local = genCheckMacValue(copy, cfg.hashKey, cfg.hashIV)

  if (remote !== local) {
    // 驗證失敗：回覆空字串或錯誤訊息（ECPay 會重送）
    return new Response("0|ERR", { status: 400 })
  }

  // RtnCode=1 代表成功；你可以在這裡記錄訂單/開通 Pro（若你有資料庫）
  // 因為這是 server-to-server，無法直接設 Cookie 給使用者

  // ECPay 規定成功要回覆字串 "1|OK"
  return new Response("1|OK", { status: 200 })
}
