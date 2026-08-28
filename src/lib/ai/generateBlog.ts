import type { BlogDraftInput, BlogDraftOutput, WordPressDraftOutput } from "@/types/blog";
import type { ImageObservation } from "@/types/image";
import type { Brand, ProductRecommendation } from "@/types/product";
import { naverGenerationOutputSchema, wordpressGenerationOutputSchema } from "@/lib/validations/blog.schema";
import { brandStylePrompt } from "@/lib/prompts/brand-style";
import { blogLayoutPrompt } from "@/lib/prompts/blog-layout";
import { wordpressLayoutPrompt } from "@/lib/prompts/wordpress-layout";
import { referencePatternPayload } from "@/lib/reference/blog-patterns";
import { applyEditorialProductSections } from "@/lib/product/editorial";
import { formatMarkdownForWordPress, formatPlainTextForNaver, normalizeCheckBullets } from "@/lib/utils/copyFormat";
import { applySeoSectionHeadings } from "@/lib/utils/seoHeadings";
import { fallbackGenerateBlog } from "./fallbacks";
import { runStructuredResponse } from "./openai";

export async function generateBlog(params: {
  input: BlogDraftInput;
  brand: Brand;
  selectedProducts: ProductRecommendation[];
  observations: ImageObservation[];
}) {
  const fallbackOutput = fallbackGenerateBlog(params);
  const naverResult = await runStructuredResponse({
    schema: naverGenerationOutputSchema,
    schemaName: "naver_blog_draft_output",
    instructions: [
      blogLayoutPrompt,
      brandStylePrompt(params.brand),
    ].join("\n\n"),
    input: {
      input: params.input,
      selected_products: params.selectedProducts,
      image_observations: params.observations,
      reference_pattern: referencePatternPayload(params.input.reference_style),
    },
  }).catch(() => null);

  const naverBase: BlogDraftOutput = {
    ...(naverResult ?? fallbackOutput),
    selected_products: params.selectedProducts,
    plain_text_for_naver: fallbackOutput.plain_text_for_naver,
    wordpress: fallbackOutput.wordpress,
  };
  const editorialOutput = applyEditorialProductSections(naverBase, params.input);
  const seoOutput = applySeoSectionHeadings(editorialOutput, params.input);
  const naverOutput = {
    ...seoOutput,
    plain_text_for_naver: formatPlainTextForNaver(seoOutput),
  };
  const wordpressResult = await runStructuredResponse({
    schema: wordpressGenerationOutputSchema,
    schemaName: "wordpress_draft_output",
    instructions: [
      wordpressLayoutPrompt,
      brandStylePrompt(params.brand),
    ].join("\n\n"),
    input: {
      input: params.input,
      selected_products: naverOutput.selected_products,
      image_observations: params.observations,
      reference_pattern: referencePatternPayload(params.input.reference_style),
      naver_reference: {
        selected_title: naverOutput.selected_title,
        section_roles: naverOutput.sections.map((section) => section.type),
      },
    },
  }).catch(() => null);
  const wordpress = normalizeGeneratedWordPress({
    wordpress: wordpressResult ?? fallbackOutput.wordpress,
    fallback: fallbackOutput.wordpress,
    naverOutput,
  });

  return {
    ...naverOutput,
    wordpress,
  };
}

function normalizeGeneratedWordPress({
  wordpress,
  fallback,
  naverOutput,
}: {
  wordpress: Omit<WordPressDraftOutput, "markdown_for_wordpress"> | WordPressDraftOutput;
  fallback: WordPressDraftOutput;
  naverOutput: BlogDraftOutput;
}): WordPressDraftOutput {
  const titleCandidates = normalizeQuestionTitles(wordpress.title_candidates, fallback.title_candidates, naverOutput);
  const selectedTitle =
    titleCandidates.find((title) => title !== naverOutput.selected_title) ?? titleCandidates[0] ?? wordpress.selected_title;
  const normalized: WordPressDraftOutput = {
    ...wordpress,
    markdown_for_wordpress:
      "markdown_for_wordpress" in wordpress ? wordpress.markdown_for_wordpress : "",
    title_candidates: titleCandidates,
    selected_title: ensureQuestionTitle(selectedTitle),
    sections: naverOutput.sections.map((section, index) => ({
      id: wordpress.sections[index]?.id ?? fallback.sections[index]?.id ?? `wp-section-${index + 1}`,
      heading: ensureWordPressHeading(
        wordpress.sections[index]?.heading || fallback.sections[index]?.heading || section.heading || "선택 기준",
        index,
      ),
      body: normalizeCheckBullets(wordpress.sections[index]?.body || fallback.sections[index]?.body || ""),
    })),
  };

  return {
    ...normalized,
    markdown_for_wordpress: formatMarkdownForWordPress(normalized),
  };
}

function ensureWordPressHeading(heading: string, index: number) {
  const prefixes = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣"];
  const prefix = prefixes[index] ?? `${index + 1}.`;
  const cleanHeading = heading.replace(/^[1-7](?:️⃣|\.)\s*/, "").trim();
  return `${prefix} ${cleanHeading}`;
}

function normalizeQuestionTitles(titles: string[], fallbackTitles: string[], naverOutput: BlogDraftOutput) {
  const keyword = naverOutput.selected_title.split(/[,\s]/)[0] || "";
  const source = [...titles, ...fallbackTitles].filter(Boolean);
  const normalized = source
    .map(ensureQuestionTitle)
    .map((title) => (keyword && !title.includes(keyword) ? `${keyword}, ${title}` : title))
    .filter((title, index, list) => list.indexOf(title) === index)
    .slice(0, 5);

  return normalized.length === 5 ? normalized : [...normalized, ...fallbackTitles.map(ensureQuestionTitle)].slice(0, 5);
}

function ensureQuestionTitle(title: string) {
  const trimmed = title.trim().replace(/[.!。]+$/g, "");
  return trimmed.endsWith("?") ? trimmed : `${trimmed}?`;
}
