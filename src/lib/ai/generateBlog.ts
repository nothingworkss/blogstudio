import type { BlogDraftInput, BlogDraftOutput, WordPressDraftOutput } from "@/types/blog";
import type { ImageObservation } from "@/types/image";
import type { Brand, Product, ProductRecommendation } from "@/types/product";
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
  products?: Product[];
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
      product_facts: params.products?.filter((product) =>
        params.selectedProducts.some((selected) => selected.product_name === product.name),
      ).map((product) => ({
        name: product.name,
        short_description: product.short_description,
        long_description: product.long_description,
        fit_situations: product.fit_situations,
        strengths: product.strengths,
        cautions: product.cautions,
        default_faq: product.default_faq,
      })) ?? [],
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
      product_facts: params.products?.filter((product) =>
        naverOutput.selected_products.some((selected) => selected.product_name === product.name),
      ).map((product) => ({
        name: product.name,
        short_description: product.short_description,
        long_description: product.long_description,
        strengths: product.strengths,
        cautions: product.cautions,
        default_faq: product.default_faq,
      })) ?? [],
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
    naver_source: naverResult ? "generated" as const : "template" as const,
    wordpress: { ...wordpress, source: wordpressResult ? "generated" as const : "template" as const },
    title_analysis: {
      naver: serializeTitleEvaluations(titlePlan.naver),
      wordpress: serializeTitleEvaluations(titlePlan.wordpress),
      candidate_groups: {
        naver: titlePlan.naver.candidateGroups,
        wordpress: titlePlan.wordpress.candidateGroups,
      },
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
    sections: fallback.sections.map((section, index) => ({
      id: wordpress.sections[index]?.id ?? section.id,
      heading: ensureWordPressHeading(
        wordpress.sections[index]?.heading || section.heading,
      ),
      body: normalizeCheckBullets(wordpress.sections[index]?.body || section.body),
    })),
  };

  return {
    ...normalized,
    markdown_for_wordpress: formatMarkdownForWordPress(normalized),
  };
}

function ensureWordPressHeading(heading: string) {
  return heading.replace(/^\s*(?:#{1,6}\s*)?(?:[1-7](?:️⃣|\.)\s*)?/, "").trim();
}
