import { normalizeForMatch } from "./strings";

export function countKeyword(text: string, keyword: string) {
  const normalizedText = normalizeForMatch(text);
  const normalizedKeyword = normalizeForMatch(keyword);
  if (!normalizedKeyword) return 0;

  let count = 0;
  let index = normalizedText.indexOf(normalizedKeyword);
  while (index !== -1) {
    count += 1;
    index = normalizedText.indexOf(normalizedKeyword, index + normalizedKeyword.length);
  }

  return count;
}

export function countKeywords(text: string, keywords: string[]) {
  return keywords.map((keyword) => ({
    keyword,
    count: countKeyword(text, keyword),
  }));
}
