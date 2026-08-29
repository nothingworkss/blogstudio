import type { BlogDraftInput } from "@/types/blog";
import type { ImageObservation } from "@/types/image";
import type { ProductRecommendation } from "@/types/product";

const promotionalTitleTerms = ["BEST", "완벽", "총정리", "무조건", "역대급", "인기 폭발"];
const titleSkeletonLabels = new Set([
  "제목",
  "키워드 직결형",
  "구체적 상황형",
  "선택 기준형",
  "제품 비교형",
  "부드러운 호기심형",
]);

export function parseTitleCandidates(value: string) {
  const cleaned = value
    .trim()
    .replace(/^```(?:json|text)?/i, "")
    .replace(/```$/i, "")
    .trim();
  if (!cleaned) return [];
  if (isManualTitlePromptText(cleaned)) return [];

  const parsedCandidates = parseJsonCandidates(cleaned);
  if (parsedCandidates.length) return cleanParsedTitleCandidates(parsedCandidates).slice(0, 5);

  const lines = cleaned.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const listedLines = lines.filter((line) => /^(?:\d{1,2}[.)]|[-*•])\s*/.test(line));
  const source = listedLines.length ? listedLines : lines;

  return cleanParsedTitleCandidates(
    source.map((line) =>
      line
        .replace(/^(?:\d{1,2}[.)]|[-*•])\s*/, "")
        .replace(/^제목\s*[:：]\s*/i, "")
        .replace(/^['"“”]|['"“”]$/g, "")
        .trim(),
    ),
  ).slice(0, 5);
}

export function isManualTitlePromptText(value: string) {
  const markers = ["후보 구성:", "작성 규칙:", "출력 형식:", "너는 nothingmatters 네이버 블로그의 제목 에디터다"];
  return markers.filter((marker) => value.includes(marker)).length >= 2;
}

export function buildManualTitlePrompt({
  input,
  selectedProducts,
}: {
  input: BlogDraftInput;
  selectedProducts: ProductRecommendation[];
}) {
  const payload = {
    topic: input.topic,
    main_keyword: input.main_keyword,
    situation: input.situation,
    memo: input.raw_memo,
    post_type: input.post_type,
    selected_products: selectedProducts.map((product) => ({
      name: product.product_name,
      angle: product.angle,
    })),
  };

  return `너는 nothingmatters 네이버 블로그의 제목 에디터다.

목표:
아래 실제 상황과 선택 제품 2개를 바탕으로, 검색 주제가 한눈에 보이면서도 사람이 직접 쓴 듯 자연스러운 제목 후보를 정확히 5개 작성한다.

후보 구성:
1. 키워드 직결형
2. 구체적 상황형
3. 선택 기준형
4. 제품 비교형
5. 부드러운 호기심형

작성 규칙:
- 질문형은 최대 1개만 쓴다.
- 메인 키워드는 후보마다 최대 1회만 사용한다.
- 다섯 제목의 시작 구조, 쉼표 위치, 끝맺음을 반복하지 않는다.
- 권장 길이는 한글 기준 22~40자다. 길이를 맞추려고 의미 없는 말을 넣지 않는다.
- BEST, 완벽, 총정리, 무조건, 역대급 같은 홍보성 표현을 쓰지 않는다.
- 확인되지 않은 후기, 인기, 고객 반응, 판매량을 만들지 않는다.
- 두 제품의 우열을 단정하지 않고 상황에 따른 선택 기준으로 표현한다.
- 설명, 분석, 추천 이유 없이 제목만 출력한다.

출력 형식:
1. 제목
2. 제목
3. 제목
4. 제목
5. 제목

입력:
${JSON.stringify(payload, null, 2)}`;
}

export function buildLockedNaverTitleInstructions(selectedTitle: string, titleCandidateCount: number) {
  return `- 반자동 제목 잠금 규칙이 위 제목 후보 생성 규칙보다 우선한다.
- 확정 selected_title은 ${JSON.stringify(selectedTitle.trim())}이며 한 글자도 바꾸지 않는다.
- 제목을 새로 만들거나 고르지 않는다.
- 앱이 보관한 제목 후보 ${titleCandidateCount}개를 다시 출력하지 않는다.
- JSON에 title_candidates, selected_title, selected_products, plain_text_for_naver를 출력하지 않는다. 앱이 확정값을 주입한다.`;
}

export function buildLocalTitleCandidates(
  input: BlogDraftInput,
  selectedProducts: ProductRecommendation[] = [],
) {
  const keyword = input.main_keyword.trim() || input.topic.trim() || "쿠키 답례품";
  const situation = compactSituation(input.situation || input.topic, keyword) || "마음을 전하는 날";
  const firstName = selectedProducts[0]?.product_name || "문구 쿠키";
  const secondName = selectedProducts[1]?.product_name || "포장 쿠키";

  return uniqueTitles([
    `${keyword}, 문구와 포장까지 확인한 쿠키 2가지`,
    `${situation}에 어울리는 ${keyword}`,
    `${keyword} 고를 때 먼저 볼 수량·문구·포장`,
    `${firstName}와 ${secondName}, ${keyword} 선택 기준`,
    `${keyword}, 부담 없이 마음을 전하려면 무엇을 볼까요?`,
  ]).slice(0, 5);
}

export function applyLockedNaverTitle<T extends Record<string, unknown>>(
  raw: T,
  {
    selectedTitle,
    titleCandidates,
    input,
    selectedProducts,
  }: {
    selectedTitle: string;
    titleCandidates: string[];
    input: BlogDraftInput;
    selectedProducts: ProductRecommendation[];
  },
) {
  const lockedTitle = selectedTitle.trim();
  const completedCandidates = uniqueTitles([
    lockedTitle,
    ...titleCandidates,
    ...buildLocalTitleCandidates(input, selectedProducts),
  ]).slice(0, 5);

  return {
    ...raw,
    title_candidates: completedCandidates,
    selected_title: lockedTitle,
  } as T & { title_candidates: string[]; selected_title: string };
}

export function buildTitleContextFingerprint({
  input,
  selectedProducts,
  observations,
}: {
  input: BlogDraftInput;
  selectedProducts: ProductRecommendation[];
  observations: ImageObservation[];
}) {
  return JSON.stringify({
    topic: input.topic,
    main_keyword: input.main_keyword,
    situation: input.situation,
    raw_memo: input.raw_memo,
    post_type: input.post_type,
    selected_products: selectedProducts.map((product) => ({
      name: product.product_name,
      angle: product.angle,
    })),
    observations,
  });
}

export function getTitleWarnings(title: string, mainKeyword: string) {
  const normalizedTitle = title.trim();
  if (!normalizedTitle) return [];

  const warnings: string[] = [];
  if (normalizedTitle.length < 22 || normalizedTitle.length > 40) {
    warnings.push("제목은 22~40자 안에서 가장 빠르게 읽힙니다.");
  }

  const keyword = mainKeyword.trim();
  if (keyword) {
    const count = normalizedTitle.match(new RegExp(escapeRegExp(keyword), "g"))?.length ?? 0;
    if (count === 0) warnings.push("메인 키워드가 제목에 없습니다.");
    if (count > 1) warnings.push("메인 키워드가 제목에서 반복됩니다.");
  }

  const foundPromotionalTerm = promotionalTitleTerms.find((term) =>
    normalizedTitle.toLocaleLowerCase("ko").includes(term.toLocaleLowerCase("ko")),
  );
  if (foundPromotionalTerm) {
    warnings.push(`홍보성 표현 '${foundPromotionalTerm}'을 확인해 주세요.`);
  }

  return warnings;
}

function parseJsonCandidates(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    const source = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === "object" && "title_candidates" in parsed
        ? (parsed as { title_candidates?: unknown }).title_candidates
        : [];
    if (!Array.isArray(source)) return [];

    return source
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "title" in item) {
          const title = (item as { title?: unknown }).title;
          return typeof title === "string" ? title : "";
        }
        return "";
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

function uniqueTitles(titles: string[]) {
  const seen = new Set<string>();
  return titles
    .map((title) => title.replace(/\s+/g, " ").trim())
    .filter((title) => {
      if (!title || seen.has(title)) return false;
      seen.add(title);
      return true;
    });
}

function cleanParsedTitleCandidates(titles: string[]) {
  return uniqueTitles(titles).filter((title) => !titleSkeletonLabels.has(title));
}

function compactSituation(value: string, keyword: string) {
  return value
    .replace(new RegExp(escapeRegExp(keyword), "g"), "")
    .replace(/을 소개하는 글|를 소개하는 글|하는 글/g, "")
    .replace(/[.。!?]+$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 28);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
