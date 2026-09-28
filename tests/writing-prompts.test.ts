import { describe, expect, it } from "vitest";
import { blogLayoutPrompt } from "@/lib/prompts/blog-layout";
import { productSelectorPrompt } from "@/lib/prompts/product-selector";
import { sectionRegeneratorPrompt } from "@/lib/prompts/section-regenerator";
import { wordpressLayoutPrompt } from "@/lib/prompts/wordpress-layout";

describe("writing prompt contracts", () => {
  it("keeps the Naver prompt reader-facing and evidence-bound", () => {
    expect(blogLayoutPrompt).toContain("첫 두 문장에서 독자에게 바로 답한다");
    expect(blogLayoutPrompt).toContain("근거 우선순위");
    expect(blogLayoutPrompt).toContain("사용자 입력");
    expect(blogLayoutPrompt).toContain("제품 DB");
    expect(blogLayoutPrompt).toContain("사진 관찰");
    expect(blogLayoutPrompt).toContain("추정하지 않는다");
  });

  it("avoids mechanical keyword and structure quotas", () => {
    expect(blogLayoutPrompt).toContain("정확한 횟수를 맞추려고 문장을 추가하지 않는다");
    expect(blogLayoutPrompt).toContain("sections는 정확히 5개");
    expect(blogLayoutPrompt).toContain("해시태그는 관련 있는 5~10개만");
    expect(blogLayoutPrompt).not.toContain("정확히 3회 사용한다");
  });

  it("uses platform-specific mixed title shapes instead of forcing every title into a question", () => {
    expect(blogLayoutPrompt).toContain("총 30개");
    expect(blogLayoutPrompt).toContain("정보형·경험 확인형·비교형");
    expect(blogLayoutPrompt).toContain("질문형은 5개 중 최대 1개");
    expect(blogLayoutPrompt).toContain("22~40자");
    expect(blogLayoutPrompt).toContain("제품명·키워드를 나열");
    expect(blogLayoutPrompt).not.toContain("모두 메인 키워드를 자연스럽게 포함한 부드러운 질문형");
    expect(wordpressLayoutPrompt).toContain("모든 제목에 물음표를 붙이지 않는다");
    expect(wordpressLayoutPrompt).toContain("26~48자");
  });

  it("does not repeat the already-completed product-selection matrix", () => {
    expect(blogLayoutPrompt).toContain("selected_products의 2개만");
    expect(blogLayoutPrompt).not.toContain("[퇴사 / 승진 / 육아휴직 / 복직]");
    expect(blogLayoutPrompt.length).toBeLessThan(6_500);
  });

  it("gives both long-form channels a grounded owner voice without invented scenes", () => {
    expect(blogLayoutPrompt).toContain("사장님 생활 말투");
    expect(blogLayoutPrompt).toContain("작업 장면을 꾸며내지 말고");
    expect(blogLayoutPrompt).toContain("생활형 판단");
    expect(wordpressLayoutPrompt).toContain("사장님 생활 말투");
    expect(wordpressLayoutPrompt).toContain("없는 실수, 작업 장면, 고객 반응, 감정은 만들지 않는다");
  });

  it("treats product mappings as hints and keeps the current topic authoritative", () => {
    expect(productSelectorPrompt).toContain("고정 선택표가 아니라");
    expect(productSelectorPrompt).toContain("현재 input");
    expect(productSelectorPrompt).toContain("현재 입력에 없는 퇴사");
  });

  it("gives WordPress a distinct editorial contract", () => {
    expect(wordpressLayoutPrompt).toContain("실제로 도움이 되는 이야기");
    expect(wordpressLayoutPrompt).toContain("번호 이모지");
    expect(wordpressLayoutPrompt).toContain("<mark");
    expect(wordpressLayoutPrompt).toContain("본문·FAQ에 네이버, 워드프레스, SEO");
    expect(wordpressLayoutPrompt).toContain("sections는 정확히 5개");
    expect(wordpressLayoutPrompt).toContain("첫 문단에서 그 질문에 구체적으로 답한다");
  });

  it("keeps section regeneration inside the same evidence and keyword rules", () => {
    expect(sectionRegeneratorPrompt).toContain("새 사실을 추가하지 않는다");
    expect(sectionRegeneratorPrompt).toContain("불필요하게 반복되지 않도록");
    expect(sectionRegeneratorPrompt).toContain("수정된 body만");
  });

  it("keeps section regeneration in the same owner-voice contract", () => {
    expect(sectionRegeneratorPrompt).toContain("사장님 생활 말투");
    expect(sectionRegeneratorPrompt).toContain("같은 어미·문단 시작·문장 길이");
    expect(sectionRegeneratorPrompt).toContain("없는 실수, 작업 장면, 고객 반응, 감정은 만들지 않는다");
  });
});
