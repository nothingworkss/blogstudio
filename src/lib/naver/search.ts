import type { SeoKeywordResult } from "@/types/seo";
import { getEnv, hasNaverEnv } from "@/lib/env";
import { splitByComma, uniqueStrings } from "@/lib/utils/strings";

export async function searchNaverKeyword(mainKeyword: string): Promise<SeoKeywordResult> {
  if (!hasNaverEnv()) return fallbackNaverSearch(mainKeyword);

  const url = new URL("https://openapi.naver.com/v1/search/blog.json");
  url.searchParams.set("query", mainKeyword);
  url.searchParams.set("display", "10");
  url.searchParams.set("sort", "sim");

  const response = await fetch(url, {
    headers: {
      "X-Naver-Client-Id": getEnv("NAVER_CLIENT_ID"),
      "X-Naver-Client-Secret": getEnv("NAVER_CLIENT_SECRET"),
    },
    next: { revalidate: 60 * 60 },
  });

  if (!response.ok) return fallbackNaverSearch(mainKeyword);

  const data = (await response.json()) as {
    items?: { title: string; description: string }[];
  };

  const titles = (data.items ?? []).map((item) => stripTags(item.title));
  const descriptions = (data.items ?? []).map((item) => stripTags(item.description));
  const words = uniqueStrings(
    splitByComma(`${titles.join(" ")} ${descriptions.join(" ")}`.replace(/[^\p{L}\p{N},\s]/gu, " ")),
  ).slice(0, 12);

  return {
    main_keyword: mainKeyword,
    related_titles: titles,
    recurring_keywords: words,
    title_patterns: [
      `${mainKeyword} 고를 때 확인할 점`,
      `${mainKeyword} 추천 제품 비교`,
      `${mainKeyword}, 부담 없이 준비하는 방법`,
    ],
    risky_expressions: ["최저가", "무조건", "완벽한", "1위"],
    source: "naver",
  };
}

function fallbackNaverSearch(mainKeyword: string): SeoKeywordResult {
  return {
    main_keyword: mainKeyword,
    related_titles: [
      `${mainKeyword} 고를 때 확인하면 좋은 것들`,
      `${mainKeyword}, 부담 없이 마음 전하는 방법`,
      `${mainKeyword} 추천 전에 체크할 포장과 일정`,
    ],
    recurring_keywords: [mainKeyword, "답례품", "수제쿠키", "선물", "포장", "문구"],
    title_patterns: [
      `${mainKeyword} 뭐가 좋을까?`,
      `${mainKeyword} 준비 전 체크포인트`,
      `${mainKeyword}에 어울리는 쿠키 선물`,
    ],
    risky_expressions: ["무조건", "완벽한", "전국 택배 가능", "1위"],
    source: "fallback",
  };
}

function stripTags(value: string) {
  return value.replace(/<[^>]*>/g, "").replace(/&quot;/g, "\"").replace(/&amp;/g, "&");
}
