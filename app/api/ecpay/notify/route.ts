// app/api/ecpay/notify/route.ts
import { NextRequest } from "next/server"
import { genCheckMacValue, getConfig } from "../_lib"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const cfg = getConfig()
  const formData = await req.formData()
  const params: Record<string, string> = {}
  for (const [k, v] of formData.entries()) params[k] = String(v)

  const remote = params["CheckMacValue"]
  const copy = { ...params }
  delete copy["CheckMacValue"]
  const local = genCheckMacValue(copy, cfg.hashKey, cfg.hashIV)
  if (remote !== local) return new Response("0|ERR", { status: 400 })

  // 你可以在這裡寫入資料庫（若有）
  // 付款完成：params.RtnCode === "1"
  return new Response("1|OK", { status: 200 })
}
