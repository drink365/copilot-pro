// app/api/pro/login/route.ts
import { NextResponse } from "next/server";
import { AUTH, buildAuthCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code } = body ?? {};
    const invite = process.env.INVITE_CODE || "YOUR-INVITE-CODE-2025";

    if (!code || String(code) !== String(invite)) {
      return NextResponse.json({ ok: false, error: "邀請碼錯誤" }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });
    res.headers.set("Set-Cookie", buildAuthCookie());
    return res;
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "unknown" }, { status: 500 });
  }
}
