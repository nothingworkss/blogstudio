import type { BlogDraftInput } from "@/types/blog";
import type { ImageObservation } from "@/types/image";
import type { ProductRecommendation } from "@/types/product";

export type TitleChannel = "naver" | "wordpress";

export type TitleResult = {
  candidates: string[];
  selectedTitle: string;
};

export type TitlePackage = {
  naver: TitleResult;
  wordpress: TitleResult;
};

const promotionalTitleTerms = ["BEST", "완벽", "총정리", "무조건", "역대급", "인기 폭발", "1위", "필독"];
const flatTitleEndings = ["정리", "추천", "소개"];
const formulaicTitlePhrases = ["선택이 갈려요", "더 선명해져요", "결이 갈려요", "덜 흔들려요", "언제쯤 챙기면 좋을까요"];
const titleSkeletonLabels = new Set([
  "제목",
  "키워드 직결형",
  "구체적 상황형",
  "선택 기준형",
  "제품 비교형",
  "부드러운 호기심형",
  "준비 순서형",
  "비교 가이드형",
  "체크리스트형",
]);

export const titleCandidateLabels: Record<TitleChannel, string[]> = {
  naver: ["검색 의도 직결", "현실 상황", "준비 순서", "제품 비교", "가벼운 호기심"],
  wordpress: ["준비 가이드", "실용 정보", "비교 관점", "체크리스트", "독자 질문"],
};

const titleContracts: Record<TitleChannel, string> = {
  naver: `
[네이버 제목 계약]
- 제목은 검색자가 지금 어떤 선물을 어떻게 준비할지 바로 짐작하게 하는 자연스러운 한국어 문장이다.
- 메인 키워드는 후보마다 정확히 1회만 자연스럽게 넣고, topic은 글의 문제의식으로 이어간다.
- 후보 5개는 검색 의도 직결, 현실 상황, 준비 순서, 제품 비교, 가벼운 호기심의 역할을 하나씩 맡는다.
- 질문형은 5개 중 최대 1개만 쓴다. 추천 제목은 질문형이라서 고르지 말고 검색 의도와 상황이 가장 또렷한 것을 고른다.
- 권장 길이는 22~40자다. 제품명·키워드를 나열하거나 제목 끝에 '정리', '추천', '소개'만 붙이지 않는다.
- BEST, 완벽, 총정리, 무조건 같은 홍보성 표현과 근거 없는 후기, 인기, 판매량, 가격, 수치, 클릭 유도 표현은 쓰지 않는다.
`.trim(),
  wordpress: `
[워드프레스 제목 계약]
- 제목은 오래 참고할 정보형 글의 약속을 분명히 하는 자연스러운 한국어 문장이다. 네이버 제목을 동의어로 바꾸지 않는다.
- focus keyword(메인 키워드)는 후보마다 정확히 1회만 자연스럽게 넣고, 수량·날짜·문구·포장·전달 방식 중 실제 입력에 있는 판단 축을 붙인다.
- 후보 5개는 준비 가이드, 실용 정보, 제품 비교, 체크리스트, 독자 질문의 역할을 하나씩 맡는다.
- 질문형은 5개 중 최대 1개만 쓴다. 모든 제목에 물음표를 붙이지 않는다.
- 권장 길이는 26~48자다. 제목 끝에 '정리', '추천', '소개'만 붙이거나 네이버 제목을 반복하지 않는다.
- BEST, 완벽, 총정리, 무조건 같은 홍보성 표현과 근거 없는 후기, 인기, 판매량, 가격, 수치, 클릭 유도 표현은 쓰지 않는다.
`.trim(),
};

export function getTitleContract(channel: TitleChannel) {
  return titleContracts[channel];
}

export function parseTitleCandidates(value: string) {
  return parseTitlePackage(value).naver.candidates;
}

export function parseTitlePackage(value: string): TitlePackage {
  const cleaned = value
    .trim()
    .replace(/^```(?:json|text)?/i, "")
    .replace(/```$/i, "")
    .trim();
  if (!cleaned || isManualTitlePromptText(cleaned)) return emptyTitlePackage();

  const parsed = parseJsonTitlePackage(cleaned);
  if (parsed) return parsed;

  const candidates = cleanParsedTitleCandidates(parseListedTitleCandidates(cleaned)).slice(0, 5);
  return {
    naver: { candidates, selectedTitle: candidates[0] ?? "" },
    wordpress: { candidates: [], selectedTitle: "" },
  };
}

export function isManualTitlePromptText(value: string) {
  const markers = [
    "후보 구성:",
    "작성 규칙:",
    "출력 형식:",
    "너는 nothingmatters 제목 에디터다",
    "네이버 제목 계약",
    "워드프레스 제목 계약",
  ];
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
      owner_comment: product.owner_comment,
      caution: product.caution,
    })),
  };

  return `너는 nothingmatters의 제목 에디터다.

목표:
같은 입력을 쓰되 네이버와 워드프레스가 같은 제목을 반복하지 않도록, 두 채널의 제목 후보를 각각 정확히 5개씩 만든다. 제목은 본문보다 먼저 검색 의도와 읽을 이유를 분명히 해야 한다.

${getTitleContract("naver")}

${getTitleContract("wordpress")}

공통 규칙:
- 사용자 입력, 선택 제품, 사장님 코멘트와 주의사항 밖의 사실은 제목에 넣지 않는다.
- 후보마다 시작 구조, 쉼표 위치, 끝맺음, 질문 여부를 반복하지 않는다.
- selected_title은 같은 채널의 title_candidates 중 하나를 그대로 고른다.
- 설명, 분석, 마크다운 코드블록 없이 아래 JSON 객체만 출력한다.

출력 형식:
{
  "naver": {
    "title_candidates": ["제목 1", "제목 2", "제목 3", "제목 4", "제목 5"],
    "selected_title": "네이버 최종 제목"
  },
  "wordpress": {
    "title_candidates": ["제목 1", "제목 2", "제목 3", "제목 4", "제목 5"],
    "selected_title": "워드프레스 최종 제목"
  }
}

입력:
${JSON.stringify(payload, null, 2)}`;
}

export function buildLockedNaverTitleInstructions(selectedTitle: string, titleCandidateCount: number) {
  return `- 반자동 네이버 제목 잠금 규칙이 다른 제목 지시보다 우선한다.
- 확정 selected_title은 ${JSON.stringify(selectedTitle.trim())}이며 한 글자도 바꾸지 않는다.
- 제목을 새로 만들거나 고르지 않는다.
- 앱이 보관한 제목 후보 ${titleCandidateCount}개를 다시 출력하지 않는다.
- JSON에 title_candidates, selected_title, selected_products, plain_text_for_naver를 출력하지 않는다. 앱이 확정값을 주입한다.`;
}

export function buildLockedWordPressTitleInstructions(selectedTitle: string, titleCandidateCount: number) {
  return `- 반자동 워드프레스 제목 잠금 규칙이 다른 제목 지시보다 우선한다.
- 확정 selected_title은 ${JSON.stringify(selectedTitle.trim())}이며 한 글자도 바꾸지 않는다.
- 제목을 새로 만들거나 고르지 않는다.
- 앱이 보관한 제목 후보 ${titleCandidateCount}개를 다시 출력하지 않는다.
- JSON에 title_candidates와 selected_title을 출력하지 않는다. 앱이 확정값을 주입한다.`;
}

export function buildLocalTitleCandidates(
  input: BlogDraftInput,
  selectedProducts: ProductRecommendation[] = [],
  channel: TitleChannel = "naver",
) {
  const keyword = input.main_keyword.trim() || input.topic.trim() || "쿠키 답례품";
  const situation = compactSituation(input.situation || input.topic, keyword) || "마음을 전하는 날";
  const firstName = selectedProducts[0]?.product_name || "문구 쿠키";
  const secondName = selectedProducts[1]?.product_name || "포장 쿠키";

  const candidates = channel === "naver"
    ? [
        `${keyword}, ${situation}에 먼저 챙길 것`,
        `${situation}에 건네는 ${keyword}, 문구와 포장 고르는 순서`,
        `${keyword} 준비 전 수량·문구·포장부터 살펴보기`,
        `${firstName}와 ${secondName}, ${keyword} 고를 때 다른 점`,
        `${keyword} 준비, 무엇부터 확인하면 좋을까요?`,
      ]
    : [
        `${keyword} 준비 전 수량·문구·포장을 정리하는 순서`,
        `${keyword}, 전달 방식부터 살펴보는 실용 가이드`,
        `${firstName}와 ${secondName}로 나누어 보는 ${keyword}`,
        `${keyword} 준비에 필요한 날짜·수량 체크리스트`,
        `${keyword}을 고를 때 무엇부터 확인하면 좋을까?`,
        `${keyword}, 상황에 맞는 구성으로 좁혀 가는 방법`,
      ];

  return uniqueTitles(candidates).slice(0, 5);
}

export function normalizeTitleResult({
  channel,
  candidates,
  selectedTitle,
  input,
  selectedProducts,
  avoidTitle = "",
}: {
  channel: TitleChannel;
  candidates: string[];
  selectedTitle?: string;
  input: BlogDraftInput;
  selectedProducts: ProductRecommendation[];
  avoidTitle?: string;
}): { title_candidates: string[]; selected_title: string } {
  const keyword = input.main_keyword.trim() || input.topic.trim();
  const fallback = buildLocalTitleCandidates(input, selectedProducts, channel);
  const usable = uniqueTitles([...candidates, ...fallback])
    .filter((title) => title !== avoidTitle)
    .filter((title) => !hasCriticalTitleIssue(title, keyword));
  const completed = uniqueTitles([...usable, ...fallback.filter((title) => title !== avoidTitle)]).slice(0, 5);
  const titleCandidates = completed.length === 5 ? completed : uniqueTitles([...completed, ...fallback]).slice(0, 5);
  const preferred = selectedTitle?.trim();
  const selected = preferred && titleCandidates.includes(preferred) && !hasCriticalTitleIssue(preferred, keyword)
    ? preferred
    : titleCandidates
      .map((title) => ({ title, score: getTitleScore(title, keyword, channel) }))
      .sort((left, right) => right.score - left.score)[0]?.title ?? fallback[0];

  return {
    title_candidates: titleCandidates,
    selected_title: selected,
  };
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
  const normalized = normalizeTitleResult({
    channel: "naver",
    candidates: [selectedTitle, ...titleCandidates, ...buildLocalTitleCandidates(input, selectedProducts, "naver")],
    selectedTitle,
    input,
    selectedProducts,
  });

  return {
    ...raw,
    title_candidates: completeLockedTitleCandidates(selectedTitle, normalized.title_candidates),
    selected_title: selectedTitle.trim(),
  } as T & { title_candidates: string[]; selected_title: string };
}

export function applyLockedWordPressTitle<T extends Record<string, unknown>>(
  raw: T,
  {
    selectedTitle,
    titleCandidates,
    input,
    selectedProducts,
    naverTitle,
  }: {
    selectedTitle: string;
    titleCandidates: string[];
    input: BlogDraftInput;
    selectedProducts: ProductRecommendation[];
    naverTitle: string;
  },
) {
  const normalized = normalizeTitleResult({
    channel: "wordpress",
    candidates: [selectedTitle, ...titleCandidates, ...buildLocalTitleCandidates(input, selectedProducts, "wordpress")],
    selectedTitle,
    input,
    selectedProducts,
    avoidTitle: naverTitle,
  });

  return {
    ...raw,
    title_candidates: completeLockedTitleCandidates(selectedTitle, normalized.title_candidates),
    selected_title: selectedTitle.trim(),
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

export function getTitleWarnings(title: string, mainKeyword: string, channel: TitleChannel = "naver") {
  const normalizedTitle = title.trim();
  if (!normalizedTitle) return [];

  const warnings: string[] = [];
  const [minimumLength, maximumLength] = channel === "naver" ? [22, 40] : [26, 48];
  if (normalizedTitle.length < minimumLength || normalizedTitle.length > maximumLength) {
    warnings.push(`${channel === "naver" ? "네이버" : "워드프레스"} 제목은 ${minimumLength}~${maximumLength}자 안에서 가장 빠르게 읽힙니다.`);
  }

  const keyword = mainKeyword.trim();
  if (keyword) {
    const count = countTerm(normalizedTitle, keyword);
    if (count === 0) warnings.push("메인 키워드가 제목에 없습니다.");
    if (count > 1) warnings.push("메인 키워드가 제목에서 반복됩니다.");
  }

  const foundPromotionalTerm = promotionalTitleTerms.find((term) =>
    normalizedTitle.toLocaleLowerCase("ko").includes(term.toLocaleLowerCase("ko")),
  );
  if (foundPromotionalTerm) warnings.push(`홍보성 표현 '${foundPromotionalTerm}'을 확인해 주세요.`);

  const foundFormulaicPhrase = formulaicTitlePhrases.find((phrase) => normalizedTitle.includes(phrase));
  if (foundFormulaicPhrase) warnings.push(`반복되기 쉬운 제목 표현 '${foundFormulaicPhrase}'을 바꾸는 편이 좋습니다.`);

  if (flatTitleEndings.some((ending) => normalizedTitle.endsWith(ending))) {
    warnings.push("제목 끝의 '정리·추천·소개' 대신 독자가 얻을 정보를 더 구체적으로 써 주세요.");
  }

  return warnings;
}

export function getTitleSetWarnings(candidates: string[], mainKeyword: string, channel: TitleChannel) {
  const warnings: string[] = [];
  if (candidates.length !== 5) warnings.push("제목 후보는 정확히 5개여야 합니다.");
  if (new Set(candidates.map((title) => title.trim())).size !== candidates.length) warnings.push("중복된 제목 후보가 있습니다.");
  if (candidates.filter((title) => title.trim().endsWith("?")).length > 1) warnings.push("질문형 제목은 최대 1개만 사용하는 편이 좋습니다.");
  if (candidates.some((title) => getTitleWarnings(title, mainKeyword, channel).some((warning) => warning.startsWith("메인 키워드")))) {
    warnings.push("메인 키워드는 각 제목 후보에 한 번씩 자연스럽게 넣어 주세요.");
  }
  return warnings;
}

export function getCrossChannelTitleWarnings(naverTitle: string, wordpressTitle: string) {
  const naver = naverTitle.trim();
  const wordpress = wordpressTitle.trim();
  if (naver && wordpress && naver === wordpress) {
    return ["네이버와 워드프레스 제목이 같습니다. 워드프레스는 정보형 약속이 드러나는 다른 문장으로 바꿔 주세요."];
  }
  return [];
}

function parseJsonTitlePackage(value: string): TitlePackage | null {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      const candidates = cleanParsedTitleCandidates(parsed.map(String)).slice(0, 5);
      return {
        naver: { candidates, selectedTitle: candidates[0] ?? "" },
        wordpress: { candidates: [], selectedTitle: "" },
      };
    }
    if (!parsed || typeof parsed !== "object") return null;
    const raw = parsed as Record<string, unknown>;
    const hasChannels = "naver" in raw || "wordpress" in raw;
    if (!hasChannels) {
      const naver = readTitleResult(raw);
      return naver.candidates.length
        ? { naver, wordpress: { candidates: [], selectedTitle: "" } }
        : null;
    }

    return {
      naver: readTitleResult(raw.naver),
      wordpress: readTitleResult(raw.wordpress),
    };
  } catch {
    return null;
  }
}

function readTitleResult(value: unknown): TitleResult {
  if (Array.isArray(value)) {
    const candidates = cleanParsedTitleCandidates(value.map(String)).slice(0, 5);
    return { candidates, selectedTitle: candidates[0] ?? "" };
  }
  if (!value || typeof value !== "object") return { candidates: [], selectedTitle: "" };

  const raw = value as Record<string, unknown>;
  const candidates = cleanParsedTitleCandidates(readCandidateArray(raw.title_candidates)).slice(0, 5);
  const selectedTitle = typeof raw.selected_title === "string" ? raw.selected_title.trim() : "";
  return {
    candidates,
    selectedTitle: candidates.includes(selectedTitle) ? selectedTitle : candidates[0] ?? "",
  };
}

function readCandidateArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && "title" in item) {
        const title = (item as { title?: unknown }).title;
        return typeof title === "string" ? title : "";
      }
      return "";
    })
    .filter(Boolean);
}

function parseListedTitleCandidates(value: string) {
  const lines = value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const listedLines = lines.filter((line) => /^(?:\d{1,2}[.)]|[-*•])\s*/.test(line));
  const source = listedLines.length ? listedLines : lines;
  return source.map((line) =>
    line
      .replace(/^(?:\d{1,2}[.)]|[-*•])\s*/, "")
      .replace(/^제목\s*[:：]\s*/i, "")
      .replace(/^['"“”]|['"“”]$/g, "")
      .trim(),
  );
}

function emptyTitlePackage(): TitlePackage {
  return {
    naver: { candidates: [], selectedTitle: "" },
    wordpress: { candidates: [], selectedTitle: "" },
  };
}

function hasCriticalTitleIssue(title: string, keyword: string) {
  return getTitleWarnings(title, keyword, "naver").some((warning) =>
    warning.startsWith("메인 키워드") || warning.startsWith("홍보성"),
  );
}

function getTitleScore(title: string, keyword: string, channel: TitleChannel) {
  const warnings = getTitleWarnings(title, keyword, channel);
  return 100 - warnings.length * 15 - (title.trim().endsWith("?") ? 2 : 0);
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

function completeLockedTitleCandidates(lockedTitle: string, candidates: string[]) {
  return uniqueTitles([lockedTitle, ...candidates]).slice(0, 5);
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

function countTerm(value: string, term: string) {
  return value.match(new RegExp(escapeRegExp(term), "g"))?.length ?? 0;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
