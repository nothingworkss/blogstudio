import { z } from "zod";
import type { BlogDraftOutput } from "@/types/blog";
import { sectionRegeneratorPrompt } from "@/lib/prompts/section-regenerator";
import { referencePatternPrompt } from "@/lib/reference/blog-patterns";
import { runStructuredResponse } from "./openai";

const regenerateSectionSchema = z.object({
  updated_section: z.string(),
});

export async function regenerateSection(params: {
  draft: BlogDraftOutput;
  section_name: string;
  instruction: string;
}) {
  const section = params.draft.sections.find(
    (item) => item.id === params.section_name || item.type === params.section_name,
  );

  const aiResult = await runStructuredResponse({
    schema: regenerateSectionSchema,
    schemaName: "regenerated_section",
    instructions: [sectionRegeneratorPrompt, referencePatternPrompt()].join("\n\n"),
    input: {
      section_name: params.section_name,
      instruction: params.instruction,
      current_section: section,
      draft_context: {
        title: params.draft.selected_title,
        selected_products: params.draft.selected_products,
        search_intent: params.draft.search_intent,
      },
    },
  }).catch(() => null);

  if (aiResult?.updated_section) return aiResult.updated_section;

  const currentBody = section?.body ?? "";
  if (params.instruction.includes("짧게")) {
    return currentBody.split("\n").slice(0, 2).join("\n");
  }
  if (params.instruction.includes("자연")) {
    return currentBody.replaceAll("추천드립니다", "잘 어울릴 수 있어요").replaceAll("구매", "준비");
  }
  if (params.instruction.includes("광고") || params.instruction.includes("판매")) {
    return currentBody.replaceAll("주문", "준비").replace(/상담 가능(?:합니다|해요)/g, "필요한 기준부터 같이 볼게요");
  }
  return `${currentBody}\n\n${params.instruction} 톤을 반영해 조금 더 담백하게 다듬어 주세요.`;
}
