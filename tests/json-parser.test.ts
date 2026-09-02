import { describe, expect, it } from "vitest";
import { parseJsonFromText } from "@/lib/utils/parseJsonFromText";

describe("GPT JSON parser", () => {
  it("extracts a valid JSON object from a fenced GPT response", () => {
    expect(parseJsonFromText('```json\n{"categories":["브랜드 블로그"]}\n```')).toEqual({
      categories: ["브랜드 블로그"],
    });
  });

  it("repairs unescaped Korean quotes inside a JSON string", () => {
    const pasted = '{"body":"오늘은 "브루키"를 기준으로 골랐어요.","heading":"제품 선택"}';

    expect(parseJsonFromText(pasted)).toEqual({
      body: '오늘은 "브루키"를 기준으로 골랐어요.',
      heading: "제품 선택",
    });
  });

  it("repairs raw line breaks, loose backslashes, and trailing commas", () => {
    const pasted = String.raw`{
      "body": "첫 문단
두 번째 문단과 C:\브랜드 자료",
      "tags": ["답례품", "브라우니",],
    }`;

    expect(parseJsonFromText(pasted)).toEqual({
      body: "첫 문단\n두 번째 문단과 C:\\브랜드 자료",
      tags: ["답례품", "브라우니"],
    });
  });

  it("still rejects text without a complete JSON object", () => {
    expect(() => parseJsonFromText("브랜드 블로그 본문만 있습니다.")).toThrow(
      "JSON 객체를 찾을 수 없습니다.",
    );
  });
});
