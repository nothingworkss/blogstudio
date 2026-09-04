import type { BlogDraftInput, BlogDraftOutput, WordPressDraftOutput } from "@/types/blog";
import type { ImageObservation } from "@/types/image";
import type { Brand, ProductRecommendation } from "@/types/product";
import { naverGenerationOutputSchema, titleGenerationOutputSchema, wordpressGenerationOutputSchema } from "@/lib/validations/blog.schema";
import { brandStylePrompt } from "@/lib/prompts/brand-style";
import { blogLayoutPrompt } from "@/lib/prompts/blog-layout";
import { wordpressLayoutPrompt } from "@/lib/prompts/wordpress-layout";
import { referencePatternPayload } from "@/lib/reference/blog-patterns";
import { applyEditorialProductSections } from "@/lib/product/editorial";
import { formatMarkdownForWordPress, formatPlainTextForNaver, normalizeCheckBullets } from "@/lib/utils/copyFormat";
import { applySeoSectionHeadings } from "@/lib/utils/seoHeadings";
import { buildTitleGenerationPrompt, buildTitleTopic, normalizeTitlePackage, normalizeTitleResult, type TitleResult } from "@/lib/title-workflow";
import { fallbackGenerateBlog } from "./fallbacks";
import { runStructuredResponse } from "./openai";

export async function generateBlog(params: {
  input: BlogDraftInput;
  brand: Brand;
  selectedProducts: ProductRecommendation[];
  observations: ImageObservation[];
}) {
  const fallbackOutput = fallbackGenerateBlog(params);
  const titlePlanResponse = await runStructuredResponse({
    schema: titleGenerationOutputSchema,
    schemaName: "blog_title_generation_output",
    instructions: buildTitleGenerationPrompt(),
    input: {
      title_topic: buildTitleTopic(params.input, params.selectedProducts),
      input: params.input,
      selected_products: params.selectedProducts,
      image_observations: params.observations,
    },
  }).catch(() => null);
  const titlePlan = normalizeTitlePackage(titlePlanResponse, params.input, params.selectedProducts);
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
      title_plan: {
        title_candidates: titlePlan.naver.candidates,
        selected_title: titlePlan.naver.selectedTitle,
      },
    },
  }).catch(() => null);

  const generatedNaver = naverResult ?? fallbackOutput;
  const naverTitles = normalizeTitleResult({
    channel: "naver",
    candidates: titlePlan.naver.candidates,
    selectedTitle: titlePlan.naver.selectedTitle,
    input: params.input,
    selectedProducts: params.selectedProducts,
  });
  const naverBase: BlogDraftOutput = {
    ...generatedNaver,
    ...naverTitles,
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
      title_plan: {
        title_candidates: titlePlan.wordpress.candidates,
        selected_title: titlePlan.wordpress.selectedTitle,
      },
    },
  }).catch(() => null);
  const wordpress = normalizeGeneratedWordPress({
    wordpress: wordpressResult ?? fallbackOutput.wordpress,
    fallback: fallbackOutput.wordpress,
    naverOutput,
    input: params.input,
    titlePlan: titlePlan.wordpress,
  });

  return {
    ...naverOutput,
    wordpress,
    title_analysis: {
      naver: serializeTitleEvaluations(titlePlan.naver),
      wordpress: serializeTitleEvaluations(titlePlan.wordpress),
    },
  };
}

function serializeTitleEvaluations(result: TitleResult) {
  return result.evaluations.map((item) => ({
    title: item.title,
    type: item.type,
    search_intent_score: item.searchIntentScore,
    click_appeal_score: item.clickAppealScore,
    naturalness_score: item.naturalnessScore,
    keyword_fit_score: item.keywordFitScore,
    reason: item.reason,
  }));
}

function normalizeGeneratedWordPress({
  wordpress,
  fallback,
  naverOutput,
  input,
  titlePlan,
}: {
  wordpress: Omit<WordPressDraftOutput, "markdown_for_wordpress"> | WordPressDraftOutput;
  fallback: WordPressDraftOutput;
  naverOutput: BlogDraftOutput;
  input: BlogDraftInput;
  titlePlan: TitleResult;
}): WordPressDraftOutput {
  const titles = normalizeTitleResult({
    channel: "wordpress",
    candidates: titlePlan.candidates,
    selectedTitle: titlePlan.selectedTitle,
    input,
    selectedProducts: naverOutput.selected_products,
    avoidTitle: naverOutput.selected_title,
  });
  const normalized: WordPressDraftOutput = {
    ...wordpress,
    markdown_for_wordpress:
      "markdown_for_wordpress" in wordpress ? wordpress.markdown_for_wordpress : "",
    title_candidates: titles.title_candidates,
    selected_title: titles.selected_title,
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
