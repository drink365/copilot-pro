// app/api/debug/route.ts
import { NextResponse } from "next/server"

export const runtime = "edge"

export async function GET() {
  const info = {
    provider: "groq",
    model: process.env.MODEL_ID || "llama-3.1-70b-versatile",
    groqKeySet: !!process.env.GROQ_API_KEY,
  }
  return NextResponse.json(info)
}
