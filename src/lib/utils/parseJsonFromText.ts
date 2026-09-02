type JsonRecord = Record<string, unknown>;

export function parseJsonFromText(value: string): JsonRecord {
  const jsonText = extractJsonObject(value);
  const repairedJsonText = repairGptJson(jsonText);
  const attempts = repairedJsonText === jsonText ? [jsonText] : [jsonText, repairedJsonText];
  let parseError: unknown;

  for (const attempt of attempts) {
    try {
      const parsed = JSON.parse(attempt) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("최상위 JSON 값이 객체가 아닙니다.");
      }
      return parsed as JsonRecord;
    } catch (error) {
      parseError = error;
    }
  }

  const message = parseError instanceof Error ? parseError.message : "JSON 형식 오류";
  throw new Error(
    `JSON을 읽을 수 없습니다. GPT 출력의 본문 큰따옴표, 줄바꿈 또는 쉼표 형식을 확인해 주세요. (${message})`,
  );
}

function extractJsonObject(value: string) {
  const withoutFence = value
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("JSON 객체를 찾을 수 없습니다.");
  }

  return withoutFence.slice(start, end + 1);
}

function repairGptJson(jsonText: string) {
  return removeTrailingCommas(repairJsonStringContent(jsonText));
}

function repairJsonStringContent(jsonText: string) {
  let repaired = "";
  let inString = false;
  let stringRole: "key" | "value" = "value";
  const containerStack: Array<"{" | "["> = [];

  for (let index = 0; index < jsonText.length; index += 1) {
    const char = jsonText[index];

    if (!inString) {
      if (char === "{") containerStack.push("{");
      if (char === "[") containerStack.push("[");
      if (char === "}" || char === "]") containerStack.pop();

      if (char === '"') {
        const container = containerStack.at(-1);
        const previous = previousNonWhitespace(jsonText, index - 1);
        stringRole = container === "{" && (previous === "{" || previous === ",") ? "key" : "value";
        inString = true;
      }

      repaired += char;
      continue;
    }

    if (char === "\\") {
      const next = jsonText[index + 1];
      if (isValidJsonEscape(jsonText, index)) {
        repaired += char + next;
        index += 1;
      } else {
        repaired += "\\\\";
      }
      continue;
    }

    if (char === "\r" || char === "\n" || char === "\t") {
      if (char === "\r" && jsonText[index + 1] === "\n") index += 1;
      repaired += char === "\t" ? "\\t" : "\\n";
      continue;
    }

    if (char === '"') {
      const container = containerStack.at(-1);
      if (isLikelyStringEnd(jsonText, index, stringRole, container)) {
        inString = false;
        repaired += char;
      } else {
        repaired += '\\"';
      }
      continue;
    }

    repaired += char;
  }

  return repaired;
}

function isValidJsonEscape(value: string, slashIndex: number) {
  const next = value[slashIndex + 1];
  if (!next) return false;
  if ('"\\/bfnrt'.includes(next)) return true;
  return next === "u" && /^[0-9a-fA-F]{4}$/.test(value.slice(slashIndex + 2, slashIndex + 6));
}

function isLikelyStringEnd(
  value: string,
  quoteIndex: number,
  role: "key" | "value",
  container: "{" | "[" | undefined,
) {
  const nextIndex = nextNonWhitespaceIndex(value, quoteIndex + 1);
  if (nextIndex === -1) return true;
  const next = value[nextIndex];

  if (role === "key") return next === ":";
  if (container === "{" && next === "}") return true;
  if (container === "[" && next === "]") return true;
  if (next !== ",") return false;

  const afterCommaIndex = nextNonWhitespaceIndex(value, nextIndex + 1);
  if (afterCommaIndex === -1) return true;
  const afterComma = value[afterCommaIndex];

  if (container === "{") {
    return afterComma === "}" || looksLikeObjectKey(value, afterCommaIndex);
  }

  return container === "[" && '"{[]0123456789tfn-'.includes(afterComma);
}

function looksLikeObjectKey(value: string, startIndex: number) {
  if (value[startIndex] !== '"') return false;

  for (let index = startIndex + 1; index < value.length; index += 1) {
    if (value[index] === "\\") {
      index += 1;
      continue;
    }
    if (value[index] !== '"') continue;

    const nextIndex = nextNonWhitespaceIndex(value, index + 1);
    return nextIndex !== -1 && value[nextIndex] === ":";
  }

  return false;
}

function removeTrailingCommas(value: string) {
  let repaired = "";
  let inString = false;
  let escaped = false;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];

    if (inString) {
      repaired += char;
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      repaired += char;
      continue;
    }

    if (char === ",") {
      const nextIndex = nextNonWhitespaceIndex(value, index + 1);
      if (nextIndex !== -1 && (value[nextIndex] === "}" || value[nextIndex] === "]")) continue;
    }

    repaired += char;
  }

  return repaired;
}

function previousNonWhitespace(value: string, startIndex: number) {
  for (let index = startIndex; index >= 0; index -= 1) {
    if (!/\s/.test(value[index])) return value[index];
  }
  return "";
}

function nextNonWhitespaceIndex(value: string, startIndex: number) {
  for (let index = startIndex; index < value.length; index += 1) {
    if (!/\s/.test(value[index])) return index;
  }
  return -1;
}
