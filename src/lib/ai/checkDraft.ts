import type { BlogDraftOutput } from "@/types/blog";
import { fallbackCheckDraft } from "./fallbacks";

export function checkDraftLocally(output: BlogDraftOutput, forbiddenWords: string[]) {
  return fallbackCheckDraft(output, forbiddenWords);
}
