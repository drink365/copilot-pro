// app/api/dev/pro/route.ts
import { NextRequest, NextResponse } from "next/server"

export const runtime = "edge"

/**
 * 後台測試用：開/關專業版 Cookie
 * 用法：
 *   /api/dev/pro?key=你的ADMIN_SECRET&mode=on   → 設定 proToken（解鎖）
 *   /api/dev/pro?key=你的ADMIN_SECRET&mode=off  → 清除 proToken（鎖定）
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const key = url.searchParams.get("key") || ""
  const mode = (url.searchParams.get("mode") || "on").toLowerCase() // on/off

  const adminKey = process.env.ADMIN_SECRET || "dev-secret"
  if (key !== adminKey) {
    return NextResponse.json({ error: "金鑰錯誤" }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true, mode })
  if (mode === "on") {
    const proSecret = process.env.PRO_SECRET || "pro-dev"
    // 簽發 30 天
    res.cookies.set("proToken", proSecret, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    })
  } else {
    // 清除
    res.cookies.set("proToken", "", { path: "/", maxAge: 0 })
  }
  return res
}
