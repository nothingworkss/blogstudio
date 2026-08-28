import { NextResponse, type NextRequest } from "next/server";
import { isAdminRequest, unauthorizedJson } from "@/lib/auth";
import { listProducts, logGeneration } from "@/lib/data/store";
import { selectRecommendedProducts } from "@/lib/ai/productSelection";
import { blogDraftInputSchema } from "@/lib/validations/blog.schema";
import { imageObservationSchema } from "@/lib/validations/image.schema";

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedJson();

  const body = await request.json();
  const input = blogDraftInputSchema.parse(body.input ?? body);
  const observations = imageObservationSchema.array().parse(body.observations ?? []);
  const products = await listProducts();
  const selected_products = await selectRecommendedProducts({ input, products, observations });

  await logGeneration({
    draft_id: body.draft_id ?? null,
    step: "select-products",
    input_json: { input, observations },
    output_json: { selected_products },
  });

  return NextResponse.json({ selected_products });
}
