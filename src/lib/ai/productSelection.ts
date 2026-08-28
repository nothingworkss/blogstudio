import { z } from "zod";
import type { BlogDraftInput } from "@/types/blog";
import type { ImageObservation } from "@/types/image";
import type { Product, ProductRecommendation } from "@/types/product";
import { productSelectorPrompt } from "@/lib/prompts/product-selector";
import { hydrateRecommendations } from "@/lib/product/editorial";
import { fallbackSelectProducts } from "./fallbacks";
import { runStructuredResponse } from "./openai";
import { selectProductsByScore } from "./selectProducts";

const productSelectionSchema = z.object({
  selected_products: z
    .array(
      z.object({
        product_name: z.string(),
        reason: z.string(),
        angle: z.string(),
        main_points: z.array(z.string()),
        caution: z.string(),
        score: z.number().optional(),
      }),
    )
    .length(2),
  excluded_reason_summary: z.string(),
});

export async function selectRecommendedProducts(params: {
  input: BlogDraftInput;
  products: Product[];
  observations?: ImageObservation[];
}) {
  const scored = selectProductsByScore({
    input: params.input,
    products: params.products,
    observations: params.observations,
  });
  const candidates = scored.slice(0, 4).map(({ product, score, reasons }) => ({
    product,
    score,
    score_reasons: reasons,
  }));

  const aiResult = await runStructuredResponse({
    schema: productSelectionSchema,
    schemaName: "product_selection",
    instructions: productSelectorPrompt,
    input: {
      blog_input: params.input,
      product_candidates: candidates,
      image_observations: params.observations ?? [],
    },
  }).catch(() => null);

  const selectedProducts = (aiResult?.selected_products ?? fallbackSelectProducts(params.input, params.products, params.observations)) as ProductRecommendation[];
  return hydrateRecommendations({
    recommendations: selectedProducts,
    products: params.products,
    input: params.input,
  });
}
