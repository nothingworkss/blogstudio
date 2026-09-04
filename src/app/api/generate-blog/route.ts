import { NextResponse, type NextRequest } from "next/server";
import { isAdminRequest, unauthorizedJson } from "@/lib/auth";
import { generateBlog } from "@/lib/ai/generateBlog";
import { selectRecommendedProducts } from "@/lib/ai/productSelection";
import { getBrand, listProducts, logGeneration, saveDraft } from "@/lib/data/store";
import { hydrateRecommendations } from "@/lib/product/editorial";
import { referencePatternPayload } from "@/lib/reference/blog-patterns";
import { blogDraftInputSchema } from "@/lib/validations/blog.schema";
import { imageObservationSchema } from "@/lib/validations/image.schema";
import { WRITING_PROMPT_VERSION } from "@/lib/prompts/writing-standards";

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedJson();

  const body = await request.json();
  const input = blogDraftInputSchema.parse(body.input ?? body);
  const observations = imageObservationSchema.array().parse(body.observations ?? []);
  const products = await listProducts();
  const brand = await getBrand();
  const selectedProductsSource =
    body.selected_products?.length === 2
      ? body.selected_products
      : await selectRecommendedProducts({ input, products, observations });
  const selectedProducts = hydrateRecommendations({
    recommendations: selectedProductsSource,
    products,
    input,
  });

  const output = await generateBlog({
    input,
    brand,
    selectedProducts,
    observations,
  });

  const draft = await saveDraft({
    brand_id: brand.id,
    title: output.selected_title,
    main_keyword: input.main_keyword,
    sub_keywords: input.sub_keywords,
    target_reader: input.target_reader,
    topic: input.topic,
    situation: input.situation,
    raw_memo: input.raw_memo,
    post_type: input.post_type,
    status: "draft",
    selected_products: output.selected_products,
    content_json: output,
    image_observations: observations,
    naver_plain_text: output.plain_text_for_naver,
    wordpress_title: output.wordpress.selected_title,
    wordpress_markdown: output.wordpress.markdown_for_wordpress,
  });

  await logGeneration({
    draft_id: draft.id,
    step: "generate-blog",
    input_json: {
      input,
      observations,
      selectedProducts,
      reference_pattern: referencePatternPayload(input.reference_style),
      prompt_version: WRITING_PROMPT_VERSION,
    },
    output_json: output,
  });

  return NextResponse.json({ draft, output });
}
