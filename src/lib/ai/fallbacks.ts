import type { BlogDraftInput, BlogDraftOutput, DraftQualityCheck, WordPressDraftOutput } from "@/types/blog";
import type { ImageObservation } from "@/types/image";
import type { Brand, Product, ProductRecommendation } from "@/types/product";
import { analyzeReferencePatternFit, getReferenceSafetyWarnings } from "@/lib/reference/blog-patterns";
import {
  ensureRecommendationEditorialDefaults,
  formatProductRecommendationBody,
  hydrateRecommendation,
} from "@/lib/product/editorial";
import { formatMarkdownForWordPress, formatPlainTextForNaver } from "@/lib/utils/copyFormat";
import { applySeoSectionHeadings, buildWordPressSectionHeadings } from "@/lib/utils/seoHeadings";
import { deriveContentAngle } from "@/lib/content/angle";
import { buildLocalTitleCandidates, buildLocalTitlePackage, getTitleWarnings, normalizeTitleResult, type TitleResult } from "@/lib/title-workflow";
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
}): BlogDraftOutput {
  const { input, selectedProducts, observations } = params;
  const [first, second] = selectedProducts.map((product) => ensureRecommendationEditorialDefaults(product, input));
  const titleBase = input.main_keyword || input.topic;
  const cta = input.cta || params.brand.default_cta;
  const contentAngle = deriveContentAngle(input, selectedProducts);
  const targetReader = input.target_reader || "선물을 준비하는 사람";
  const imageObservationLead = buildImageObservationLead(observations);
  const titlePlan = buildLocalTitlePackage(input, selectedProducts);
  const naverTitles = normalizeTitleResult({
    channel: "naver",
    candidates: titlePlan.naver.candidates,
    selectedTitle: titlePlan.naver.selectedTitle,
    input,
    selectedProducts,
  });
  const titleCandidates = naverTitles.title_candidates;

  const outputWithoutPlain = {
    title_candidates: titleCandidates,
    selected_title: naverTitles.selected_title,
    search_intent: `${titleBase}를 찾는 ${targetReader}은 ${contentAngle.coreQuestion} 알고 싶어합니다.`,
    selected_products: selectedProducts,
    sections: [
      {
        id: "intro",
        type: "intro" as const,
        heading: "도입부",
        body: [
          `안녕하세요. nothingmatters입니다.`,
          input.situation || `${withSubjectParticle(targetReader)} ${withObjectParticle(titleBase)} 준비하는 상황이에요.`,
          imageObservationLead,
          contentAngle.introLead,
          `오늘은 ${contentAngle.coreQuestion} 중심으로 제품 2가지를 나누어 볼게요.`,
        ].filter(Boolean).join("\n\n"),
      },
      {
        id: "empathy",
        type: "empathy" as const,
        heading: "상황 공감",
        body: [
          input.raw_memo || `${contentAngle.coreQuestion}부터 정리하면 제품을 고르는 순서도 더 자연스러워집니다.`,
          "그래서 제품 이름보다 먼저 지금 건네는 장면을 살펴보는 편이 좋아요.",
          formatBulletList(contentAngle.decisionAxes),
        ].join("\n\n"),
      },
      {
        id: "product-1",
        type: "product_recommendation" as const,
        heading: buildProductSectionHeading(first.product_name),
        body: formatProductRecommendationBody({
          input,
          recommendation: first,
          otherRecommendation: second,
        }),
      },
      {
        id: "product-2",
        type: "product_recommendation" as const,
        heading: buildProductSectionHeading(second.product_name),
        body: formatProductRecommendationBody({
          input,
          recommendation: second,
          otherRecommendation: first,
        }),
      },
      {
        id: "recommend-list",
        type: "recommend_list" as const,
        heading: "이런 분들께 좋아요",
        body: formatBulletList([
          ...contentAngle.readerSignals,
          `${targetReader}처럼 제품보다 전달할 순간을 먼저 정리하고 싶은 분`,
        ]),
      },
      {
        id: "order-checklist",
        type: "order_checklist" as const,
        heading: "주문 전 체크포인트",
        body: [
          "문의하실 때는 길게 설명하지 않으셔도 괜찮아요.",
          "아래 내용만 먼저 알려주시면 상황에 맞는 쪽으로 더 빠르게 좁혀볼 수 있습니다.",
          formatBulletList(contentAngle.orderChecks),
          "아직 하나가 정해지지 않았다면 지금 고민되는 장면만 알려주셔도 괜찮아요.",
        ].join("\n\n"),
      },
      {
        id: "cta",
        type: "cta" as const,
        heading: "마무리",
        body: [
          `${input.topic}${topicParticle(input.topic)} ${withSubjectParticle(contentAngle.decisionAxes[0])} 먼저 잡히면 선택도 한결 편해질 때가 많아요.`,
          `nothingmatters는 ${withObjectParticle(joinWithAnd(contentAngle.decisionAxes.slice(0, 2)))} 함께 보면서 너무 과하지 않은 쪽으로 방향을 잡고 있어요.`,
          cta,
        ].join("\n\n"),
      },
    ],
    faq: [
      {
        q: `${withObjectParticle(input.topic)} 고를 때 무엇부터 보면 좋을까요?`,
        a: `${withObjectParticle(joinWithAnd(contentAngle.decisionAxes.slice(0, 2)))} 먼저 정한 뒤, ${joinWithAnd([first.product_name, second.product_name])} 중 더 맞는 쪽을 나누어 보면 편해요.`,
      },
      {
        q: "두 제품은 어떻게 나누어 보면 좋을까요?",
        a: `${joinWithAnd([first.product_name, second.product_name])}은 누가 받는지와 어떤 장면으로 전할지에 따라 나누어 보면 좋아요.`,
      },
      {
        q: "준비 전에 어떤 내용을 알려주면 좋을까요?",
        a: `${contentAngle.orderChecks.slice(0, 3).join(", ")} 정도를 먼저 알려주시면 확인이 빨라집니다.`,
      },
      {
        q: "배송도 가능한가요?",
        a: "일반 택배 가능 여부는 단정하지 않고, 매장 픽업 또는 차량 퀵 기준부터 먼저 봅니다.",
      },
    ],
    hashtags: [
      input.main_keyword,
      ...input.sub_keywords,
      input.topic,
      first.product_name,
      second.product_name,
      "답례품쿠키",
      "수제쿠키답례품",
      "커스텀쿠키",
      "쿠키선물",
      "nothingmatters",
      "낫띵메터스",
      "수제쿠키",
    ]
      .map((tag) => `#${tag.replace(/\s+/g, "")}`)
      .filter((tag, index, tags) => tags.indexOf(tag) === index)
      .slice(0, 15),
    image_guide: [
      {
        position: "도입부 아래",
        image_type: "대표 이미지",
        caption: observations[0]?.caption ?? `${input.topic}에 어울리는 대표 제품 사진`,
      },
      {
        position: `${first.product_name} 소개 뒤`,
        image_type: "제품 디테일",
        caption: `${first.product_name}의 선택 포인트가 보이는 사진을 배치하세요.`,
      },
      {
        position: `${second.product_name} 소개 뒤`,
        image_type: "전달 장면 사진",
        caption: `${second.product_name}이 어떤 장면에 어울리는지 보여주는 사진을 배치하세요.`,
      },
      {
        position: "주문 전 체크포인트 앞",
        image_type: "선택 기준 사진",
        caption: `${contentAngle.decisionAxes[0]} 쪽이 드러나는 사진을 배치하세요.`,
      },
      {
        position: "마무리 CTA 앞",
        image_type: "마무리 장면",
        caption: `${contentAngle.ctaLead} 자연스럽게 이어지는 사진을 배치하세요.`,
      },
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
    wordpress: buildFallbackWordPressOutput({
      input,
      first,
      second,
      naverTitle: outputWithPlain.selected_title,
      naverPlainText,
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

function buildFallbackWordPressOutput({
  input,
  first,
  second,
  naverTitle,
  naverPlainText,
  observations,
}: {
  input: BlogDraftInput;
  first: ProductRecommendation;
  second: ProductRecommendation;
  naverTitle: string;
  naverPlainText: string;
  observations: ImageObservation[];
}): WordPressDraftOutput {
  const keyword = input.main_keyword || input.topic;
  const contentAngle = deriveContentAngle(input, [first, second]);
  const targetReader = input.target_reader || "선물을 준비하는 사람";
  const imageObservationLead = buildImageObservationLead(observations);
  const sectionHeadings = buildWordPressSectionHeadings(input, [first, second]);
  const titles = normalizeTitleResult({
    channel: "wordpress",
    candidates: buildLocalTitleCandidates(input, [first, second], "wordpress"),
    input,
    selectedProducts: [first, second],
    avoidTitle: naverTitle,
  });
  const titleCandidates = titles.title_candidates;
  const selectedTitle = titles.selected_title;
  const sections = [
    {
      id: "wp-intro",
      heading: sectionHeadings[0],
      body: [
        `${withObjectParticle(keyword)} 준비할 때는 ${contentAngle.coreQuestion}부터 정리하면 선택이 훨씬 자연스러워져요.`,
        `${targetReader}처럼 전달할 장면이 분명하면 제품을 고르는 이유도 더 또렷해집니다.`,
        imageObservationLead,
      ].filter(Boolean).join("\n\n"),
    },
    {
      id: "wp-empathy",
      heading: sectionHeadings[1],
      body: formatBulletList(contentAngle.decisionAxes),
    },
    {
      id: "wp-product-1",
      heading: sectionHeadings[2],
      body: [
        `<mark style="background: linear-gradient(transparent 60%, #fff3a3 60%); padding: 0 0.08em;">${withSubjectParticle(first.product_name)} ${contentAngle.decisionAxes[0]} 쪽을 먼저 생각할 때 보기 좋아요</mark>.`,
        first.owner_comment || `${input.situation || input.topic}에 맞는 선택 포인트를 먼저 보면 좋아요.`,
        `${withObjectParticle(second.product_name)} 비교하면, ${withSubjectParticle(first.product_name)} ${contentAngle.decisionAxes[1]} 쪽을 더 또렷하게 보고 싶을 때 기준을 잡기 쉬워요.`,
      ].join("\n\n"),
    },
    {
      id: "wp-product-2",
      heading: sectionHeadings[3],
      body: [
        `<mark style="background: linear-gradient(transparent 60%, #fff3a3 60%); padding: 0 0.08em;">${withSubjectParticle(second.product_name)} ${contentAngle.decisionAxes[1]} 쪽을 가볍게 풀고 싶을 때 보기 편해요</mark>.`,
        second.owner_comment || `${input.situation || input.topic}에 맞는 전달 방식을 먼저 생각해 보면 좋아요.`,
        `둘 중 하나가 더 낫다기보다, ${withObjectParticle(joinWithAnd(contentAngle.decisionAxes.slice(0, 2)))} 어디에 두고 싶은지에 따라 나누면 됩니다.`,
      ].join("\n\n"),
    },
    {
      id: "wp-recommend-list",
      heading: sectionHeadings[4],
      body: formatBulletList(contentAngle.readerSignals),
    },
    {
      id: "wp-order-checklist",
      heading: sectionHeadings[5],
      body: formatBulletList(contentAngle.orderChecks),
    },
    {
      id: "wp-cta",
      heading: sectionHeadings[6],
      body: input.cta || `${contentAngle.ctaLead} 어떤 쪽이 더 자연스러운지 같이 좁혀볼게요.`,
    },
  ];
  const faq = [
    {
      q: `${withObjectParticle(keyword)} 고를 때 무엇부터 보면 좋을까요?`,
      a: `${withObjectParticle(joinWithAnd(contentAngle.decisionAxes.slice(0, 2)))} 먼저 정한 뒤, ${withObjectParticle(joinWithAnd([first.product_name, second.product_name]))} 나누어 보면 편해요.`,
    },
    {
      q: "워드프레스 글에는 해시태그를 넣어야 하나요?",
      a: "본문 끝에는 해시태그를 붙이지 않고, 카테고리와 태그를 따로 넣는 편이 관리하기 편해요.",
    },
    {
      q: "사진 설명은 어떻게 쓰면 좋을까요?",
      a: "제품명, 상황 키워드, 사진 유형을 자연스럽게 넣고 사진에 보이지 않는 맛이나 반응은 쓰지 않아요.",
    },
    {
      q: "네이버 글과 같은 내용을 써도 괜찮나요?",
      a: "같은 제품을 다루더라도 제목, 도입부, 소제목, 문장 순서는 다르게 잡는 편이 좋아요.",
    },
  ];
  const wordpress: WordPressDraftOutput = {
    title_candidates: titleCandidates,
    selected_title: selectedTitle,
    slug: slugifyKoreanAware(keyword),
    meta_description: `${withObjectParticle(keyword)} 준비할 때 ${withObjectParticle(joinWithAnd(contentAngle.decisionAxes.slice(0, 2)))} 먼저 정리하고 ${withObjectParticle(joinWithAnd([first.product_name, second.product_name]))} 나누어 보는 방법을 담았습니다.`,
    excerpt: `${keyword}에서 ${contentAngle.coreQuestion} 먼저 정리하는 정보형 글입니다.`,
    focus_keyword: keyword,
    secondary_keywords: [
      ...input.sub_keywords,
      first.product_name,
      second.product_name,
      input.topic,
    ].filter(Boolean).slice(0, 6),
    sections,
    faq,
    tags: [
      keyword,
      input.topic,
      ...input.sub_keywords,
      first.product_name,
      second.product_name,
      "쿠키 선물",
      "답례품 가이드",
      "nothingmatters",
    ].filter((tag, index, tags) => tag && tags.indexOf(tag) === index).slice(0, 15),
    categories: ["브랜드 블로그", "답례품 가이드"],
    image_guide: [
      {
        position: "첫 문단 아래",
        image_type: "대표 사진",
        caption: observations[0]?.caption ?? `${keyword} 기준을 보여주는 대표 사진`,
        alt_text: `${keyword} ${first.product_name} ${second.product_name} 대표 구성 사진`,
      },
      {
        position: `${first.product_name} 기준 설명 뒤`,
        image_type: "제품 디테일",
        caption: `${first.product_name}의 선택 포인트가 보이는 사진`,
        alt_text: `${keyword} ${first.product_name} 제품 디테일 사진`,
      },
      {
        position: `${second.product_name} 기준 설명 뒤`,
        image_type: "전달 장면 사진",
        caption: `${second.product_name}이 어떤 장면에 어울리는지 보여주는 사진`,
        alt_text: `${keyword} ${second.product_name} 전달 장면 사진`,
      },
    ],
    markdown_for_wordpress: "",
  };

  wordpress.markdown_for_wordpress = ensureDistinctText(formatMarkdownForWordPress(wordpress), naverPlainText);
  return wordpress;
}

function slugifyKoreanAware(value: string) {
  const mapped = value
    .toLowerCase()
    .replace(/퇴사/g, "resignation")
    .replace(/답례품/g, "gift")
    .replace(/쿠키/g, "cookie")
    .replace(/결혼/g, "wedding")
    .replace(/어린이날/g, "childrens-day")
    .replace(/스승의 날|스승의날/g, "teacher-day")
    .replace(/선물/g, "present")
    .replace(/회사/g, "company")
    .replace(/커스텀/g, "custom");
  const slug = mapped
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
  return slug || "nothingmatters-blog-guide";
}

function ensureDistinctText(wordpressText: string, naverText: string) {
  const wordpressIntro = wordpressText.split(/\n{2,}/)[1]?.trim();
  const naverIntro = naverText.split(/\n{2,}/)[1]?.trim();
  if (!wordpressIntro || wordpressIntro !== naverIntro) return wordpressText;
  return wordpressText.replace(wordpressIntro, `${wordpressIntro}\n\n이 글은 워드프레스용으로 고르는 기준을 중심에 두고 다시 정리했습니다.`);
}

function buildProductSectionHeading(productName: string) {
  if (productName.includes("커스텀")) return `문구를 담고 싶다면, ${productName}`;
  if (productName.includes("행운")) return `가볍게 마음을 전하고 싶을 때, ${productName}`;
  if (productName.includes("브라우니")) return `많은 분께 깔끔하게 나눌 땐, ${productName}`;
  if (productName.includes("수제쿠키")) return `귀여운 선물감이 필요할 때, ${productName}`;
  if (productName.includes("스콘")) return `차분하게 마음을 전하고 싶을 때, ${productName}`;
  return `${productName}이 편한 상황`;
}

function formatBulletList(items: string[]) {
  return items.filter(Boolean).map((item) => `✅ ${item}`).join("\n");
}

function hasFinalConsonant(value: string) {
  const char = value.trim().at(-1);
  if (!char) return false;
  const code = char.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

function withObjectParticle(value: string) {
  return `${value}${hasFinalConsonant(value) ? "을" : "를"}`;
}

function withSubjectParticle(value: string) {
  return `${value}${hasFinalConsonant(value) ? "이" : "가"}`;
}

function topicParticle(value: string) {
  return hasFinalConsonant(value) ? "은" : "는";
}

function joinWithAnd(values: string[]) {
  return values.filter(Boolean).reduce((joined, value) => {
    if (!joined) return value;
    return `${joined}${hasFinalConsonant(joined) ? "과" : "와"} ${value}`;
  }, "");
}

function buildImageObservationLead(observations: ImageObservation[]) {
  const observation = observations[0];
  if (!observation) return "";

  const details = [
    observation.visible_products.filter(Boolean).slice(0, 2).join(", "),
    observation.colors.length ? `${observation.colors.slice(0, 3).join(", ")} 톤` : "",
    observation.visible_text.length ? `보이는 문구 ${observation.visible_text.slice(0, 2).join(", ")}` : "",
    observation.mood,
  ].filter(Boolean);

  return details.length
    ? `사진에서는 ${details.join(" / ")}이 확인됩니다. 이 보이는 요소를 기준으로 글의 설명을 이어갈게요.`
    : "";
}

export function fallbackCheckDraft(output: BlogDraftOutput, forbiddenWords: string[] = []): DraftQualityCheck {
  const text = [output.plain_text_for_naver, output.wordpress?.markdown_for_wordpress].filter(Boolean).join("\n\n");
  const patternCheck = analyzeReferencePatternFit(output);
  const safetyWarnings = getReferenceSafetyWarnings(text);
  const repeatedPhraseWarnings = getRepeatedPhraseWarnings(text);
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
];

function getRepeatedPhraseWarnings(text: string) {
  return repeatedAiPhrases.flatMap((phrase) => {
    const count = text.split(phrase).length - 1;
    return count >= 2 ? [`"${phrase}" 표현이 ${count}번 반복되어 더 구체적인 상황 문장으로 바꾸면 좋습니다.`] : [];
  });
}
