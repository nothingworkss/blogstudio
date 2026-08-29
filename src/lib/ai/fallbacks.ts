import type { BlogDraftInput, BlogDraftOutput, DraftQualityCheck, WordPressDraftOutput } from "@/types/blog";
import type { ImageObservation } from "@/types/image";
import type { Brand, Product, ProductRecommendation } from "@/types/product";
import { analyzeReferencePatternFit, getReferenceSafetyWarnings, referencePatternPayload } from "@/lib/reference/blog-patterns";
import {
  ensureRecommendationEditorialDefaults,
  formatProductRecommendationBody,
  hydrateRecommendation,
} from "@/lib/product/editorial";
import { formatMarkdownForWordPress, formatPlainTextForNaver } from "@/lib/utils/copyFormat";
import { applySeoSectionHeadings, buildWordPressSectionHeadings } from "@/lib/utils/seoHeadings";
import { buildLocalTitleCandidates } from "@/lib/title-workflow";
import { selectProductsByScore } from "./selectProducts";

export function fallbackObserveImages(imageUrls: string[]): ImageObservation[] {
  return imageUrls.map((imageUrl, index) => ({
    image_url: imageUrl,
    visible_products: ["쿠키 또는 구움과자"],
    packaging: index % 2 === 0 ? "개별 포장 또는 접시 위 완성품으로 보입니다." : "선물용 포장 사진으로 활용하기 좋습니다.",
    colors: ["브라운", "크림", "화이트"],
    visible_text: [],
    quantity: "사진만으로 정확한 수량은 단정하지 않습니다.",
    mood: "담백하고 따뜻한 수제 디저트 분위기",
    caption: "완성된 제품의 질감과 포장 분위기를 함께 보여주는 사진",
    cautions: ["사진만 보고 맛, 향, 판매량, 고객 반응을 단정하지 않기"],
  }));
}

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
          caution: product.cautions[0] ?? "일정과 수량은 주문 전 확인이 필요합니다.",
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
  const subKeywordText = input.sub_keywords.length ? input.sub_keywords.join(", ") : "상황에 맞는 쿠키 선물";
  const titleBase = input.main_keyword || input.topic;
  const cta = input.cta || params.brand.default_cta;
  const referencePattern = referencePatternPayload(input.reference_style);
  const titleObject = withObjectParticle(titleBase);
  const titleCandidates = buildLocalTitleCandidates(input, selectedProducts);

  const outputWithoutPlain = {
    title_candidates: titleCandidates,
    selected_title: titleCandidates[0],
    search_intent: `${titleBase}를 찾는 사람은 부담스럽지 않으면서도 상황에 맞는 선물과 주문 전 확인할 내용을 함께 알고 싶어합니다.`,
    selected_products: selectedProducts,
    sections: [
      {
        id: "intro",
        type: "intro" as const,
        heading: "도입부",
        body: [
          `안녕하세요. nothingmatters입니다.`,
          `${input.topic}을 준비하다 보면 생각보다 먼저 고민되는 부분이 있어요.`,
          `수량은 어느 정도가 좋을지, 문구를 넣어야 할지, 포장은 너무 과하지 않을지 한 번에 정하기가 어렵거든요.`,
          `오늘은 ${referencePattern.style} 방식으로 ${titleBase}에 어울리는 제품 2가지만 좁혀서 정리해볼게요.`,
        ].join("\n\n"),
      },
      {
        id: "empathy",
        type: "empathy" as const,
        heading: "상황 공감",
        body: [
          input.situation || `${input.topic}은 받는 사람도, 준비하는 사람도 부담이 크지 않아야 좋은 선물입니다.`,
          input.raw_memo || "짧은 문구와 포장 분위기까지 함께 생각하면 조금 더 기억에 남는 답례품이 될 수 있어요.",
          "그래서 고를 때는 제품 자체보다도 전달하는 상황을 먼저 보면 좋습니다.",
          formatBulletList([
            "몇 명에게 나눠야 하는지",
            "행사일이나 전달일이 언제인지",
            "문구나 이름처럼 남기고 싶은 포인트가 있는지",
          ]),
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
          `${titleObject} 준비하지만 너무 과한 선물은 피하고 싶은 분`,
          `${subKeywordText}까지 함께 고민하는 분`,
          "여러 명에게 깔끔하게 나눠야 하는 분",
          "짧은 문구나 포장 포인트를 함께 상담하고 싶은 분",
          "사진으로 구성과 분위기를 자연스럽게 보여주고 싶은 분",
        ]),
      },
      {
        id: "order-checklist",
        type: "order_checklist" as const,
        heading: "주문 전 체크포인트",
        body: [
          "문의하실 때는 길게 설명하지 않으셔도 괜찮아요.",
          "아래 정보만 먼저 보내주시면 가능한 구성을 더 빠르게 정리할 수 있습니다.",
          formatBulletList([
            "필요한 날짜 또는 수령 희망일",
            "예상 수량",
            "넣고 싶은 문구",
            "원하는 포장 방식",
            "픽업 또는 차량 퀵 필요 여부",
          ]),
          "문구가 아직 정해지지 않았다면 상황만 먼저 알려주셔도 방향을 같이 잡아드릴게요.",
        ].join("\n\n"),
      },
      {
        id: "cta",
        type: "cta" as const,
        heading: "마무리",
        body: [
          `${input.topic}은 크기보다 건네는 순간의 분위기가 더 오래 남는 선물일 때가 많아요.`,
          "nothingmatters는 상황에 맞는 문구와 구성을 함께 보면서 너무 과하지 않은 쪽으로 기준을 잡고 있어요.",
          cta,
        ].join("\n\n"),
      },
    ],
    faq: [
      {
        q: `${input.topic}으로 어떤 제품이 제일 잘 맞나요?`,
        a: `짧은 문구가 중요하면 ${first.product_name}, 조금 더 가볍게 전하고 싶다면 ${second.product_name}도 잘 어울립니다.`,
      },
      {
        q: "문구를 넣을 수 있나요?",
        a: "제품과 일정에 따라 가능 여부가 달라질 수 있어 필요한 날짜와 수량을 먼저 보면 좋아요.",
      },
      {
        q: "단체 주문은 어떻게 문의하면 되나요?",
        a: "날짜, 수량, 원하는 제품을 알려주시면 확인이 빠릅니다.",
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
        caption: `${first.product_name}의 문구나 질감이 보이는 사진을 배치하세요.`,
      },
      {
        position: `${second.product_name} 소개 뒤`,
        image_type: "포장 사진",
        caption: `${second.product_name}을 선물로 받는 느낌이 보이도록 배치하세요.`,
      },
      {
        position: "주문 전 체크포인트 앞",
        image_type: "수량 또는 포장 방식",
        caption: "여러 개를 함께 놓아 수량감과 전달 방식을 보여주세요.",
      },
      {
        position: "마무리 CTA 앞",
        image_type: "전체 구성",
        caption: "문의 전에 확인하면 좋은 구성과 분위기를 한 장으로 정리하세요.",
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
  };
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
  const sectionHeadings = buildWordPressSectionHeadings(input, [first, second]);
  const titleCandidates = [
    ...buildWordPressTitleCandidates(input, first.product_name, second.product_name).filter((title) => title !== naverTitle),
    `${keyword} 준비할 때 사장이 먼저 보는 기준`,
  ].map(ensureQuestionTitle).slice(0, 5);
  const selectedTitle = titleCandidates[0] ?? `${keyword} 고르는 기준과 쿠키 구성 정리`;
  const sections = [
    {
      id: "wp-intro",
      heading: sectionHeadings[0],
      body: [
        `${keyword}을 준비할 때는 제품 이름보다 먼저 수량, 전달하는 날, 문구가 필요한지부터 보게 돼요.`,
        `제가 ${input.topic} 문의를 볼 때도 이 기준이 잡혀 있으면 구성이 훨씬 자연스럽게 좁혀집니다.`,
      ].join("\n\n"),
    },
    {
      id: "wp-empathy",
      heading: sectionHeadings[1],
      body: formatBulletList([
        "받는 사람 수에 맞는 수량 기준",
        "짧은 문구나 이름을 담을 필요가 있는지",
        "개별 포장과 전달 방식이 자연스러운지",
        "행사일 또는 수령 희망일에 맞출 수 있는지",
      ]),
    },
    {
      id: "wp-product-1",
      heading: sectionHeadings[2],
      body: [
        `문구나 날짜처럼 남기고 싶은 포인트가 있으면 저는 <mark style="background: linear-gradient(transparent 60%, #fff3a3 60%); padding: 0 0.08em;">${first.product_name} 쪽으로 먼저 기준을 잡아요</mark>.`,
        `${input.situation || input.topic}처럼 전달할 장면이 정해져 있으면 문구 길이와 날짜를 먼저 보는 편이 안전합니다.`,
        `${second.product_name}와 비교하면, ${first.product_name}은 남기고 싶은 말이 있을 때 기준을 잡기 쉬워요.`,
      ].join("\n\n"),
    },
    {
      id: "wp-product-2",
      heading: sectionHeadings[3],
      body: [
        `<mark style="background: linear-gradient(transparent 60%, #fff3a3 60%); padding: 0 0.08em;">${second.product_name}은 마음을 너무 무겁게 만들지 않고 전하고 싶을 때 보기 편해요</mark>.`,
        `${first.product_name}이 문구와 기념 포인트 쪽이라면, ${second.product_name}은 가볍게 나누는 기준으로 보면 좋습니다.`,
        "둘 중 하나가 더 낫다기보다, 어떤 마음을 어느 정도의 무게로 전하고 싶은지에 따라 나누면 글도 덜 광고처럼 읽혀요.",
      ].join("\n\n"),
    },
    {
      id: "wp-recommend-list",
      heading: sectionHeadings[4],
      body: formatBulletList([
        `${keyword}을 준비하지만 기준이 아직 흐릿한 분`,
        "수량, 문구, 포장을 한 번에 정리하고 싶은 분",
        "네이버와 다른 워드프레스용 정보 글이 필요한 분",
      ]),
    },
    {
      id: "wp-order-checklist",
      heading: sectionHeadings[5],
      body: formatBulletList([
        "필요한 날짜 또는 수령 희망일",
        "예상 수량",
        "넣고 싶은 문구와 길이",
        "포장 방식",
        "픽업 또는 차량 퀵 필요 여부",
      ]),
    },
    {
      id: "wp-cta",
      heading: sectionHeadings[6],
      body: input.cta || "필요한 날짜와 수량만 먼저 알려주셔도 괜찮아요. 어떤 구성이 편할지는 그 기준을 보고 같이 좁혀볼게요.",
    },
  ];
  const faq = [
    {
      q: `${keyword}으로 어떤 쿠키 구성을 먼저 보면 좋을까요?`,
      a: `문구와 기념 포인트가 중요하면 ${first.product_name}, 가볍게 마음을 전하고 싶다면 ${second.product_name}를 기준으로 나눠 보면 편해요.`,
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
    meta_description: `${keyword}을 준비할 때 확인하면 좋은 수량, 문구, 포장 기준과 ${first.product_name}, ${second.product_name} 선택 기준을 정리했습니다.`,
    excerpt: `${keyword}을 고를 때 제가 먼저 보는 수량, 문구, 포장 기준을 정리한 글입니다.`,
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
        caption: `${first.product_name}의 문구나 디테일이 보이는 사진`,
        alt_text: `${keyword} ${first.product_name} 문구 디테일 사진`,
      },
      {
        position: `${second.product_name} 기준 설명 뒤`,
        image_type: "포장 사진",
        caption: `${second.product_name}의 포장과 전달 분위기를 보여주는 사진`,
        alt_text: `${keyword} ${second.product_name} 포장 사진`,
      },
    ],
    markdown_for_wordpress: "",
  };

  wordpress.markdown_for_wordpress = ensureDistinctText(formatMarkdownForWordPress(wordpress), naverPlainText);
  return wordpress;
}

function buildWordPressTitleCandidates(input: BlogDraftInput, firstProduct: string, secondProduct: string) {
  const keyword = input.main_keyword || input.topic;
  const situation = compactSituationForTitle(input);
  return [
    `${keyword}, 수량과 문구를 먼저 보면 어떨까요?`,
    `${keyword} 쿠키, 너무 광고 같지 않게 준비하려면 좋을까요?`,
    `${keyword}, 포장과 전달 방식을 어디까지 확인하면 좋을까요?`,
    `${keyword}, ${situation}라면 어떤 기준으로 고르면 좋을까요?`,
    `${keyword}, ${firstProduct}와 ${secondProduct} 중 어떤 구성이 편할까요?`,
  ];
}

function ensureQuestionTitle(title: string) {
  const trimmed = title.trim().replace(/[.!。]+$/g, "");
  return trimmed.endsWith("?") ? trimmed : `${trimmed}?`;
}

function compactSituationForTitle(input: BlogDraftInput) {
  const fallback = input.topic || input.main_keyword || "선물 준비";
  return (input.situation || fallback)
    .replace(/을 소개하는 글|를 소개하는 글|하는 글/g, "")
    .replace(/[.。!?]+$/g, "")
    .trim()
    .slice(0, 42);
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

function withObjectParticle(value: string) {
  return `${value}${hasFinalConsonant(value) ? "을" : "를"}`;
}

function hasFinalConsonant(value: string) {
  const char = value.trim().at(-1);
  if (!char) return false;
  const code = char.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
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
      "예제 글의 원문 문장이나 다른 브랜드 흔적은 구조 분석용으로만 쓰고 본문에서는 제거하세요.",
      "이미지 가이드는 대표컷, 디테일컷, 포장컷, 수량컷이 분리되었는지 확인하세요.",
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
