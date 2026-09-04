import type { BlogDraftInput } from "@/types/blog";
import type { ImageObservation } from "@/types/image";
import type { ProductRecommendation } from "@/types/product";

export type TitleChannel = "naver" | "wordpress";

export const titleIdeaTypes = [
  "정보형",
  "경험 확인형",
  "비교형",
  "문제 해결형",
  "궁금증 유발형",
  "구매 직전형",
] as const;

export type TitleIdeaType = (typeof titleIdeaTypes)[number];

export type TitleTopic = {
  mainKeyword: string;
  targetReader: string;
  situation: string;
  articlePromise: string;
  evidence: string[];
};

export type TitleEvaluation = {
  title: string;
  type: TitleIdeaType;
  searchIntentScore: number;
  clickAppealScore: number;
  naturalnessScore: number;
  keywordFitScore: number;
  reason: string;
};

export type TitleResult = {
  candidates: string[];
  selectedTitle: string;
  evaluations: TitleEvaluation[];
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
  naver: ["정보형", "경험 확인형", "비교형", "문제 해결형", "궁금증 유발형"],
  wordpress: ["정보형", "경험 확인형", "비교형", "문제 해결형", "구매 직전형"],
};

const titleContracts: Record<TitleChannel, string> = {
  naver: `
[네이버 제목 계약]
- 제목은 검색자가 지금 어떤 선물을 어떻게 준비할지 바로 짐작하게 하는 자연스러운 한국어 문장이다.
- 메인 키워드는 후보마다 정확히 1회만 자연스럽게 넣고, topic은 글의 문제의식으로 이어간다.
- 제목을 바로 5개만 쓰지 않는다. 먼저 정보형·경험 확인형·비교형·문제 해결형·궁금증 유발형·구매 직전형으로 각 5개씩, 총 30개를 내부에서 만든다.
- 30개 중 타깃 독자, 현재 상황, 글의 약속을 가장 잘 담은 5개만 최종 후보로 남긴다. 각 후보는 같은 시작 구조와 결말을 반복하지 않는다.
- 경험 확인형은 실제 후기나 고객 반응을 꾸미지 말고, 독자가 확인할 사실과 선택 장면으로 쓴다.
- 질문형은 5개 중 최대 1개만 쓴다. 추천 제목은 질문형이라서 고르지 말고 검색 의도와 상황이 가장 또렷한 것을 고른다.
- 권장 길이는 22~40자다. 제품명·키워드를 나열하거나 제목 끝에 '정리', '추천', '소개'만 붙이지 않는다.
- BEST, 완벽, 총정리, 무조건 같은 홍보성 표현과 근거 없는 후기, 인기, 판매량, 가격, 수치, 클릭 유도 표현은 쓰지 않는다.
`.trim(),
  wordpress: `
[워드프레스 제목 계약]
- 제목은 오래 참고할 정보형 글의 약속을 분명히 하는 자연스러운 한국어 문장이다. 네이버 제목을 동의어로 바꾸지 않는다.
- focus keyword(메인 키워드)는 후보마다 정확히 1회만 자연스럽게 넣고, 수량·날짜·문구·포장·전달 방식 중 실제 입력에 있는 판단 축을 붙인다.
- 제목을 바로 5개만 쓰지 않는다. 먼저 정보형·경험 확인형·비교형·문제 해결형·궁금증 유발형·구매 직전형으로 각 5개씩, 총 30개를 내부에서 만든다.
- 30개 중 타깃 독자, 현재 상황, 글의 약속을 가장 잘 담은 5개만 최종 후보로 남긴다. 네이버 제목의 어순이나 약속을 재사용하지 않는다.
- 경험 확인형은 실제 후기나 고객 반응을 꾸미지 말고, 독자가 확인할 사실과 선택 장면으로 쓴다.
- 질문형은 5개 중 최대 1개만 쓴다. 모든 제목에 물음표를 붙이지 않는다.
- 권장 길이는 26~48자다. 제목 끝에 '정리', '추천', '소개'만 붙이거나 네이버 제목을 반복하지 않는다.
- BEST, 완벽, 총정리, 무조건 같은 홍보성 표현과 근거 없는 후기, 인기, 판매량, 가격, 수치, 클릭 유도 표현은 쓰지 않는다.
`.trim(),
};

export function getTitleContract(channel: TitleChannel) {
  return titleContracts[channel];
}

export function buildTitleTopic(input: BlogDraftInput, selectedProducts: ProductRecommendation[] = []): TitleTopic {
  const mainKeyword = input.main_keyword.trim() || input.topic.trim() || "쿠키 선물";
  const targetReader = input.target_reader.trim() || inferTargetReader(input.situation, mainKeyword);
  const situation = compactTitlePhrase(input.situation || input.topic, mainKeyword) || "선물을 준비하는 중";
  const articlePromise = compactTitlePhrase(input.raw_memo, mainKeyword) || `${situation}에서 먼저 확인할 내용을 정리`;
  const evidence = selectedProducts
    .flatMap((product) => [product.product_name, product.angle, product.owner_comment, product.caution])
    .filter(Boolean)
    .slice(0, 6);

  return { mainKeyword, targetReader, situation, articlePromise, evidence };
}

export function buildTitleGenerationPrompt() {
  return `너는 nothingmatters의 제목 전문 에디터다.

목표:
제목을 본문보다 먼저 설계한다. 같은 입력으로 네이버와 워드프레스 제목을 각각 만들되, 두 채널이 같은 제목이나 동의어 변형으로 겹치지 않게 한다.

${getTitleContract("naver")}

${getTitleContract("wordpress")}

제목 주제 설계:
- input.title_topic의 mainKeyword, targetReader, situation, articlePromise, evidence를 제목 주제의 우선 근거로 쓴다.
- targetReader와 situation이 비어 있지 않으면 제목에서 실제 사람이 처한 순간이나 해결하려는 질문이 드러나야 한다.
- 수량·문구·포장은 input.title_topic 또는 evidence에 있을 때만 쓴다. 세 단어를 기본적인 제목 공식처럼 반복하지 않는다.
- 경험 확인형은 실제 후기·고객 반응·구매 경험을 만들지 않는다. 독자가 확인할 사실과 선택 장면으로 쓴다.

생성·평가 순서:
1. 정보형, 경험 확인형, 비교형, 문제 해결형, 궁금증 유발형, 구매 직전형을 각 5개씩 만들어 채널당 정확히 30개를 탐색한다.
2. 각 제목을 검색 의도 적합성, 클릭 가능성, 자연스러움, 키워드 적합성으로 각각 10점 만점 평가한다.
3. 제목 문장 자체는 점수나 이유를 넣지 않는다. 상위 5개만 ranked_candidates와 title_candidates에 같은 순서로 넣는다.
4. selected_title은 ranked_candidates 1위와 같은 문장을 그대로 고른다.

공통 금지:
- 메인 키워드 반복, 키워드 나열, BEST·완벽·총정리·무조건 같은 과장
- 입력에 없는 후기, 인기, 가격, 판매량, 수치, 배송 가능 여부
- 설명 문장, 마크다운 코드블록

반드시 아래 JSON 구조만 출력한다:
{
  "naver": {
    "candidate_groups": [{ "type": "정보형", "titles": ["제목 1", "제목 2", "제목 3", "제목 4", "제목 5"] }],
    "ranked_candidates": [{ "title": "상위 제목", "type": "정보형", "scores": { "search_intent": 9, "click_appeal": 8, "naturalness": 9, "keyword_fit": 9 }, "reason": "타깃과 현재 상황이 제목에 드러납니다." }],
    "title_candidates": ["상위 제목 1", "상위 제목 2", "상위 제목 3", "상위 제목 4", "상위 제목 5"],
    "selected_title": "상위 제목 1"
  },
  "wordpress": {
    "candidate_groups": [{ "type": "정보형", "titles": ["제목 1", "제목 2", "제목 3", "제목 4", "제목 5"] }],
    "ranked_candidates": [{ "title": "상위 제목", "type": "정보형", "scores": { "search_intent": 9, "click_appeal": 8, "naturalness": 9, "keyword_fit": 9 }, "reason": "정보 글의 약속이 제목에 드러납니다." }],
    "title_candidates": ["상위 제목 1", "상위 제목 2", "상위 제목 3", "상위 제목 4", "상위 제목 5"],
    "selected_title": "상위 제목 1"
  }
}`;
}

export function buildLocalTitlePackage(
  input: BlogDraftInput,
  selectedProducts: ProductRecommendation[] = [],
): TitlePackage {
  return {
    naver: buildLocalTitleResult(input, selectedProducts, "naver"),
    wordpress: buildLocalTitleResult(input, selectedProducts, "wordpress"),
  };
}

export function normalizeTitlePackage(
  raw: unknown,
  input: BlogDraftInput,
  selectedProducts: ProductRecommendation[],
): TitlePackage {
  const parsed = typeof raw === "string" ? parseTitlePackage(raw) : readTitlePackage(raw);
  const fallback = buildLocalTitlePackage(input, selectedProducts);
  const naver = normalizeTitlePackageChannel(parsed.naver, fallback.naver, input, selectedProducts, "naver");
  const wordpress = normalizeTitlePackageChannel(parsed.wordpress, fallback.wordpress, input, selectedProducts, "wordpress", naver.selectedTitle);
  return { naver, wordpress };
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
    naver: { candidates, selectedTitle: candidates[0] ?? "", evaluations: [] },
    wordpress: { candidates: [], selectedTitle: "", evaluations: [] },
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
    title_topic: buildTitleTopic(input, selectedProducts),
    topic: input.topic,
    main_keyword: input.main_keyword,
    target_reader: input.target_reader,
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
같은 입력을 쓰되 네이버와 워드프레스가 같은 제목을 반복하지 않도록, 두 채널에서 30개씩 넓게 탐색하고 상위 5개만 선별한다. 제목은 본문보다 먼저 검색 의도와 읽을 이유를 분명히 해야 한다.

${getTitleContract("naver")}

${getTitleContract("wordpress")}

공통 규칙:
- 사용자 입력, 선택 제품, 사장님 코멘트와 주의사항 밖의 사실은 제목에 넣지 않는다.
- title_topic의 targetReader, situation, articlePromise을 제목 주제의 우선 근거로 쓴다. 수량·문구·포장을 기본 답처럼 반복하지 말고, 실제 입력에 있을 때만 사용한다.
- 각 유형 5개씩 총 30개를 먼저 만들고, 검색 의도 적합성·클릭 가능성·자연스러움·키워드 적합성을 각각 10점 만점으로 평가한다.
- ranked_candidates에는 총점이 높은 5개만 넣고, 후보마다 유형·4개 점수·좋은 이유를 한 줄로 적는다.
- 후보마다 시작 구조, 쉼표 위치, 끝맺음, 질문 여부를 반복하지 않는다.
- selected_title은 같은 채널의 title_candidates 중 하나를 그대로 고른다.
- 설명, 분석, 마크다운 코드블록 없이 아래 JSON 객체만 출력한다.

출력 형식:
{
  "naver": {
    "candidate_groups": [{ "type": "정보형", "titles": ["제목 1", "제목 2", "제목 3", "제목 4", "제목 5"] }],
    "ranked_candidates": [{ "title": "상위 제목", "type": "정보형", "scores": { "search_intent": 9, "click_appeal": 8, "naturalness": 9, "keyword_fit": 9 }, "reason": "타깃과 상황이 제목에 바로 보입니다." }],
    "title_candidates": ["제목 1", "제목 2", "제목 3", "제목 4", "제목 5"],
    "selected_title": "네이버 최종 제목"
  },
  "wordpress": {
    "candidate_groups": [{ "type": "정보형", "titles": ["제목 1", "제목 2", "제목 3", "제목 4", "제목 5"] }],
    "ranked_candidates": [{ "title": "상위 제목", "type": "정보형", "scores": { "search_intent": 9, "click_appeal": 8, "naturalness": 9, "keyword_fit": 9 }, "reason": "정보 글의 약속이 제목에 바로 보입니다." }],
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
  const pool = buildLocalTitlePool(input, selectedProducts, channel);
  const preferredTypes = channel === "naver"
    ? ["정보형", "경험 확인형", "비교형", "문제 해결형", "궁금증 유발형"] as const
    : ["정보형", "경험 확인형", "비교형", "문제 해결형", "구매 직전형"] as const;

  return preferredTypes.map((type) => pool[type][0]).filter(Boolean);
}

export function buildLocalTitlePool(
  input: BlogDraftInput,
  selectedProducts: ProductRecommendation[] = [],
  channel: TitleChannel = "naver",
): Record<TitleIdeaType, string[]> {
  const topic = buildTitleTopic(input, selectedProducts);
  const keyword = topic.mainKeyword;
  const target = shortenTitleContext(topic.targetReader, 16) || "선물을 준비하는 사람";
  const situation = shortenTitleContext(topic.situation, 16) || "준비가 필요한 순간";
  const firstName = selectedProducts[0]?.product_name || "첫 번째 제품";
  const secondName = selectedProducts[1]?.product_name || "두 번째 제품";
  const isWordPress = channel === "wordpress";
  const guideWord = isWordPress ? "준비 가이드" : "먼저 알아둘 것";

  return {
    정보형: [
      `${withObjectParticle(target)} 위한 ${keyword}, ${guideWord}`,
      `${withObjectParticle(keyword)} 준비할 때 먼저 알아둘 내용`,
      `${keyword}, 선택 전에 정리하면 좋은 순서`,
      `${keyword} 준비에 필요한 기본 흐름`,
      `${keyword}, 지금 확인할 준비 포인트`,
    ],
    "경험 확인형": [
      `${keyword}, 실제 준비 전에 확인할 점`,
      `${withObjectParticle(keyword)} 고를 때 놓치기 쉬운 부분`,
      `${withSubjectParticle(target)} ${withObjectParticle(keyword)} 준비하며 확인할 점`,
      `${keyword}, 준비 과정에서 다시 보게 되는 조건`,
      `${keyword}, 제품보다 먼저 확인할 준비 조건`,
    ],
    비교형: [
      `${firstName}와 ${secondName}, ${keyword}에서 다른 점`,
      `${keyword}, ${firstName}과 ${secondName}을 나누어 보는 법`,
      `${target}의 ${keyword}, 두 제품을 고르는 순서`,
      `${keyword} 준비, ${firstName}과 ${secondName} 비교 포인트`,
      `${target}의 ${keyword}, 두 제품을 나누어 보는 이유`,
    ],
    "문제 해결형": [
      `${keyword} 준비가 막힐 때, 무엇부터 정리할까`,
      `${withObjectParticle(keyword)} 고르기 어려울 때 다시 볼 질문`,
      `${keyword}, 무엇부터 정해야 준비가 쉬워질까`,
      `${target}의 ${keyword} 고민, 순서부터 다시 잡기`,
      `${keyword} 준비 전 헷갈리는 부분을 나누어 보는 법`,
    ],
    "궁금증 유발형": [
      `${keyword}, 먼저 정하면 준비가 쉬워지는 한 가지`,
      `${target}은 ${keyword}에서 무엇을 먼저 볼까?`,
      `${keyword}, 준비 전에 놓치기 쉬운 한 가지`,
      `${keyword}을 고를 때 제품보다 앞서는 질문`,
      `${situation}의 ${keyword}, 어디부터 좁혀야 할까?`,
    ],
    "구매 직전형": [
      `${withObjectParticle(target)} 위한 ${keyword}, 문의 전 확인할 내용`,
      `${keyword}, 결정 전에 볼 항목`,
      `${keyword} 준비 마무리 전 체크할 것`,
      `${target}을 위한 ${keyword}, 결정 직전의 선택`,
      `${keyword}, 지금 문의 전에 정리할 내용`,
    ],
  };
}

function buildLocalTitleResult(
  input: BlogDraftInput,
  selectedProducts: ProductRecommendation[],
  channel: TitleChannel,
): TitleResult {
  const pool = buildLocalTitlePool(input, selectedProducts, channel);
  const selectedTypes = channel === "naver"
    ? ["정보형", "경험 확인형", "비교형", "문제 해결형", "궁금증 유발형"] as const
    : ["정보형", "경험 확인형", "비교형", "문제 해결형", "구매 직전형"] as const;
  const topic = buildTitleTopic(input, selectedProducts);
  const evaluations = selectedTypes.map((type) => createLocalTitleEvaluation(pool[type][0], type, topic));
  const candidates = evaluations.map((item) => item.title);

  return {
    candidates,
    selectedTitle: evaluations
      .slice()
      .sort((left, right) => totalTitleScore(right) - totalTitleScore(left))[0]?.title ?? candidates[0] ?? "",
    evaluations,
  };
}

function normalizeTitlePackageChannel(
  raw: TitleResult,
  fallback: TitleResult,
  input: BlogDraftInput,
  selectedProducts: ProductRecommendation[],
  channel: TitleChannel,
  avoidTitle = "",
): TitleResult {
  const normalized = normalizeTitleResult({
    channel,
    candidates: [...raw.candidates, ...fallback.candidates],
    selectedTitle: raw.selectedTitle,
    input,
    selectedProducts,
    avoidTitle,
  });
  const topic = buildTitleTopic(input, selectedProducts);
  const evaluations = normalized.title_candidates.map((title, index) =>
    raw.evaluations.find((item) => item.title === title)
    ?? fallback.evaluations.find((item) => item.title === title)
    ?? createLocalTitleEvaluation(title, titleIdeaTypes[index] ?? "정보형", topic),
  );
  const selectedTitle = normalized.selected_title;

  return { candidates: normalized.title_candidates, selectedTitle, evaluations };
}

function createLocalTitleEvaluation(title: string, type: TitleIdeaType, topic: TitleTopic): TitleEvaluation {
  const hasKeyword = topic.mainKeyword && title.includes(topic.mainKeyword);
  const hasTarget = topic.targetReader && hasLooseTerm(title, topic.targetReader);
  const hasSituation = topic.situation && hasLooseTerm(title, topic.situation);
  const naturalnessPenalty = getTitleWarnings(title, topic.mainKeyword, "naver").length;
  const reason = type === "비교형"
    ? "두 제품을 어떤 상황에서 나누어 볼지 바로 보입니다."
    : type === "문제 해결형"
      ? "타깃이 막히는 지점과 글의 해결 방향이 함께 드러납니다."
      : type === "구매 직전형"
        ? "결정 직전에 확인할 정보를 정보형으로 약속합니다."
        : hasTarget || hasSituation
          ? "타깃과 현재 상황이 제목에서 구체적으로 보입니다."
          : "검색 주제와 글의 약속이 제목에서 바로 보입니다.";

  return {
    title,
    type,
    searchIntentScore: Math.min(10, 7 + Number(Boolean(hasTarget || hasSituation)) + Number(Boolean(hasKeyword))),
    clickAppealScore: type === "궁금증 유발형" ? 9 : type === "문제 해결형" ? 8 : 7,
    naturalnessScore: Math.max(5, 9 - naturalnessPenalty),
    keywordFitScore: hasKeyword ? 9 : 5,
    reason,
  };
}

function totalTitleScore(item: TitleEvaluation) {
  return item.searchIntentScore * 2 + item.clickAppealScore + item.naturalnessScore + item.keywordFitScore;
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
    target_reader: input.target_reader,
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
    return readTitlePackage(parsed);
  } catch {
    return null;
  }
}

function readTitlePackage(value: unknown): TitlePackage {
  if (Array.isArray(value)) {
    const candidates = cleanParsedTitleCandidates(value.map(String)).slice(0, 5);
    return {
      naver: { candidates, selectedTitle: candidates[0] ?? "", evaluations: [] },
      wordpress: { candidates: [], selectedTitle: "", evaluations: [] },
    };
  }
  if (!value || typeof value !== "object") return emptyTitlePackage();

  const raw = value as Record<string, unknown>;
  if (!("naver" in raw || "wordpress" in raw)) {
    const naver = readTitleResult(raw);
    return naver.candidates.length
      ? { naver, wordpress: { candidates: [], selectedTitle: "", evaluations: [] } }
      : emptyTitlePackage();
  }

  return {
    naver: readTitleResult(raw.naver),
    wordpress: readTitleResult(raw.wordpress),
  };
}

function readTitleResult(value: unknown): TitleResult {
  if (Array.isArray(value)) {
    const candidates = cleanParsedTitleCandidates(value.map(String)).slice(0, 5);
    return { candidates, selectedTitle: candidates[0] ?? "", evaluations: [] };
  }
  if (!value || typeof value !== "object") return { candidates: [], selectedTitle: "", evaluations: [] };

  const raw = value as Record<string, unknown>;
  const evaluations = readTitleEvaluations(raw.ranked_candidates);
  const candidates = cleanParsedTitleCandidates([
    ...evaluations.map((item) => item.title),
    ...readCandidateArray(raw.title_candidates),
  ]).slice(0, 5);
  const selectedTitle = typeof raw.selected_title === "string" ? raw.selected_title.trim() : "";
  return {
    candidates,
    selectedTitle: candidates.includes(selectedTitle) ? selectedTitle : candidates[0] ?? "",
    evaluations: evaluations.filter((item) => candidates.includes(item.title)),
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

function readTitleEvaluations(value: unknown): TitleEvaluation[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const raw = item as Record<string, unknown>;
      const scores = raw.scores && typeof raw.scores === "object" ? raw.scores as Record<string, unknown> : {};
      const title = typeof raw.title === "string" ? raw.title.trim() : "";
      if (!title) return null;
      return {
        title,
        type: isTitleIdeaType(raw.type) ? raw.type : "정보형",
        searchIntentScore: normalizeScore(scores.search_intent),
        clickAppealScore: normalizeScore(scores.click_appeal),
        naturalnessScore: normalizeScore(scores.naturalness),
        keywordFitScore: normalizeScore(scores.keyword_fit),
        reason: typeof raw.reason === "string" ? raw.reason.trim() : "제목 주제와 검색 의도를 함께 담았습니다.",
      };
    })
    .filter((item): item is TitleEvaluation => Boolean(item));
}

function isTitleIdeaType(value: unknown): value is TitleIdeaType {
  return typeof value === "string" && titleIdeaTypes.includes(value as TitleIdeaType);
}

function normalizeScore(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? Math.min(10, Math.max(0, Math.round(value))) : 0;
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
    naver: { candidates: [], selectedTitle: "", evaluations: [] },
    wordpress: { candidates: [], selectedTitle: "", evaluations: [] },
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

function inferTargetReader(situation: string, mainKeyword: string) {
  const cleaned = compactTitlePhrase(situation, mainKeyword);
  return cleaned ? `${cleaned}을 준비하는 사람` : `${mainKeyword}을 찾는 사람`;
}

function hasLooseTerm(value: string, term: string) {
  const tokens = term.split(/\s+/).filter((token) => token.length >= 2);
  return tokens.some((token) => value.includes(token));
}

function withObjectParticle(value: string) {
  return `${value}${hasFinalConsonant(value) ? "을" : "를"}`;
}

function withSubjectParticle(value: string) {
  return `${value}${hasFinalConsonant(value) ? "이" : "가"}`;
}

function hasFinalConsonant(value: string) {
  const char = value.trim().at(-1);
  if (!char) return false;
  const code = char.charCodeAt(0);
  return code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0;
}

function compactTitlePhrase(value: string, keyword: string) {
  return value
    .replace(new RegExp(escapeRegExp(keyword), "g"), "")
    .replace(/을 소개하는 글|를 소개하는 글|하는 글/g, "")
    .replace(/[.。!?]+$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 28);
}

function shortenTitleContext(value: string, limit: number) {
  const normalized = value.replace(/\s+/g, " ").trim()
    .replace(/사람$|분$/g, "")
    .trim()
    .replace(/을 준비하는$|를 준비하는$/g, "")
    .trim()
    .replace(/[을를은는이가]$/g, "")
    .trim();
  return normalized.length > limit ? normalized.slice(0, limit).trim() : normalized;
}

function countTerm(value: string, term: string) {
  return value.match(new RegExp(escapeRegExp(term), "g"))?.length ?? 0;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
