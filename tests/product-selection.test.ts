import { describe, expect, it } from "vitest";
import type { BlogDraftInput } from "@/types/blog";
import { seedBrand, seedProducts } from "@/lib/data/seed";
import { fallbackCheckDraft, fallbackGenerateBlog, fallbackSelectProducts } from "@/lib/ai/fallbacks";
import { referencePatternPayload, referencePatternPrompt } from "@/lib/reference/blog-patterns";
import { selectProductsByScore } from "@/lib/ai/selectProducts";
import { blogDraftOutputSchema } from "@/lib/validations/blog.schema";
import { hydrateRecommendations } from "@/lib/product/editorial";

function input(overrides: Partial<BlogDraftInput>): BlogDraftInput {
  return {
    topic: "",
    main_keyword: "",
    sub_keywords: [],
    situation: "",
    raw_memo: "",
    post_type: "답례품 판매형",
    reference_style: "답례품 추천형",
    preferred_products: [],
    product_detail_answers: {},
    cta: "",
    images: [],
    ...overrides,
  };
}

describe("product selection scoring", () => {
  it("퇴사 답례품은 커스텀형 브라우니쿠키와 행운쿠키를 우선한다", () => {
    const result = selectProductsByScore({
      input: input({
        topic: "퇴사 답례품",
        main_keyword: "퇴사 답례품",
        raw_memo: "문구를 넣고 싶다",
      }),
      products: seedProducts,
    });

    expect(result.slice(0, 2).map((item) => item.product.name)).toEqual([
      "커스텀형 브라우니쿠키",
      "행운쿠키",
    ]);
  });

  it("어린이날 선물은 수제쿠키 패키지와 행운쿠키를 우선한다", () => {
    const result = selectProductsByScore({
      input: input({
        topic: "어린이날 선물",
        main_keyword: "어린이날 쿠키",
        raw_memo: "반 전체 아이들에게 나눠줄 선물",
      }),
      products: seedProducts,
    });

    expect(result.slice(0, 2).map((item) => item.product.name)).toEqual([
      "수제쿠키 패키지",
      "행운쿠키",
    ]);
  });

  it("스승의 날 선물은 곰돌이 스콘을 우선한다", () => {
    const result = selectProductsByScore({
      input: input({
        topic: "스승의 날 선물",
        main_keyword: "스승의 날 쿠키 선물",
      }),
      products: seedProducts,
    });

    expect(result[0].product.name).toBe("곰돌이 스콘");
  });

  it("fallback blog output follows the stricter prompt structure", () => {
    const draftInput = input({
      topic: "퇴사 답례품",
      main_keyword: "퇴사 답례품",
      sub_keywords: ["회사 답례품", "육아휴직 답례품", "커스텀 쿠키"],
      situation: "회사 마지막 날 팀원들에게 나눠줄 쿠키",
      raw_memo: "문구를 넣을 수 있는 답례품으로 소개하고 싶다",
    });
    const selectedProducts = fallbackSelectProducts(draftInput, seedProducts);
    const output = fallbackGenerateBlog({
      input: draftInput,
      brand: seedBrand,
      selectedProducts,
      observations: [],
    });

    expect(() => blogDraftOutputSchema.parse(output)).not.toThrow();
    expect(output.title_candidates).toHaveLength(5);
    expect(output.title_candidates.every((title) => title.includes(draftInput.main_keyword))).toBe(true);
    expect(output.title_candidates.filter((title) => title.endsWith("?")).length).toBeLessThanOrEqual(1);
    expect(new Set(output.title_candidates).size).toBe(5);
    expect(output.wordpress.title_candidates).toHaveLength(5);
    expect(output.wordpress.selected_title).not.toBe(output.selected_title);
    expect(output.wordpress.title_candidates.every((title) => title.includes(draftInput.main_keyword))).toBe(true);
    expect(output.wordpress.title_candidates.filter((title) => title.endsWith("?")).length).toBeLessThanOrEqual(1);
    expect(output.wordpress.selected_title.endsWith("?")).toBe(false);
    expect(output.wordpress.sections.map((section) => section.heading)).not.toEqual(output.sections.map((section) => section.heading));
    expect(output.wordpress.sections.map((section) => section.heading)).toEqual(
      expect.arrayContaining([expect.stringMatching(/^1️⃣ /), expect.stringMatching(/^7️⃣ /)]),
    );
    expect(output.sections.map((section) => section.heading)).not.toContain("도입부");
    expect(output.sections.map((section) => section.heading)).not.toContain("상황 공감");
    expect(output.sections[0]?.heading).not.toContain(draftInput.main_keyword);
    expect(output.sections[0]?.body).toContain(draftInput.main_keyword);
    expect(output.sections[1]?.heading).toContain(draftInput.sub_keywords[0]);
    expect(output.wordpress.markdown_for_wordpress).toContain("# ");
    expect(output.wordpress.markdown_for_wordpress).toContain("## ");
    expect(output.wordpress.markdown_for_wordpress).toMatch(/제가|저는|기준을 잡아요/);
    expect(output.wordpress.markdown_for_wordpress).not.toMatch(/추천드립니다|안내해 드립니다/);
    expect(output.plain_text_for_naver).toContain("✅ ");
    expect(output.wordpress.markdown_for_wordpress).toContain("✅ ");
    expect(output.plain_text_for_naver).not.toContain("\n- ");
    expect(output.wordpress.markdown_for_wordpress).not.toContain("\n- ");
    expect(output.plain_text_for_naver).not.toContain("\n* ");
    expect(output.wordpress.markdown_for_wordpress).not.toContain("\n* ");
    expect(output.wordpress.image_guide.every((item) => item.alt_text)).toBe(true);
    expect(output.wordpress.markdown_for_wordpress.split(/\n{2,}/)[1]).not.toBe(output.plain_text_for_naver.split(/\n{2,}/)[1]);
    expect(output.faq).toHaveLength(4);
    expect(output.hashtags.length).toBeGreaterThanOrEqual(10);
    const productSections = output.sections.filter((section) => section.type === "product_recommendation");
    expect(productSections).toHaveLength(2);
    expect(productSections.every((section) => section.body.includes("**사장님한마디 😎**"))).toBe(true);
    expect(productSections.every((section) => (section.body.match(/^[🍪🎀✅📌]/gmu) ?? []).length <= 2)).toBe(true);
    expect(productSections.some((section) => /\[한눈에 보기\]|추천 상황:|낫띵의 한마디|한줄 포인트|문구 포인트|포장 느낌|주문 전 확인:/.test(section.body))).toBe(false);
    expect(productSections.some((section) => section.heading?.includes("추천 제품"))).toBe(false);
    expect(output.selected_products.every((product) => product.owner_comment && product.summary.order_check)).toBe(true);
  });

  it("missing editorial profile data becomes missing_info instead of invented body text", () => {
    const draftInput = input({
      topic: "작은 선물",
      main_keyword: "쿠키 선물",
      preferred_products: ["테스트 쿠키", "행운쿠키"],
    });
    const sparseProduct = {
      ...seedProducts[0],
      id: "test-product",
      name: "테스트 쿠키",
      editorial_profile: null,
      strengths: [],
      cautions: [],
      default_intro: "",
    };
    const selectedProducts = fallbackSelectProducts(draftInput, [sparseProduct, ...seedProducts]);

    const sparseSelection = selectedProducts.find((product) => product.product_name === "테스트 쿠키");
    expect(sparseSelection?.missing_info.length).toBeGreaterThan(0);
    expect(sparseSelection?.summary.packaging_mood).toContain("상담");
  });

  it("keeps generic gift content free from stale resignation copy and places the SEO keyword in the intro body", () => {
    const draftInput = input({
      topic: "감사 답례품",
      main_keyword: "답례품 쿠키",
      situation: "감사한 분들에게 쿠키를 나누는 상황",
      raw_memo: "문구형과 선물형 구성을 비교하고 싶다",
      preferred_products: ["커스텀형 브라우니쿠키", "수제쿠키 패키지"],
    });
    const selectedProducts = hydrateRecommendations({
      input: draftInput,
      products: seedProducts,
      recommendations: [
        {
          product_name: "커스텀형 브라우니쿠키",
          reason: "짧은 문구를 담는 기준",
          angle: "문구를 남기는 답례품",
          main_points: ["문구", "날짜", "포장"],
          caution: "일정 확인 필요",
          summary: {
            recommended_situation: "",
            one_line_point: "",
            message_point: "",
            packaging_mood: "",
            order_check: "",
          },
          owner_comment: "",
          missing_info: [],
        },
        {
          product_name: "수제쿠키 패키지",
          reason: "구성 수량과 포장 방식을 보는 기준",
          angle: "선물처럼 보이는 답례품",
          main_points: ["구성", "포장", "수량"],
          caution: "구성 확인 필요",
          summary: {
            recommended_situation: "",
            one_line_point: "",
            message_point: "",
            packaging_mood: "",
            order_check: "",
          },
          owner_comment: "",
          missing_info: [],
        },
      ],
    });
    const output = fallbackGenerateBlog({
      input: draftInput,
      brand: seedBrand,
      selectedProducts,
      observations: [],
    });
    const productText = output.sections
      .filter((section) => section.type === "product_recommendation")
      .map((section) => `${section.heading}\n${section.body}`)
      .join("\n");

    expect(productText).not.toContain("퇴사");
    expect(productText).not.toContain("포장 인상");
    expect(output.sections.some((section) => section.heading === "수제쿠키 패키지, 포장을 보는 기준")).toBe(true);
    expect(productText).toContain(draftInput.main_keyword);
    expect(output.sections[0]?.body).toContain(draftInput.main_keyword);
    expect(output.sections[0]?.heading).not.toContain(draftInput.main_keyword);
    expect(output.selected_title).toContain(draftInput.main_keyword);
    expect(output.hashtags).toContain(`#${draftInput.main_keyword.replace(/\s+/g, "")}`);
  });

  it("hydrates the exact custom brownie product before the shorter brownie match", () => {
    const draftInput = input({
      topic: "퇴사 답례품",
      main_keyword: "퇴사 답례품",
      raw_memo: "문구를 넣을 수 있는 답례품으로 소개하고 싶다",
    });

    const [selection] = hydrateRecommendations({
      input: draftInput,
      products: seedProducts,
      recommendations: [
        {
          product_name: "커스텀형 브라우니쿠키",
          reason: "퇴사 답례품은 짧은 감사 문구가 중요하기 때문",
          angle: "문구를 담을 수 있는 답례품",
          main_points: ["문구", "날짜", "개별 선물"],
          caution: "문구 길이와 필요한 날짜를 확인합니다.",
          summary: {
            recommended_situation: "",
            one_line_point: "",
            message_point: "",
            packaging_mood: "",
            order_check: "",
          },
          owner_comment: "",
          missing_info: [],
        },
      ],
    });

    expect(selection.summary.recommended_situation).toContain("퇴사");
    expect(selection.summary.message_point).toContain("이름");
    expect(selection.owner_comment).toContain("퇴사 답례품");
  });

  it("reference patterns are sanitized pattern rules, not reusable source text", () => {
    const prompt = referencePatternPrompt("답례품 추천형");
    const payload = referencePatternPayload("답례품 추천형");

    expect(prompt).toContain("원문을 제거");
    expect(payload.safety_rules).toContain("가짜 고객 반응 금지");
    expect(JSON.stringify(payload)).not.toContain("외부 브랜드");
    expect(JSON.stringify(payload)).not.toContain("작성자 원문");
  });

  it("quality check warns on fabricated customer reaction wording", () => {
    const draftInput = input({
      topic: "어린이날 선물",
      main_keyword: "어린이날 쿠키",
      raw_memo: "아이들에게 나눠줄 선물",
    });
    const selectedProducts = fallbackSelectProducts(draftInput, seedProducts);
    const output = fallbackGenerateBlog({
      input: draftInput,
      brand: seedBrand,
      selectedProducts,
      observations: [],
    });
    const unsafeOutput = {
      ...output,
      plain_text_for_naver: `${output.plain_text_for_naver}\n\n아이들이 너무 좋아했어요`,
    };

    const check = fallbackCheckDraft(unsafeOutput, seedBrand.forbidden_words);

    expect(check.unsupported_claim_found).toBe(true);
    expect(check.warnings.some((warning) => warning.message.includes("후기/반응"))).toBe(true);
  });

  it("quality check treats weak channel titles as warnings instead of blocking the draft", () => {
    const draftInput = input({
      topic: "퇴사 답례품",
      main_keyword: "퇴사 답례품",
    });
    const selectedProducts = fallbackSelectProducts(draftInput, seedProducts);
    const output = fallbackGenerateBlog({
      input: draftInput,
      brand: seedBrand,
      selectedProducts,
      observations: [],
    });
    const check = fallbackCheckDraft({
      ...output,
      selected_title: "BEST 퇴사 답례품 퇴사 답례품 정리",
      wordpress: {
        ...output.wordpress,
        selected_title: "퇴사 답례품?",
      },
    }, seedBrand.forbidden_words);

    expect(check.warnings.some((warning) => warning.message.startsWith("네이버 제목:"))).toBe(true);
    expect(check.warnings.some((warning) => warning.message.startsWith("워드프레스 제목:"))).toBe(true);
  });
});
