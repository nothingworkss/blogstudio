import { createHash } from "crypto";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { getEnv } from "./env";

export const adminCookieName = "nothingmatters_admin";

export function adminPasswordConfigured() {
  return Boolean(getEnv("ADMIN_PASSWORD"));
}

export function createAdminToken(password = getEnv("ADMIN_PASSWORD")) {
  const secret = getEnv("ADMIN_SESSION_SECRET") || "nothingmatters-blog-studio";
  return createHash("sha256").update(`${password}:${secret}`).digest("hex");
}

export async function isAdminSession() {
  if (!adminPasswordConfigured()) return true;
  const cookieStore = await cookies();
  return cookieStore.get(adminCookieName)?.value === createAdminToken();
}

export function isAdminRequest(request: NextRequest | Request) {
  if (!adminPasswordConfigured()) return true;
  const cookieHeader = request.headers.get("cookie") ?? "";
  return cookieHeader.includes(`${adminCookieName}=${createAdminToken()}`);
}

export function unauthorizedJson() {
  return NextResponse.json(
    {
      error: "관리자 로그인이 필요합니다.",
    },
    { status: 401 },
  );
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}
