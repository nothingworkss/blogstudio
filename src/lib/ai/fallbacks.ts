import type { BlogDraftInput, BlogDraftOutput, DraftQualityCheck } from "@/types/blog";
import type { ImageObservation } from "@/types/image";
import type { Brand, Product, ProductRecommendation } from "@/types/product";
import { analyzeReferencePatternFit, getReferenceSafetyWarnings } from "@/lib/reference/blog-patterns";
import {
  ensureRecommendationEditorialDefaults,
  hydrateRecommendation,
} from "@/lib/product/editorial";
import { seedProducts } from "@/lib/data/seed";
import { formatPlainTextForNaver } from "@/lib/utils/copyFormat";
import { applySeoSectionHeadings } from "@/lib/utils/seoHeadings";
import { buildWordPressFallback } from "@/lib/content/wordpress-fallback";
import { buildLocalTitlePackage, getTitleWarnings, normalizeTitleResult, type TitleResult } from "@/lib/title-workflow";
import { selectProductsByScore } from "./selectProducts";

export function fallbackSelectProducts(
  input: BlogDraftInput,
  products: Product[],
  observations: ImageObservation[] = [],
): ProductRecommendation[] {
  return selectProductsByScore({
    input,
    products,
    observations,
    recentProductNames: [],
  })
    .slice(0, 2)
    .map(({ product, score, reasons }) =>
      hydrateRecommendation(
        {
          product_name: product.name,
          reason: reasons[0] ?? `${input.topic} 상황과 제품 키워드가 맞닿아 있습니다.`,
          angle: product.default_intro ?? `${input.topic}에 맞는 선물 포인트`,
          main_points: product.strengths.slice(0, 3),
          caution: product.cautions[0] ?? "필요한 시점과 선택 기준은 주문 전 확인이 필요합니다.",
          summary: {
            recommended_situation: "",
            one_line_point: "",
            message_point: "",
            packaging_mood: "",
            order_check: "",
          },
          owner_comment: "",
          missing_info: [],
          score,
        },
        product,
        input,
      ),
    );
}

export function fallbackGenerateBlog(params: {
  input: BlogDraftInput;
  brand: Brand;
  selectedProducts: ProductRecommendation[];
  observations: ImageObservation[];
  products?: Product[];
}): BlogDraftOutput {
  const { input, selectedProducts, observations } = params;
  const [first, second] = selectedProducts.map((product) => ensureRecommendationEditorialDefaults(product, input));
  const catalog = params.products?.length ? params.products : seedProducts;
  const firstProduct = catalog.find((product) => product.name === first.product_name);
  const secondProduct = catalog.find((product) => product.name === second.product_name);
  const firstName = publicProductName(first.product_name);
  const secondName = publicProductName(second.product_name);
  const airportTopic = /김포공항|공항동|송정역|비행기|여행/.test(`${input.topic} ${input.main_keyword}`);
  const titlePlan = buildLocalTitlePackage(input, selectedProducts);
  const naverTitles = normalizeTitleResult({
    channel: "naver",
    candidates: titlePlan.naver.candidates,
    selectedTitle: titlePlan.naver.selectedTitle,
    input,
    selectedProducts,
  });
  const firstSummary = contextSafeSummary(firstProduct, first, input);
  const secondSummary = contextSafeSummary(secondProduct, second, input);
  const imageLead = observedImageSentence(observations);
  const flightAndCrew = firstName === "비행기 버터쿠키" && secondName === "쿠키크루";
  const intro = `${flightAndCrew
    ? "비행기 모양 쿠키를 한 개씩 챙기고 싶다면 비행기 버터쿠키가 있어요. 쿠키와 마그넷을 함께 고르는 선물이라면 쿠키크루를 살펴보세요."
    : `${airportTopic ? "비행기 쿠키를 찾고 계신가요?" : "어떤 쿠키 구성을 찾고 계신가요?"} ${firstName}${subjectParticle(firstName)} ${firstSummary.replace(/[.!?]+$/, "")}입니다. ${secondName}${subjectParticle(secondName)} ${secondSummary.replace(/[.!?]+$/, "")}입니다.`}${imageLead ? `\n\n${imageLead}` : ""}`;
  const pickup = airportTopic
    ? "김포공항 안에서 바로 구매하는 방식은 아닙니다. 서울 강서구 송정로 25 1층 공항동 작업실에서 예약 픽업을 안내하고 있어요. 필요한 날짜와 수량을 먼저 정한 뒤 수령 가능한 시간을 확인해 주세요."
    : "필요한 날짜와 수량을 먼저 정해 주세요. 제품별 구성과 수령 가능 일정은 주문 전에 확인할 수 있습니다.";
  const faq = [
    firstProduct?.default_faq?.[0] ?? { q: `${firstName}은 어떻게 구성되어 있나요?`, a: firstSummary },
    secondProduct?.default_faq?.[0] ?? { q: `${secondName}은 어떻게 구성되어 있나요?`, a: secondSummary },
    airportTopic
      ? { q: "김포공항 안에서 바로 살 수 있나요?", a: "공항 안 매장이 아닌 공항동 작업실에서 예약 픽업을 안내합니다. 방문 전에 수령 가능 시간을 확인해 주세요." }
      : { q: "수령 날짜는 언제 확인하나요?", a: "원하는 제품과 수량에 따라 가능한 날짜를 확인해야 합니다. 예약 전에 필요한 날짜를 알려주세요." },
    { q: "예약할 때 무엇을 알려주면 되나요?", a: "원하는 제품과 수량, 필요한 날짜를 알려주시면 제작 및 픽업 가능 여부를 확인할 수 있습니다." },
  ];
  const hashtagCandidates = [
    input.main_keyword,
    ...input.sub_keywords,
    ...(firstProduct?.keywords ?? []),
    ...(secondProduct?.keywords ?? []),
    firstName,
    secondName,
    "수제쿠키",
    "nothingmatters",
  ];
  const hashtags = [...new Set(hashtagCandidates
    .filter((tag) => tag && tag !== input.topic && tag !== "SNS쿠키" && tag.length <= 16 && !/[｜|,]/.test(tag))
    .map((tag) => `#${tag.replace(/\s+/g, "")}`))].slice(0, 10);
  const outputWithoutPlain = {
    naver_source: "template" as const,
    title_candidates: naverTitles.title_candidates,
    selected_title: naverTitles.selected_title,
    search_intent: `${input.main_keyword}를 찾는 독자에게 두 제품의 실제 구성과 수령 방법을 설명한다.`,
    selected_products: selectedProducts,
    sections: [
      { id: "intro", type: "intro" as const, heading: airportTopic ? "비행기 쿠키, 어떤 구성을 찾으세요?" : "어떤 쿠키 구성을 찾으세요?", body: intro },
      { id: "product-1", type: "product_recommendation" as const, heading: `${firstName}의 구성`, body: productFactBody(first, firstProduct, input) },
      { id: "product-2", type: "product_recommendation" as const, heading: `${secondName}의 구성`, body: productFactBody(second, secondProduct, input) },
      { id: "order-checklist", type: "order_checklist" as const, heading: airportTopic ? "공항동 예약 픽업 전에 확인할 것" : "주문 전에 확인할 것", body: pickup },
      { id: "cta", type: "cta" as const, heading: "필요한 날짜에 맞춰 준비하기", body: input.cta || "원하는 제품과 수량, 필요한 날짜를 알려주시면 가능한 구성을 확인해 드릴게요." },
    ],
    faq,
    hashtags,
    image_guide: [
      { position: "도입부 아래", image_type: "대표 이미지", caption: observations[0]?.caption ?? "실제 제품 사진을 선택해 주세요." },
      { position: `${firstName} 소개 뒤`, image_type: "제품 구성 사진", caption: "실제 구성과 포장이 보이는 사진을 선택해 주세요." },
      { position: `${secondName} 소개 뒤`, image_type: "제품 구성 사진", caption: "실제 구성과 포장이 보이는 사진을 선택해 주세요." },
    ],
  };

  const seoOutput = applySeoSectionHeadings(outputWithoutPlain, input);
  const naverPlainText = formatPlainTextForNaver(seoOutput);
  const outputWithPlain = {
    ...seoOutput,
    plain_text_for_naver: naverPlainText,
  };

  return {
    ...outputWithPlain,
    wordpress: buildWordPressFallback({
      input,
      selectedProducts: [first, second],
      products: params.products,
      naverTitle: outputWithPlain.selected_title,
      observations,
    }),
    title_analysis: {
      naver: serializeTitleEvaluations(titlePlan.naver),
      wordpress: serializeTitleEvaluations(titlePlan.wordpress),
      candidate_groups: {
        naver: titlePlan.naver.candidateGroups,
        wordpress: titlePlan.wordpress.candidateGroups,
      },
    },
  };
}

function publicProductName(name: string) {
  if (name.startsWith("SNS쿠키")) return "비행기 버터쿠키";
  return name.replace(/\s*\([^)]*\)/g, "");
}

function productFactBody(recommendation: ProductRecommendation, product: Product | undefined, input: BlogDraftInput) {
  const readerLead = recommendation.product_name.startsWith("SNS쿠키")
    ? "한 개씩 나눠 챙기실 건가요?"
    : recommendation.product_name.startsWith("쿠키크루")
      ? "쿠키와 같은 캐릭터의 마그넷도 궁금하신가요?"
      : "";
  const details = product?.long_description?.split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence
      .replace(/,?\s*공식 (?:제품 )?페이지 기준.*$/, "")
      .replace(/하며$/, "합니다")
      .trim())
    .filter((sentence) => contextSafe(sentence, input) && !/공식 사이트|블로그 운영용 별칭|가격/.test(sentence))
    .map((sentence) => /[.!?]$/.test(sentence) ? sentence : `${sentence}.`)
    .slice(0, 2) ?? [];
  if (details.length) return [readerLead, ...details].filter(Boolean).join("\n\n");

  const points = recommendation.main_points.filter(Boolean).slice(0, 2);
  const fallback = points.length
    ? `${publicProductName(recommendation.product_name)}${subjectParticle(publicProductName(recommendation.product_name))} ${points.join(", ")} 구성이에요.`
    : `${publicProductName(recommendation.product_name)}의 자세한 구성은 주문 전에 확인해 주세요.`;
  return [readerLead, fallback].filter(Boolean).join("\n\n");
}

function contextSafeSummary(product: Product | undefined, recommendation: ProductRecommendation, input: BlogDraftInput) {
  const candidates = [product?.short_description, recommendation.summary.one_line_point, ...recommendation.main_points];
  return candidates.find((candidate) => candidate && contextSafe(candidate, input)) || "주문 전에 구성을 확인할 수 있는 쿠키";
}

function contextSafe(value: string, input: BlogDraftInput) {
  const context = `${input.topic} ${input.main_keyword} ${input.situation}`;
  const markers = ["퇴사", "승진", "육아휴직", "복직", "결혼", "어린이날", "스승의 날", "어버이날"];
  return markers.every((marker) => !value.includes(marker) || context.includes(marker));
}

function subjectParticle(value: string) {
  const last = value.trim().at(-1);
  const code = last?.charCodeAt(0) ?? 0;
  return code >= 0xac00 && code <= 0xd7a3 && (code - 0xac00) % 28 !== 0 ? "은" : "는";
}

function observedImageSentence(observations: ImageObservation[]) {
  const observation = observations[0];
  if (!observation) return "";
  const facts = [
    observation.visible_products.slice(0, 2).join(", "),
    observation.colors.length ? `${observation.colors.slice(0, 2).join(", ")} 톤` : "",
    observation.visible_text.length ? `${observation.visible_text.slice(0, 2).join(", ")} 문구` : "",
  ].filter(Boolean);
  return facts.length ? `올려주신 사진에서 ${facts.join(", ")}를 확인할 수 있어요.` : "";
}

function serializeTitleEvaluations(result: TitleResult) {
  return result.evaluations.map((item) => ({
    title: item.title,
    type: item.type,
    search_intent_score: item.searchIntentScore,
    click_appeal_score: item.clickAppealScore,
    naturalness_score: item.naturalnessScore,
    keyword_fit_score: item.keywordFitScore,
    reason: item.reason,
  }));
}

export function fallbackCheckDraft(output: BlogDraftOutput, forbiddenWords: string[] = []): DraftQualityCheck {
  const text = [output.plain_text_for_naver, output.wordpress?.markdown_for_wordpress].filter(Boolean).join("\n\n");
  const patternCheck = analyzeReferencePatternFit(output);
  const safetyWarnings = getReferenceSafetyWarnings(text);
  const repeatedPhraseWarnings = getRepeatedPhraseWarnings(text);
  const editorialLeak = /사장님한마디|공감댓글|품질\/SEO 체크|이미지 배치 안내/.test(output.plain_text_for_naver);
  const risky = [...forbiddenWords, "무조건", "완벽한", "전국 택배 가능", "1위", "최고"].filter(
    (word) => word && text.includes(word),
  );
  const longParagraph = text.split(/\n\n/).some((paragraph) => paragraph.length > 360);
  const naverTitleWarnings = getTitleWarnings(output.selected_title, output.wordpress.focus_keyword, "naver");
  const wordpressTitleWarnings = getTitleWarnings(output.wordpress.selected_title, output.wordpress.focus_keyword, "wordpress");

  return {
    warnings: [
      ...risky.map((word) => ({
        level: "warning" as const,
        message: `"${word}" 표현은 과장처럼 보일 수 있어 수정하는 편이 좋습니다.`,
      })),
      ...(output.selected_products.length !== 2
        ? [{ level: "danger" as const, message: "본문에는 제품 2개만 소개해야 합니다." }]
        : []),
      ...(longParagraph
        ? [{ level: "info" as const, message: "모바일에서는 문단을 조금 더 짧게 나누면 좋아요." }]
        : []),
      ...naverTitleWarnings.map((message) => ({
        level: "warning" as const,
        message: `네이버 제목: ${message}`,
      })),
      ...wordpressTitleWarnings.map((message) => ({
        level: "warning" as const,
        message: `워드프레스 제목: ${message}`,
      })),
      ...safetyWarnings.map((message) => ({
        level: "warning" as const,
        message,
      })),
      ...repeatedPhraseWarnings.map((message) => ({
        level: "info" as const,
        message,
      })),
      ...(editorialLeak ? [{ level: "warning" as const, message: "본문에 작성용 라벨이나 편집 안내가 섞였습니다." }] : []),
      ...patternCheck.warnings.slice(0, 3).map((message) => ({
        level: message.includes("정확히 2개") ? ("danger" as const) : ("info" as const),
        message,
      })),
    ],
    exaggeration_found: risky.length > 0,
    unsupported_claim_found: text.includes("전국 택배 가능") || safetyWarnings.length > 0,
    mobile_readability_score: Math.min(longParagraph ? 72 : 90, patternCheck.mobile_paragraph_score),
    suggestions: [
      "맛, 향, 고객 반응은 사진만 보고 단정하지 않았는지 확인하세요.",
      "메인 키워드가 제목과 도입부에 자연스럽게 들어갔는지 확인하세요.",
      "네이버는 검색 순간의 현실 고민, 워드프레스는 오래 참고할 선택 정보를 제목에서 약속하는지 확인하세요.",
      "예제 글의 원문 문장이나 다른 브랜드 흔적은 구조 분석용으로만 쓰고 본문에서는 제거하세요.",
      "이미지 가이드는 대표컷, 제품 디테일, 전달 장면, 선택 기준이 보이는 컷이 나뉘었는지 확인하세요.",
    ],
  };
}

const repeatedAiPhrases = [
  "하기 좋은 구성입니다",
  "에 잘 맞는 제품입니다",
  "로 소개하기 좋습니다",
  "부담 없이 준비하기 좋습니다",
  "훨씬 쉬워집니다",
  "정성스러운 마음을 전할 수 있습니다",
  "센스 있는 선물입니다",
  "특별한 답례품입니다",
  "깔끔하게 전달됩니다",
  "자연스럽게 소개하기 좋습니다",
  "기준을 잡기 편해요",
  "건네는 장면",
];

function getRepeatedPhraseWarnings(text: string) {
  return repeatedAiPhrases.flatMap((phrase) => {
    const count = text.split(phrase).length - 1;
    return count >= 2 ? [`"${phrase}" 표현이 ${count}번 반복되어 더 구체적인 상황 문장으로 바꾸면 좋습니다.`] : [];
  });
}
