import { NextResponse, type NextRequest } from "next/server";
import { isAdminRequest, unauthorizedJson } from "@/lib/auth";
import { searchNaverKeyword } from "@/lib/naver/search";

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedJson();

  const body = (await request.json()) as { main_keyword?: string };
  const mainKeyword = body.main_keyword?.trim();
  if (!mainKeyword) return NextResponse.json({ error: "main_keyword가 필요합니다." }, { status: 400 });

  return NextResponse.json(await searchNaverKeyword(mainKeyword));
}
