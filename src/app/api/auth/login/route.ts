import { NextResponse, type NextRequest } from "next/server";
import { adminCookieName, adminCookieOptions, createAdminToken } from "@/lib/auth";
import { getEnv } from "@/lib/env";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as { password?: string };
  const configuredPassword = getEnv("ADMIN_PASSWORD");

  if (configuredPassword && body.password !== configuredPassword) {
    return NextResponse.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  const response = NextResponse.json({
    ok: true,
    demo: !configuredPassword,
  });
  response.cookies.set(adminCookieName, createAdminToken(configuredPassword || "demo"), adminCookieOptions());
  return response;
}
