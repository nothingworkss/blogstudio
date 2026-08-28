export function compactText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function splitByComma(value: string) {
  return value
    .split(/[,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

export function normalizeForMatch(value: string) {
  return value.toLowerCase().replace(/\s+/g, "").trim();
}

export function includesLoose(haystack: string, needle: string) {
  const left = normalizeForMatch(haystack);
  const right = normalizeForMatch(needle);
  return Boolean(right) && (left.includes(right) || right.includes(left));
}

export function toHashtag(value: string) {
  return `#${value.replace(/^#/, "").replace(/\s+/g, "")}`;
}

export function truncate(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 1))}…`;
}
