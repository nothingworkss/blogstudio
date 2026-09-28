import type { BlogDraftInput, WordPressDraftOutput } from "@/types/blog";
import type { ImageObservation } from "@/types/image";
import type { Product, ProductRecommendation } from "@/types/product";
import { buildLocalTitleCandidates, normalizeTitleResult } from "@/lib/title-workflow";
import { formatMarkdownForWordPress } from "@/lib/utils/copyFormat";
import { buildWordPressSectionHeadings } from "@/lib/utils/seoHeadings";
import { seedProducts } from "@/lib/data/seed";

export function buildWordPressFallback({
  input,
  selectedProducts,
  products = [],
  observations = [],
  naverTitle = "",
}: {
  input: BlogDraftInput;
  selectedProducts: ProductRecommendation[];
  products?: Product[];
  observations?: ImageObservation[];
  naverTitle?: string;
}): WordPressDraftOutput {
  const [first, second] = selectedProducts;
  const catalog = products.length ? products : seedProducts;
  const firstProduct = catalog.find((product) => product.name === first.product_name);
  const secondProduct = catalog.find((product) => product.name === second.product_name);
  const airportTopic = /김포공항|공항동|송정역|제주여행/.test(`${input.topic} ${input.main_keyword}`);
  const airportGiftPair = first.product_name.includes("쿠키플라이트") && second.product_name.includes("쿠키크루");
  const keyword = input.main_keyword || input.topic;
  const headings = buildWordPressSectionHeadings(input, selectedProducts);
  const titles = normalizeTitleResult({
    channel: "wordpress",
    candidates: buildLocalTitleCandidates(input, selectedProducts, "wordpress"),
    input,
    selectedProducts,
    avoidTitle: naverTitle,
  });
  const firstFact = factSentence(first, firstProduct);
  const secondFact = factSentence(second, secondProduct);
  const pickup = airportTopic
    ? "낫띵메터스는 김포공항 안이 아니라 서울 강서구 송정로 25 1층 공항동 작업실에서 예약 픽업을 안내합니다. 필요한 날짜와 수량을 정해 제작 가능 일정과 수령 시간을 확인해 주세요."
    : "필요한 날짜와 수량을 먼저 정해 두면 가능한 구성과 수령 방법을 확인하기 편합니다. 예약 제작 상품은 일정이 확정된 뒤 수령 방법을 확인해 주세요.";
  const sections: WordPressDraftOutput["sections"] = [
    {
      id: "wp-answer",
      heading: headings[0],
      body: airportTopic
        ? "김포공항 가는 날 쿠키 선물을 챙기고 싶다면 공항동 작업실의 예약 픽업을 먼저 확인해 보세요. 공항 안에서 바로 사는 방식은 아니지만, 출발 날짜에 맞춰 선물 구성을 고를 수 있습니다."
        : `${first.product_name}과 ${second.product_name}은 같은 쿠키 선물이어도 구성과 쓰임이 다릅니다. 필요한 날짜와 전할 방식을 정한 뒤 실제 제품 구성을 살펴보면 고르기 편해요.`,
    },
    { id: "wp-first", heading: headings[1], body: firstFact },
    { id: "wp-second", heading: headings[2], body: secondFact },
    { id: "wp-pickup", heading: headings[3], body: pickup },
    {
      id: "wp-close",
      heading: headings[4],
      body: airportGiftPair
        ? "네 가지 맛을 한 상자로 전하고 싶다면 쿠키플라이트를, 쿠키와 마그넷을 함께 고르고 싶다면 쿠키크루를 살펴보세요. 여행 날짜에 맞는 픽업 가능 여부는 예약 전에 확인해야 합니다."
        : airportTopic
        ? `${first.product_name}과 ${second.product_name}의 실제 구성을 살펴본 뒤 필요한 날짜에 받을 수 있는지 확인해 보세요. 여행 당일에 맞춰 픽업하려면 예약 확정과 수령 시간을 먼저 챙겨야 합니다.`
        : `두 제품의 구성 중 필요한 쪽을 골랐다면 수량과 날짜를 함께 확인해 보세요. ${first.product_name}과 ${second.product_name}은 각각의 주문 조건에 맞춰 준비해야 합니다.`,
    },
  ];
  const faq: WordPressDraftOutput["faq"] = [
    firstProduct?.default_faq?.[0] ?? { q: `${first.product_name}은 어떤 구성인가요?`, a: firstFact },
    secondProduct?.default_faq?.[0] ?? { q: `${second.product_name}은 어떤 선물인가요?`, a: secondFact },
    {
      q: airportTopic ? "김포공항 안에서 바로 살 수 있나요?" : "주문 전에 무엇을 정하면 좋나요?",
      a: airportTopic
        ? "공식 안내는 공항 안 매장이 아닌 공항동 작업실 예약 픽업입니다. 방문 전 예약과 수령 시간을 확인해 주세요."
        : "필요한 날짜와 수량, 원하는 구성을 먼저 알려주시면 제작 가능 여부를 확인할 수 있습니다.",
    },
    {
      q: "픽업 날짜는 언제 확정되나요?",
      a: "상품과 수량에 따라 제작 가능 일정이 달라집니다. 예약 확정 후 수령 일정을 확인해 주세요.",
    },
  ];
  const tags = [...new Set([keyword, ...input.sub_keywords.slice(0, 3), first.product_name, second.product_name, "낫띵메터스", "수제쿠키", "예약 픽업"])].slice(0, 15);
  const wordpress: WordPressDraftOutput = {
    source: "template",
    title_candidates: titles.title_candidates,
    selected_title: titles.selected_title,
    slug: slugFromKeyword(keyword),
    meta_description: airportTopic
      ? airportGiftPair
        ? "김포공항 선물로 비행기 쿠키 4종 세트와 쿠키·마그넷 선물을 고를 수 있어요. 공항동 작업실 예약 픽업과 두 제품의 구성 차이를 살펴보세요."
        : `김포공항 근처 공항동 작업실에서 예약 픽업할 쿠키 선물을 살펴보세요. ${first.product_name}과 ${second.product_name}의 구성, 수령 전에 확인할 내용을 담았습니다.`
      : `${first.product_name}과 ${second.product_name}의 구성과 쓰임을 살펴보세요. 필요한 날짜와 수량을 정하고 주문 전에 확인할 내용을 담았습니다.`,
    excerpt: airportTopic
      ? "여행 가는 날 쿠키 선물을 챙기고 싶다면 공항동 예약 픽업과 제품 구성을 함께 확인해 보세요."
      : "선물할 쿠키를 고르기 전에 각 제품의 구성과 수령 일정을 확인해 보세요.",
    focus_keyword: keyword,
    secondary_keywords: [...new Set([...input.sub_keywords.slice(0, 3), first.product_name, second.product_name])],
    sections,
    faq,
    tags,
    categories: [airportTopic ? "공항동 쿠키" : "쿠키 선물"],
    image_guide: [
      { position: "도입 뒤", image_type: "제품 사진", caption: "실제 사진을 고른 뒤 설명을 작성하세요.", alt_text: observations[0]?.caption ?? "" },
      { position: `${first.product_name} 소개 뒤`, image_type: "제품 사진", caption: "실제 사진을 고른 뒤 설명을 작성하세요.", alt_text: "" },
      { position: `${second.product_name} 소개 뒤`, image_type: "제품 사진", caption: "실제 사진을 고른 뒤 설명을 작성하세요.", alt_text: "" },
    ],
    markdown_for_wordpress: "",
  };
  wordpress.markdown_for_wordpress = formatMarkdownForWordPress(wordpress);
  return wordpress;
}

function factSentence(recommendation: ProductRecommendation, product?: Product) {
  const name = recommendation.product_name;
  const description = product?.short_description?.trim() || recommendation.summary.one_line_point?.trim() || recommendation.angle?.trim();
  const detail = product?.long_description
    ?.split(/(?<=[.!?])\s+/)
    .find((sentence) => !/운영용 별칭|공식 (제품 )?페이지|공식 사이트의 상품명/.test(sentence))
    ?.trim();
  const lead = description ? `${name} 제품은 ${description.replace(/[.!?]+$/, "")}입니다.` : `${name}의 구성은 주문 전에 확인해 주세요.`;
  if (detail && !lead.includes(detail.slice(0, 20))) return `${lead}\n\n${detail}`;
  const points = recommendation.main_points.filter(Boolean).slice(0, 2);
  return points.length ? `${lead}\n\n${points.join(", ")} 같은 특징을 확인할 수 있어요.` : lead;
}

function slugFromKeyword(keyword: string) {
  const slug = keyword.toLowerCase()
    .replace(/김포공항/g, "gimpo-airport")
    .replace(/공항동/g, "gonghang-dong")
    .replace(/선물/g, "gift")
    .replace(/기념품/g, "souvenir")
    .replace(/쿠키/g, "cookie")
    .replace(/답례품/g, "favor")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "cookie-gift";
}
