import { NextResponse, type NextRequest } from "next/server";
import { isAdminRequest, unauthorizedJson } from "@/lib/auth";
import { checkDraftLocally } from "@/lib/ai/checkDraft";
import { getBrand, getDraft, logGeneration } from "@/lib/data/store";
import { blogDraftOutputSchema } from "@/lib/validations/blog.schema";

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedJson();

  const body = await request.json();
  const brand = await getBrand();
  const output = body.draft_id
    ? (await getDraft(body.draft_id))?.content_json
    : blogDraftOutputSchema.parse(body.blog_body ?? body.output ?? body);

  if (!output) return NextResponse.json({ error: "검수할 초안이 없습니다." }, { status: 400 });

  const check = checkDraftLocally(output, brand.forbidden_words);
  await logGeneration({
    draft_id: body.draft_id ?? null,
    step: "check-draft",
    input_json: { draft_id: body.draft_id ?? null },
    output_json: check,
  });

  return NextResponse.json({ check });
}
