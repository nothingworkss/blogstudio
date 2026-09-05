import { NextResponse, type NextRequest } from "next/server";
import { isAdminRequest, unauthorizedJson } from "@/lib/auth";
import { logGeneration } from "@/lib/data/store";
import { observeImages } from "@/lib/ai/observeImages";

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedJson();

  const body = (await request.json()) as { image_urls?: string[]; draft_id?: string };
  const imageUrls = body.image_urls ?? [];
  const { observations, usedVision } = await observeImages(imageUrls);
  await logGeneration({
    draft_id: body.draft_id ?? null,
    step: "observe-images",
    input_json: { image_urls: imageUrls },
    output_json: { observations, usedVision },
  });

  return NextResponse.json({ observations, image_analysis_available: usedVision });
}
