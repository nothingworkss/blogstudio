import { NextResponse, type NextRequest } from "next/server";
import { isAdminRequest, unauthorizedJson } from "@/lib/auth";
import { getDraft, saveDraft } from "@/lib/data/store";
import { blogDraftRecordSchema } from "@/lib/validations/blog.schema";

type DraftRouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: DraftRouteContext) {
  if (!isAdminRequest(request)) return unauthorizedJson();
  const { id } = await context.params;
  const draft = await getDraft(id);
  if (!draft) return NextResponse.json({ error: "초안을 찾을 수 없습니다." }, { status: 404 });
  return NextResponse.json({ draft });
}

export async function PATCH(request: NextRequest, context: DraftRouteContext) {
  if (!isAdminRequest(request)) return unauthorizedJson();
  const { id } = await context.params;
  const existing = await getDraft(id);
  if (!existing) return NextResponse.json({ error: "초안을 찾을 수 없습니다." }, { status: 404 });

  const body = await request.json();
  const parsed = blogDraftRecordSchema.partial().parse(body);
  const draft = await saveDraft({
    ...existing,
    ...parsed,
    id,
    created_at: existing.created_at,
    updated_at: existing.updated_at,
  });

  return NextResponse.json({ draft });
}
