import type { BlogDraftOutput, WordPressDraftOutput } from "@/types/blog";

export function normalizeCheckBullets(text: string) {
  return text.replace(/(^|\n)[ \t]*[-*•]\s+/g, "$1✅ ");
}

export function formatPlainTextForNaver(output: Pick<BlogDraftOutput, "selected_title" | "sections" | "faq" | "hashtags">) {
  const sections = output.sections
    .map((section) => {
      const heading = section.heading ? `${section.heading}\n` : "";
      return `${heading}${normalizeCheckBullets(section.body)}`;
    })
    .join("\n\n");

  const faq = output.faq.map((item) => `Q. ${item.q}\nA. ${item.a}`).join("\n\n");
  const hashtags = output.hashtags.join(" ");

  return [
    output.selected_title,
    "",
    sections,
    "",
    "FAQ",
    faq,
    "",
    hashtags,
  ]
    .filter((part) => part !== undefined)
    .join("\n")
    .replace(/(^|\n)[ \t]*[-*•]\s+/g, "$1✅ ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function formatImageGuide(output: BlogDraftOutput) {
  return output.image_guide
    .map((item, index) => `${index + 1}. ${item.position} - ${item.image_type}\n${item.caption}`)
    .join("\n\n");
}

export function formatMarkdownForWordPress(output: WordPressDraftOutput) {
  const sections = output.sections
    .map((section) => `## ${section.heading}\n\n${normalizeCheckBullets(section.body.trim())}`)
    .join("\n\n");

  const faq = output.faq.length
    ? [
        "## 자주 묻는 질문",
        output.faq.map((item) => `### ${item.q}\n\n${item.a}`).join("\n\n"),
      ].join("\n\n")
    : "";

  return [
    `# ${output.selected_title}`,
    output.excerpt,
    sections,
    faq,
  ]
    .filter(Boolean)
    .join("\n\n")
    .replace(/(^|\n)[ \t]*[-*•]\s+/g, "$1✅ ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function formatWordPressImageGuide(output?: WordPressDraftOutput | null) {
  if (!output) return "";
  return output.image_guide
    .map((item, index) => `${index + 1}. ${item.position} - ${item.image_type}\nALT: ${item.alt_text}\n${item.caption}`)
    .join("\n\n");
}
