import { describe, expect, it } from "vitest";
import { blogLayoutPrompt } from "@/lib/prompts/blog-layout";
import { productSelectorPrompt } from "@/lib/prompts/product-selector";
import { sectionRegeneratorPrompt } from "@/lib/prompts/section-regenerator";
import { wordpressLayoutPrompt } from "@/lib/prompts/wordpress-layout";

describe("writing prompt contracts", () => {
  it("keeps the Naver prompt outcome-first and evidence-bound", () => {
    expect(blogLayoutPrompt).toContain("성공 기준");
    expect(blogLayoutPrompt).toContain("근거 우선순위");
    expect(blogLayoutPrompt).toContain("사용자 입력");
    expect(blogLayoutPrompt).toContain("제품 DB");
    expect(blogLayoutPrompt).toContain("사진 관찰");
    expect(blogLayoutPrompt).toContain("추정하지 않는다");
  });

  it("locks the requested keyword budget without stuffing", () => {
    expect(blogLayoutPrompt).toContain("메인 키워드는 완성 본문 전체에서 정확히 3회");
    expect(blogLayoutPrompt).toContain("서브 키워드는 각 키워드별 최대 2회");
    expect(blogLayoutPrompt).toContain("해시태그까지 합산");
    expect(blogLayoutPrompt).toContain("최종 제목 1회, 도입 본문 1회, 해시태그 1회");
  });

  it("uses current mixed title shapes instead of forcing every title into a question", () => {
    expect(blogLayoutPrompt).toContain("키워드 직결형");
    expect(blogLayoutPrompt).toContain("질문형은 최대 1개");
    expect(blogLayoutPrompt).toContain("22~40자");
    expect(blogLayoutPrompt).toContain("BEST, 완벽, 총정리, 무조건");
    expect(blogLayoutPrompt).not.toContain("모두 메인 키워드를 자연스럽게 포함한 부드러운 질문형");
  });

  it("does not repeat the already-completed product-selection matrix", () => {
    expect(blogLayoutPrompt).toContain("selected_products의 2개만");
    expect(blogLayoutPrompt).not.toContain("[퇴사 / 승진 / 육아휴직 / 복직]");
    expect(blogLayoutPrompt.length).toBeLessThan(6_500);
  });

  it("gives both long-form channels a grounded owner voice without invented scenes", () => {
    expect(blogLayoutPrompt).toContain("사장님 생활 말투");
    expect(blogLayoutPrompt).toContain("입력에 없는 작업 장면은 만들지 않는다");
    expect(blogLayoutPrompt).toContain("생활형 판단");
    expect(wordpressLayoutPrompt).toContain("생활감 있는 사장님 존댓말");
    expect(wordpressLayoutPrompt).toContain("새 작업 장면이나 감정을 만들지 않는다");
  });

  it("treats product mappings as hints and keeps the current topic authoritative", () => {
    expect(productSelectorPrompt).toContain("고정 선택표가 아니라");
    expect(productSelectorPrompt).toContain("현재 input");
    expect(productSelectorPrompt).toContain("현재 입력에 없는 퇴사");
  });

  it("gives WordPress a distinct editorial contract", () => {
    expect(wordpressLayoutPrompt).toContain("네이버 문장을 변환하거나 재사용하지 않는다");
    expect(wordpressLayoutPrompt).toContain("번호 이모지");
    expect(wordpressLayoutPrompt).toContain("<mark");
    expect(wordpressLayoutPrompt).toContain("해시태그를 본문에 넣지 않는다");
  });

  it("keeps section regeneration inside the same evidence and keyword rules", () => {
    expect(sectionRegeneratorPrompt).toContain("새 사실을 추가하지 않는다");
    expect(sectionRegeneratorPrompt).toContain("글 전체 키워드 예산");
    expect(sectionRegeneratorPrompt).toContain("수정된 body만");
  });

  it("keeps section regeneration in the same owner-voice contract", () => {
    expect(sectionRegeneratorPrompt).toContain("사장님 생활 말투");
    expect(sectionRegeneratorPrompt).toContain("같은 어미·문단 시작·문장 길이");
    expect(sectionRegeneratorPrompt).toContain("없는 실수, 작업 장면, 고객 반응, 감정은 만들지 않는다");
  });
});
