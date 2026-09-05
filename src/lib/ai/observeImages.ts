import { z } from "zod";
import { imageObservationSchema } from "@/lib/validations/image.schema";
import { imageObserverPrompt } from "@/lib/prompts/image-observer";
import { runVisionStructuredResponse } from "./openai";

const observeImagesSchema = z.object({
  observations: z.array(imageObservationSchema),
});

export async function observeImages(imageUrls: string[]) {
  if (imageUrls.length === 0) return { observations: [], usedVision: false };

  const aiResult = await runVisionStructuredResponse({
    schema: observeImagesSchema,
    schemaName: "image_observations",
    instructions: imageObserverPrompt,
    text: "각 이미지별 관찰 결과를 구조화해 주세요.",
    imageUrls,
  }).catch(() => null);

  return {
    observations: aiResult?.observations ?? [],
    usedVision: Boolean(aiResult),
  };
}
