import { describe, expect, it } from "vitest";
import { blogLayoutPrompt } from "@/lib/prompts/blog-layout";
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
  });

  it("does not repeat the already-completed product-selection matrix", () => {
    expect(blogLayoutPrompt).toContain("selected_products의 2개만");
    expect(blogLayoutPrompt).not.toContain("[퇴사 / 승진 / 육아휴직 / 복직]");
    expect(blogLayoutPrompt.length).toBeLessThan(6_500);
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
});
