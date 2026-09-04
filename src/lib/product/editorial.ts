import type { BlogDraftInput, BlogDraftOutput } from "@/types/blog";
import type {
  Product,
  ProductEditorialProfile,
  ProductRecommendation,
  ProductRecommendationSummary,
} from "@/types/product";
import { normalizeCheckBullets } from "@/lib/utils/copyFormat";
import { includesLoose, normalizeForMatch } from "@/lib/utils/strings";

type EditorialField = keyof ProductEditorialProfile;
type SummaryField = keyof ProductRecommendationSummary;

export const editorialSummaryFields: { key: SummaryField; label: string }[] = [
  { key: "recommended_situation", label: "추천 상황" },
  { key: "one_line_point", label: "한줄 포인트" },
  { key: "message_point", label: "문구 포인트" },
  { key: "packaging_mood", label: "포장 느낌" },
  { key: "order_check", label: "주문 전 확인" },
];

export const editorialQuestionFields: {
  key: EditorialField;
  label: string;
  question: string;
}[] = [
  { key: "recommended_situation", label: "추천 상황", question: "이번 글에서 이 제품을 어떤 상황에 추천하면 좋을까요?" },
  { key: "one_line_point", label: "한줄 포인트", question: "이 제품을 한 줄로 설명하면 어떤 느낌인가요?" },
  { key: "message_point", label: "문구 포인트", question: "넣을 수 있는 문구나 강조하고 싶은 문구 방향이 있나요?" },
  { key: "packaging_mood", label: "포장 느낌", question: "포장 사진에서 꼭 보여주고 싶은 분위기가 있나요?" },
  { key: "order_check", label: "주문 전 확인", question: "주문 전에 꼭 확인해야 하는 기준은 무엇인가요?" },
  { key: "owner_comment", label: "사장님 코멘트", question: "직접 만드는 사람이 옆에서 조용히 골라주듯 1~2문장으로 말한다면 어떻게 말할까요?" },
  { key: "photo_points", label: "사진 포인트", question: "사진에서 보여주면 글이 자연스러워지는 부분이 있나요?" },
  { key: "faq_notes", label: "FAQ 메모", question: "이 제품에서 자주 물어보는 질문이 있나요?" },
];

export function emptyEditorialProfile(): ProductEditorialProfile {
  return {
    recommended_situation: "",
    one_line_point: "",
    message_point: "",
    packaging_mood: "",
    order_check: "",
    owner_comment: "",
    photo_points: "",
    faq_notes: "",
  };
}

export function normalizeEditorialProfile(profile?: Partial<ProductEditorialProfile> | null): ProductEditorialProfile {
  return {
    ...emptyEditorialProfile(),
    ...(profile ?? {}),
  };
}

export function hydrateRecommendations({
  recommendations,
  products,
  input,
}: {
  recommendations: ProductRecommendation[];
  products: Product[];
  input: BlogDraftInput;
}) {
  return recommendations.slice(0, 2).map((recommendation) => {
    const product = findProductForRecommendation(products, recommendation.product_name);
    return product ? hydrateRecommendation(recommendation, product, input) : recommendation;
  });
}

export function ensureRecommendationEditorialDefaults(
  recommendation: ProductRecommendation,
  input: BlogDraftInput,
): ProductRecommendation {
  const summary = recommendation.summary ?? {
    recommended_situation: input.topic || "추천 상황 확인 필요",
    one_line_point: recommendation.angle || "제품 한줄 포인트 확인 필요",
    message_point: "문구 적용 여부는 상담 시 확인이 필요합니다.",
    packaging_mood: "포장 방식은 수량과 전달 상황에 맞춰 상담이 필요합니다.",
    order_check: recommendation.caution || "필요한 날짜와 수량을 먼저 확인합니다.",
  };

  return {
    ...recommendation,
    summary,
    owner_comment:
      recommendation.owner_comment ||
      `${recommendation.product_name}은 ${input.topic} 상황에서 어떤 마음을 전하고 싶은지 먼저 보면 더 자연스럽게 소개할 수 있습니다.`,
    missing_info: recommendation.missing_info ?? [],
  };
}

export function hydrateRecommendation(
  recommendation: ProductRecommendation,
  product: Product,
  input: BlogDraftInput,
): ProductRecommendation {
  const profile = contextualizeEditorialProfile(normalizeEditorialProfile(product.editorial_profile), input);
  const existingSummary = recommendation.summary ?? emptyEditorialProfile();
  const summary = Object.fromEntries(
    editorialSummaryFields.map(({ key }) => [
      key,
      pickEditorialValue({
        product,
        input,
        key,
        profile,
        existingValue: existingSummary[key],
      }),
    ]),
  ) as ProductRecommendationSummary;
  const ownerComment =
    draftAnswer(input, product.name, "owner_comment") ||
    profile.owner_comment ||
    contextCompatibleText(recommendation.owner_comment, input) ||
    contextualOwnerComment(product, input) ||
    contextCompatibleText(product.default_intro, input);
  const missingInfo = mergeUnique([
    ...getMissingEditorialInfo(product, input),
    ...(recommendation.missing_info ?? []),
  ]);

  return {
    ...recommendation,
    reason: recommendation.reason || `${input.topic} 상황에서 선택 기준을 잡기 쉽습니다.`,
    angle: recommendation.angle || product.default_intro || `${input.topic}에 맞는 추천 포인트`,
    main_points: recommendation.main_points?.length ? recommendation.main_points : product.strengths.slice(0, 3),
    caution: recommendation.caution || product.cautions[0] || "필요한 날짜와 수량은 주문 전 확인이 필요합니다.",
    summary,
    owner_comment: ownerComment,
    missing_info: missingInfo,
  };
}

export function getMissingEditorialInfo(product: Product, input?: BlogDraftInput) {
  const profile = normalizeEditorialProfile(product.editorial_profile);
  return editorialQuestionFields
    .filter(({ key }) => !profile[key]?.trim() && !(input ? draftAnswer(input, product.name, key) : ""))
    .map(({ label }) => label);
}

export function formatProductSummaryBlock(recommendation: ProductRecommendation) {
  const note = shortSummarySentence(
    recommendation.owner_comment ||
      recommendation.summary.one_line_point ||
      recommendation.angle ||
      "상황에 맞는 구성과 일정을 상담하면서 맞추면 좋습니다.",
  );

  return `**사장님한마디 😎**\n${note}`;
}

export function formatProductRecommendationBody({
  input,
  recommendation,
  otherRecommendation,
}: {
  input: BlogDraftInput;
  recommendation: ProductRecommendation;
  otherRecommendation?: ProductRecommendation;
}) {
  const anglePhrase = productAnglePhrase(recommendation.product_name);
  const otherPhrase = otherRecommendation
    ? `${otherRecommendation.product_name}${topicParticle(otherRecommendation.product_name)} ${productAnglePhrase(otherRecommendation.product_name)}을 먼저 볼 때 편하고, ${recommendation.product_name}${topicParticle(recommendation.product_name)} ${anglePhrase}을 기준으로 볼 때 편해요.`
    : `${recommendation.product_name}${topicParticle(recommendation.product_name)} ${anglePhrase}을 기준으로 보면 편해요.`;

  return [
    formatProductSummaryBlock(recommendation),
    `이 구성이 편한 건 ${specificSituationPhrase(input, recommendation)}예요.`,
    `제품 자랑을 먼저 하기보다, 받는 사람이 어떤 순간에 이 쿠키를 받게 될지부터 보면 고르기 편합니다.`,
    `✅ ${otherPhrase}`,
    `문의하실 때는 ${orderCheckPhrase(recommendation)}`,
    recommendation.missing_info.length
      ? `✅ 아직 자료가 비어 있는 부분은 ${recommendation.missing_info.join(", ")}입니다. 이 부분은 구성에 따라 달라질 수 있어 문의 때 확인하는 쪽이 안전합니다.`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function applyEditorialProductSections(output: BlogDraftOutput, input: BlogDraftInput): BlogDraftOutput {
  const selectedProducts = output.selected_products.map((recommendation) =>
    ensureRecommendationEditorialDefaults(recommendation, input),
  );
  let productIndex = 0;

  return {
    ...output,
    selected_products: selectedProducts,
    sections: output.sections.map((section) => {
      if (section.type !== "product_recommendation") return section;
      const recommendation = selectedProducts[productIndex];
      const otherRecommendation = selectedProducts[productIndex === 0 ? 1 : 0];
      productIndex += 1;
      if (!recommendation) return section;

      return {
        ...section,
        heading: normalizeProductSectionHeading(section.heading, recommendation.product_name),
        body: normalizeProductRecommendationSection({
          body: section.body,
          input,
          recommendation,
          otherRecommendation,
        }),
      };
    }),
  };
}

function normalizeProductSectionHeading(heading: string | undefined, productName: string) {
  if (!heading || /추천\s*제품\s*\d?/.test(heading)) return productSectionHeading(productName);
  return heading;
}

function productSectionHeading(productName: string) {
  if (productName.includes("커스텀")) return `문구를 담고 싶다면, ${productName}`;
  if (productName.includes("행운")) return `가볍게 마음을 전하고 싶을 때, ${productName}`;
  if (productName.includes("브라우니")) return `많은 분께 깔끔하게 나눌 땐, ${productName}`;
  if (productName.includes("수제쿠키")) return `귀여운 선물감이 필요할 때, ${productName}`;
  if (productName.includes("스콘")) return `차분하게 마음을 전하고 싶을 때, ${productName}`;
  return `${productName}이 편한 상황`;
}

function pickEditorialValue({
  product,
  input,
  key,
  profile,
  existingValue,
}: {
  product: Product;
  input: BlogDraftInput;
  key: SummaryField;
  profile: ProductEditorialProfile;
  existingValue?: string;
}) {
  const answer = draftAnswer(input, product.name, key);
  if (answer) return answer;
  if (profile[key]) return profile[key];
  if (existingValue) return existingValue;

  if (key === "recommended_situation") return input.topic || product.fit_situations.slice(0, 3).join(", ");
  if (key === "one_line_point") {
    return contextCompatibleText(product.default_intro, input) || product.short_description || "제품 한줄 포인트 확인 필요";
  }
  if (key === "message_point") {
    return hasProductMarker(product, "문구") ? "짧은 문구 포인트를 상담하면서 맞추기 좋습니다." : "문구 적용 여부는 상담 시 확인이 필요합니다.";
  }
  if (key === "packaging_mood") return "포장 방식은 수량과 전달 상황에 맞춰 상담이 필요합니다.";
  return product.cautions[0] || "필요한 날짜와 수량을 먼저 확인합니다.";
}

function draftAnswer(input: BlogDraftInput, productName: string, key: EditorialField) {
  return input.product_detail_answers?.[productName]?.[key]?.trim() ?? "";
}

function hasProductMarker(product: Product, marker: string) {
  return [product.name, product.category, product.short_description, product.long_description, ...product.strengths, ...product.keywords]
    .filter(Boolean)
    .some((value) => String(value).includes(marker));
}

function findProductForRecommendation(products: Product[], recommendationName: string) {
  const normalizedRecommendationName = normalizeForMatch(recommendationName);
  const exactMatch = products.find((product) => normalizeForMatch(product.name) === normalizedRecommendationName);
  if (exactMatch) return exactMatch;

  return [...products]
    .sort((left, right) => right.name.length - left.name.length)
    .find(
      (product) =>
        includesLoose(product.name, recommendationName) ||
        includesLoose(recommendationName, product.name),
    );
}

function productAnglePhrase(productName: string) {
  if (productName.includes("커스텀")) return "문구와 기념 포인트를 살리는 구성";
  if (productName.includes("행운")) return "가볍게 나누는 응원 선물";
  if (productName.includes("스콘")) return "차분한 감사 선물";
  if (productName.includes("수제쿠키")) return "귀엽고 사진에 남는 선물 구성";
  if (productName.includes("terminal")) return "콘셉트와 세계관을 보여주는 구성";
  if (productName.includes("브라우니")) return "여러 명에게 깔끔하게 나누는 답례 구성";
  return "상황에 맞춰 기준을 잡기 쉬운 구성";
}

function cleanSentence(value: string) {
  const trimmed = value.trim().replace(/[.。]+$/g, "");
  return trimmed ? `${trimmed}.` : "";
}

function orderCheckPhrase(recommendation: ProductRecommendation) {
  const source = recommendation.summary.order_check || recommendation.caution || "필요한 날짜와 수량";
  return `${source.trim().replace(/[.。]+$/g, "")} 정도를 먼저 알려주시면 기준을 잡기 편해요.`;
}

function normalizeProductRecommendationSection({
  body,
  input,
  recommendation,
  otherRecommendation,
}: {
  body: string;
  input: BlogDraftInput;
  recommendation: ProductRecommendation;
  otherRecommendation?: ProductRecommendation;
}) {
  if (!body.trim()) {
    return formatProductRecommendationBody({ input, recommendation, otherRecommendation });
  }
  if (!contextCompatibleText(body, input)) {
    return formatProductRecommendationBody({ input, recommendation, otherRecommendation });
  }

  if (body.includes("**사장님한마디 😎**")) return normalizeCheckBullets(body);
  if (body.includes("[한눈에 보기]") || body.includes("추천 상황:") || body.includes("낫띵의 한마디") || body.includes("사장님 한마디")) {
    return normalizeCheckBullets(normalizeProductSummaryBlock(body, recommendation));
  }

  return normalizeCheckBullets(`${formatProductSummaryBlock(recommendation)}\n\n${body}`);
}

function normalizeProductSummaryBlock(body: string, recommendation: ProductRecommendation) {
  return body.replace(
    /(?:\[한눈에 보기\]\n?(?:🎁\s*추천 상황:.*\n?)?(?:😎\s*낫띵의 한마디:.*\n?)?|🎁\s*추천 상황:.*\n?(?:😎\s*낫띵의 한마디:.*\n?)?|😎\s*낫띵의 한마디:.*\n?|💌\s*사장님 한마디:.*\n?)/,
    `${formatProductSummaryBlock(recommendation)}\n\n`,
  );
}

function specificSituationPhrase(input: BlogDraftInput, recommendation: ProductRecommendation) {
  const context = [input.topic, input.situation, recommendation.summary.recommended_situation].filter(Boolean).join(" ");
  const productName = recommendation.product_name;
  if (context.includes("퇴사") && productName.includes("커스텀")) return "퇴사 마지막 날 팀원들에게 하나씩 건네면서, 짧은 문구를 남기고 싶을 때";
  if (context.includes("퇴사") && productName.includes("행운")) return "마지막 인사를 너무 무겁게 만들지 않고, 작은 응원처럼 건네고 싶을 때";
  if (context.includes("퇴사")) return "퇴사 마지막 날 여러 명에게 같은 기준으로 나눠야 할 때";
  if (context.includes("어린이") || context.includes("유치원") || context.includes("어린이집")) return "아이들에게 하나씩 전해야 해서 귀여운 구성과 수량 기준을 같이 봐야 할 때";
  if (context.includes("스승") || context.includes("어버이") || context.includes("감사")) return "감사 인사는 전하고 싶지만 선물이 너무 무겁게 느껴지지 않았으면 할 때";
  if (context.includes("결혼")) return "여러 분께 같은 느낌으로 나눠야 해서 포장과 수량이 먼저 정리되어야 할 때";
  const fallback = recommendation.summary.recommended_situation || input.situation || input.topic;
  return fallback ? `${fallback}을 기준으로 고를 때` : "받는 사람과 전달하는 날이 어느 정도 정해져 있을 때";
}

function contextualizeEditorialProfile(profile: ProductEditorialProfile, input: BlogDraftInput) {
  return Object.fromEntries(
    Object.entries(profile).map(([key, value]) => [key, contextCompatibleText(value, input)]),
  ) as ProductEditorialProfile;
}

function contextCompatibleText(value: string | null | undefined, input: BlogDraftInput) {
  const text = value?.trim() ?? "";
  if (!text) return "";

  const textContexts = extractSituationContexts(text);
  if (!textContexts.length) return text;

  const inputText = [input.topic, input.main_keyword, input.target_reader, input.situation, input.raw_memo].filter(Boolean).join(" ");
  const inputContexts = extractSituationContexts(inputText);
  if (!inputContexts.length) return "";
  return textContexts.every((context) => inputContexts.includes(context)) ? text : "";
}

function extractSituationContexts(value: string) {
  const contextPatterns: Array<[string, RegExp]> = [
    ["퇴사", /퇴사|마지막 출근/],
    ["승진", /승진/],
    ["육아휴직", /육아휴직|출산휴가/],
    ["복직", /복직/],
    ["결혼", /결혼|웨딩/],
    ["어린이", /어린이날|어린이집|유치원|아이들? 선물/],
    ["스승", /스승의?\s*날|선생님/],
    ["어버이", /어버이날|부모님/],
    ["생일", /생일/],
    ["졸업", /졸업/],
    ["기업행사", /기업\s*행사|브랜드\s*행사|회사\s*행사/],
    ["응원", /응원|시험/],
    ["새해", /새해/],
  ];
  return contextPatterns.filter(([, pattern]) => pattern.test(value)).map(([context]) => context);
}

function contextualOwnerComment(product: Product, input: BlogDraftInput) {
  const keyword = input.main_keyword || input.topic || "이번 답례품";
  if (hasProductMarker(product, "문구") || product.name.includes("커스텀")) {
    return `${keyword}에서 이름이나 짧은 문구를 남기고 싶다면, 문구 길이와 전달할 말을 먼저 정하는 편이 자연스럽습니다.`;
  }
  if (product.name.includes("수제쿠키") || product.category.includes("선물")) {
    return `${keyword}에서 여러 명에게 나눌 구성이라면, 구성 수량과 포장 방식을 먼저 보는 편이 좋습니다.`;
  }
  return `${keyword}에 맞는 구성을 고를 때는 제품 이름보다 전달할 날짜, 수량, 포장 기준을 먼저 보면 정리하기 쉽습니다.`;
}

function shortSummarySentence(value: string) {
  const trimmed = value.trim().replace(/\s+/g, " ");
  const firstSentence = trimmed.match(/^[^.!?。]+(?:[.!?。]|요\.|니다\.)?/)?.[0] ?? trimmed;
  return cleanSentence(firstSentence);
}

function topicParticle(value: string) {
  return hasFinalConsonant(value) ? "은" : "는";
}

function hasFinalConsonant(value: string) {
  const lastChar = value.trim().at(-1);
  if (!lastChar) return false;
  const code = lastChar.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

function mergeUnique(values: string[]) {
  return values.filter((value, index, list) => value && list.indexOf(value) === index);
}
