import { describe, expect, it } from "vitest";
import type { BlogDraftInput } from "@/types/blog";
import type { ProductRecommendation } from "@/types/product";
import {
  applyLockedNaverTitle,
  buildLocalTitleCandidates,
  buildLockedNaverTitleInstructions,
  buildManualTitlePrompt,
  buildTitleContextFingerprint,
  getTitleWarnings,
  isManualTitlePromptText,
  parseTitleCandidates,
} from "@/lib/title-workflow";

const input: BlogDraftInput = {
  topic: "퇴사 답례품",
  main_keyword: "퇴사 답례품",
  sub_keywords: ["회사 답례품", "커스텀 쿠키"],
  situation: "회사 마지막 날 팀원들에게 쿠키를 나누는 상황",
  raw_memo: "문구와 포장이 자연스럽게 보였으면 좋겠다",
  post_type: "답례품 판매형",
  reference_style: "답례품 추천형",
  preferred_products: ["커스텀형 브라우니쿠키", "행운쿠키"],
  product_detail_answers: {},
  cta: "날짜와 수량을 알려주세요.",
  images: [],
};

const selectedProducts: ProductRecommendation[] = [
  {
    product_name: "커스텀형 브라우니쿠키",
    reason: "짧은 감사 문구를 담기 좋습니다.",
    angle: "문구를 중심으로 준비하는 답례품",
    main_points: ["문구", "포장"],
    caution: "일정 확인이 필요합니다.",
    summary: {
      recommended_situation: "퇴사 인사",
      one_line_point: "문구를 담기 좋음",
      message_point: "짧은 문구",
      packaging_mood: "정돈된 포장",
      order_check: "날짜와 수량",
    },
    owner_comment: "문구가 중요한 날에 먼저 봅니다.",
    missing_info: [],
  },
  {
    product_name: "행운쿠키",
    reason: "가볍게 나누기 좋습니다.",
    angle: "부담 없이 전하는 퇴사 인사",
    main_points: ["가벼운 전달", "메시지"],
    caution: "수량 확인이 필요합니다.",
    summary: {
      recommended_situation: "팀원 선물",
      one_line_point: "가볍게 나누기 좋음",
      message_point: "메시지 확인",
      packaging_mood: "담백한 포장",
      order_check: "예상 수량",
    },
    owner_comment: "여럿에게 편하게 나눌 때 봅니다.",
    missing_info: [],
  },
];

describe("semi-manual title workflow", () => {
  it("parses numbered, bulleted, array JSON, and object JSON title results", () => {
    expect(parseTitleCandidates("1. 첫 번째 제목\n2) 두 번째 제목\n- 세 번째 제목")).toEqual([
      "첫 번째 제목",
      "두 번째 제목",
      "세 번째 제목",
    ]);
    expect(parseTitleCandidates('["배열 제목 1", "배열 제목 2"]')).toEqual(["배열 제목 1", "배열 제목 2"]);
    expect(parseTitleCandidates('{"title_candidates":["객체 제목 1","객체 제목 2"]}')).toEqual([
      "객체 제목 1",
      "객체 제목 2",
    ]);
    expect(parseTitleCandidates("1. 중복 제목\n2. 중복 제목\n3. 다른 제목")).toEqual(["중복 제목", "다른 제목"]);
  });

  it("rejects the copied prompt skeleton instead of treating style labels as titles", () => {
    const copiedPrompt = `후보 구성:
1. 키워드 직결형
2. 구체적 상황형
3. 선택 기준형
4. 제품 비교형
5. 부드러운 호기심형

작성 규칙:
- 질문형은 최대 1개만 쓴다.

출력 형식:
1. 제목
2. 제목
3. 제목
4. 제목
5. 제목`;

    expect(isManualTitlePromptText(copiedPrompt)).toBe(true);
    expect(parseTitleCandidates(copiedPrompt)).toEqual([]);
    expect(parseTitleCandidates("1. 키워드 직결형\n2. 구체적 상황형\n3. 선택 기준형")).toEqual([]);
  });

  it("builds a compact mixed-style title prompt without an app API call", () => {
    const prompt = buildManualTitlePrompt({ input, selectedProducts });

    expect(prompt).toContain("정확히 5개");
    expect(prompt).toContain("키워드 직결형");
    expect(prompt).toContain("구체적 상황형");
    expect(prompt).toContain("질문형은 최대 1개");
    expect(prompt).toContain("메인 키워드는 후보마다 최대 1회");
    expect(prompt).toContain("BEST");
    expect(prompt).toContain("총정리");
    expect(prompt).toContain("22~40자");
    expect(prompt).toContain("커스텀형 브라우니쿠키");
    expect(prompt).toContain("행운쿠키");
    expect(prompt.length).toBeLessThan(2_500);
  });

  it("creates five local fallbacks with at most one question title", () => {
    const titles = buildLocalTitleCandidates(input, selectedProducts);

    expect(titles).toHaveLength(5);
    expect(titles.every((title) => title.includes(input.main_keyword))).toBe(true);
    expect(titles.filter((title) => title.endsWith("?")).length).toBeLessThanOrEqual(1);
  });

  it("locks the user's title over a different pasted model title", () => {
    const locked = applyLockedNaverTitle(
      {
        title_candidates: ["모델 후보"],
        selected_title: "모델이 임의로 고른 제목",
        sections: [],
      },
      {
        selectedTitle: "사용자가 직접 고른 제목",
        titleCandidates: ["사용자가 직접 고른 제목", "다른 사용자 후보"],
        input,
        selectedProducts,
      },
    );

    expect(locked.selected_title).toBe("사용자가 직접 고른 제목");
    expect(locked.title_candidates).toHaveLength(5);
    expect(locked.title_candidates[0]).toBe("사용자가 직접 고른 제목");
    expect(locked.title_candidates).not.toContain("모델이 임의로 고른 제목");
  });

  it("instructs the body model to preserve the selected title without echoing title fields", () => {
    const instructions = buildLockedNaverTitleInstructions("사용자가 직접 고른 제목", 5);

    expect(instructions).toContain('selected_title은 "사용자가 직접 고른 제목"');
    expect(instructions).toContain("한 글자도 바꾸지 않는다");
    expect(instructions).toContain("제목 후보 5개를 다시 출력하지 않는다");
    expect(instructions).toContain("title_candidates, selected_title");
  });

  it("invalidates titles for title-context changes but ignores CTA changes", () => {
    const base = buildTitleContextFingerprint({ input, selectedProducts, observations: [] });
    const ctaChanged = buildTitleContextFingerprint({
      input: { ...input, cta: "새 CTA" },
      selectedProducts,
      observations: [],
    });
    const topicChanged = buildTitleContextFingerprint({
      input: { ...input, topic: "승진 답례품" },
      selectedProducts,
      observations: [],
    });
    const productChanged = buildTitleContextFingerprint({
      input,
      selectedProducts: selectedProducts.map((product, index) =>
        index === 0 ? { ...product, product_name: "다른 제품" } : product,
      ),
      observations: [],
    });

    expect(ctaChanged).toBe(base);
    expect(topicChanged).not.toBe(base);
    expect(productChanged).not.toBe(base);
  });

  it("returns warnings without blocking a non-empty title", () => {
    const warnings = getTitleWarnings("BEST 퇴사 답례품 퇴사 답례품", input.main_keyword);

    expect(warnings.some((warning) => warning.includes("반복"))).toBe(true);
    expect(warnings.some((warning) => warning.includes("홍보성"))).toBe(true);
    expect(getTitleWarnings("퇴사 답례품, 마지막 출근날 건네기 좋은 쿠키", input.main_keyword)).toEqual([]);
  });
});
