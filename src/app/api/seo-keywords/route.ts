import { NextResponse, type NextRequest } from "next/server";
import { isAdminRequest, unauthorizedJson } from "@/lib/auth";
import { countKeywords } from "@/lib/utils/countKeywords";

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedJson();

  const body = (await request.json()) as { text?: string; keywords?: string[]; main_keyword?: string };
  const keywords = body.keywords?.length ? body.keywords : [body.main_keyword ?? ""].filter(Boolean);
  const counts = countKeywords(body.text ?? "", keywords);

  return NextResponse.json({
    counts,
    recommendations: counts
      .filter((item) => item.count === 0)
      .map((item) => `${item.keyword} 키워드를 도입부나 주문 체크포인트에 자연스럽게 한 번 넣어보세요.`),
  });
}
