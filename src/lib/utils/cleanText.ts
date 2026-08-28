export function cleanGeneratedText(value: string) {
  return value
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function softenSalesTone(value: string) {
  return value
    .replaceAll("꼭 추천드려요", "잘 어울릴 수 있어요")
    .replaceAll("완벽한", "잘 맞는")
    .replaceAll("최고의", "좋은")
    .replaceAll("무조건", "상황에 따라");
}
