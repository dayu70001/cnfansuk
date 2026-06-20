import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionValue,
  getAdminLoginSecret,
  safeEqualText,
} from "@/lib/adminAuth";

export async function POST(request: Request) {
  const secret = getAdminLoginSecret();
  if (!secret) return NextResponse.json({ error: "后台环境变量尚未配置。" }, { status: 503 });

  const body = await request.json().catch(() => null) as { password?: unknown } | null;
  const password = typeof body?.password === "string" ? body.password : "";
  if (!password || !safeEqualText(password, secret)) {
    return NextResponse.json({ error: "密码或令牌不正确。" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, createAdminSessionValue(secret), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return response;
}
