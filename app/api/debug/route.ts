// app/api/debug/route.ts
import { NextRequest, NextResponse } from "next/server"
export const runtime = "edge"

export async function GET(req: NextRequest) {
  const isPro = req.cookies.get("proToken")?.value === process.env.PRO_SECRET
  return NextResponse.json({
    provider: "groq",
    model: process.env.MODEL_ID || "llama-3.3-70b-versatile",
    groqKeySet: !!process.env.GROQ_API_KEY,
    isPro
  })
}
