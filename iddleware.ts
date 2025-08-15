// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = process.env.PRO_AUTH_COOKIE_NAME || "pro_auth";
const TOKEN = process.env.PRO_AUTH_TOKEN || "pro-token-please-change-this";

// 指定要保護的路徑；這裡先保護 /tools/*
export const config = {
  matcher: ["/tools/:path*"],
};

export function middleware(req: NextRequest) {
  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  const isAuthed = cookie && cookie === TOKEN;

  if (isAuthed) return NextResponse.next();

  // 未授權 → 導向 /pro/login?from=原頁
  const url = new URL("/pro/login", req.url);
  url.searchParams.set("from", req.nextUrl.pathname);
  return NextResponse.redirect(url);
}
