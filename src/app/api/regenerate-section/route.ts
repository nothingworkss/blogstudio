import { NextResponse, type NextRequest } from "next/server";
import { isAdminRequest, unauthorizedJson } from "@/lib/auth";
import { getDraft, logGeneration, saveDraft } from "@/lib/data/store";
import { regenerateSection } from "@/lib/ai/regenerateSection";
import { formatPlainTextForNaver } from "@/lib/utils/copyFormat";

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedJson();

  const body = (await request.json()) as {
    draft_id?: string;
    section_name?: string;
    instruction?: string;
  };
  if (!body.draft_id || !body.section_name) {
    return NextResponse.json({ error: "draft_id와 section_name이 필요합니다." }, { status: 400 });
  }

  const draft = await getDraft(body.draft_id);
  if (!draft) return NextResponse.json({ error: "초안을 찾을 수 없습니다." }, { status: 404 });

  const updatedSection = await regenerateSection({
    draft: draft.content_json,
    section_name: body.section_name,
    instruction: body.instruction ?? "더 자연스럽게",
  });

  const content_json = {
    ...draft.content_json,
    sections: draft.content_json.sections.map((section) =>
      section.id === body.section_name || section.type === body.section_name
        ? { ...section, body: updatedSection }
        : section,
    ),
  };
  content_json.plain_text_for_naver = formatPlainTextForNaver(content_json);

  const saved = await saveDraft({
    ...draft,
    content_json,
    naver_plain_text: content_json.plain_text_for_naver,
  });

  await logGeneration({
    draft_id: draft.id,
    step: "regenerate-section",
    input_json: body,
    output_json: { updated_section: updatedSection },
  });

  return NextResponse.json({ draft: saved, updated_section: updatedSection });
}
