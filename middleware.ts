// middleware.ts
import { NextRequest, NextResponse } from "next/server";

/**
 * 顧問保護中介層
 * - 只保護 /tools/* 路徑（見下方 matcher）
 * - 以 Cookie 與環境變數比對簡易授權：
 *    PRO_AUTH_COOKIE_NAME = cookie 名稱（預設 "pro_auth"）
 *    PRO_AUTH_TOKEN       = 授權 Token（與 cookie 內容相同才放行）
 * - 若未通過，導向 /pro/login?from=<原始路徑>
 */
export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const pathname = url.pathname;

  // 讀取環境變數（若未設置，預設放行以避免卡住部署／預覽）
  const COOKIE_NAME = process.env.PRO_AUTH_COOKIE_NAME || "pro_auth";
  const TOKEN = process.env.PRO_AUTH_TOKEN;

  // 未設定 TOKEN 則不做檢查（允許通行）
  if (!TOKEN) {
    return NextResponse.next();
  }

  // 從 Cookie 取值
  const cookieValue = req.cookies.get(COOKIE_NAME)?.value || "";

  // 符合才放行
  if (cookieValue === TOKEN) {
    return NextResponse.next();
  }

  // 未通過：導向登入頁，並附帶 from 參數（登入成功後導回）
  const loginUrl = new URL("/pro/login", req.url);
  // from 帶回原始完整路徑（含查詢），使用 encodeURIComponent 處理
  const from = pathname + (url.search || "");
  loginUrl.searchParams.set("from", from);

  return NextResponse.redirect(loginUrl);
}

/**
 * 只攔截 /tools/* 路徑。
 * 若你也想保護 /advisor，請改成：
 * matcher: ["/tools/:path*", "/advisor"]
 */
export const config = {
  matcher: ["/tools/:path*"],
};
