// lib/auth.ts
export const AUTH = {
  COOKIE_NAME: process.env.PRO_AUTH_COOKIE_NAME || "pro_auth",
  TOKEN: process.env.PRO_AUTH_TOKEN || "pro-token-please-change-this",
  DAYS: Number(process.env.PRO_AUTH_COOKIE_DAYS || 30),
};

export function buildAuthCookie() {
  const maxAge = AUTH.DAYS * 24 * 60 * 60;
  // 設置安全 Cookie；在本地開發若需測試，可將 Secure 拿掉
  return `${AUTH.COOKIE_NAME}=${AUTH.TOKEN}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax; Secure`;
}

export function clearAuthCookie() {
  return `${AUTH.COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure`;
}
