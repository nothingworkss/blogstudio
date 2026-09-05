import { describe, expect, it } from "vitest";
import type { BlogDraftInput } from "@/types/blog";
import { deriveContentAngle } from "@/lib/content/angle";
import { fallbackGenerateBlog, fallbackSelectProducts } from "@/lib/ai/fallbacks";
import { seedBrand, seedProducts } from "@/lib/data/seed";

function input(overrides: Partial<BlogDraftInput>): BlogDraftInput {
  return {
    topic: "",
    main_keyword: "",
    sub_keywords: [],
    target_reader: "",
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

describe("content angle selection", () => {
  it("uses a farewell angle instead of the quantity-copy-package default", () => {
    const angle = deriveContentAngle(input({
      topic: "퇴사 답례품",
      main_keyword: "퇴사 답례품",
      target_reader: "마지막 출근 전 팀원 선물을 준비하는 사람",
      situation: "회사 마지막 날 팀원들에게 쿠키를 나누는 상황",
    }));

    expect(angle.id).toBe("farewell");
    expect(angle.decisionAxes).toEqual(expect.arrayContaining(["마지막 인사의 무게", "팀원에게 건네는 장면"]));
    expect(angle.decisionAxes.join(" ")).not.toMatch(/수량|문구|포장/);
  });

  it("uses an event-for-children angle for children-focused inputs", () => {
    const angle = deriveContentAngle(input({
      topic: "어린이날 쿠키 선물",
      main_keyword: "어린이날 쿠키",
      target_reader: "어린이집 행사 선물을 준비하는 선생님",
      situation: "아이들에게 캐릭터 쿠키를 나누는 날",
    }));

    expect(angle.id).toBe("children_event");
    expect(angle.decisionAxes).toEqual(expect.arrayContaining(["아이들이 받는 장면", "행사의 분위기"]));
  });

  it("adds quantity, copy, or packaging only when the input calls for it", () => {
    const angle = deriveContentAngle(input({
      topic: "감사 답례품",
      main_keyword: "답례품 쿠키",
      raw_memo: "50명에게 나눌 수량과 짧은 감사 문구, 리본 포장을 비교하고 싶다",
    }));

    expect(angle.orderChecks).toEqual(expect.arrayContaining(["예상 수량", "남기고 싶은 문구", "포장 방식"]));
  });

  it("uses observed image facts while keeping farewell checks focused on the farewell", () => {
    const draftInput = input({
      topic: "퇴사 답례품",
      main_keyword: "퇴사 답례품",
      target_reader: "마지막 출근 전 팀원 선물을 준비하는 사람",
      situation: "회사 마지막 날 팀원들에게 쿠키를 건네는 상황",
    });
    const output = fallbackGenerateBlog({
      input: draftInput,
      brand: seedBrand,
      selectedProducts: fallbackSelectProducts(draftInput, seedProducts),
      observations: [
        {
          image_url: "https://example.com/farewell-cookie.jpg",
          visible_products: ["하트 모양 쿠키", "메시지 카드"],
          packaging: "사진에서 확인된 개별 포장",
          colors: ["핑크", "크림"],
          visible_text: ["고마웠어요"],
          quantity: "사진만으로 정확한 수량은 단정하지 않음",
          mood: "차분한 마지막 인사 분위기",
          caption: "마지막 인사를 준비한 쿠키 사진",
          cautions: [],
        },
      ],
    });
    const intro = output.sections.find((section) => section.type === "intro")?.body ?? "";
    const orderChecks = output.sections.find((section) => section.type === "order_checklist")?.body ?? "";

    expect(intro).toContain("하트 모양 쿠키");
    expect(intro).toContain("핑크, 크림 톤");
    expect(intro).toContain("고마웠어요");
    expect(intro).toContain("차분한 마지막 인사 분위기");
    expect(orderChecks).toContain("남기고 싶은 인사");
    expect(orderChecks).not.toMatch(/예상 수량|남기고 싶은 문구|포장 방식/);
  });
});
