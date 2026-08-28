import { NextResponse, type NextRequest } from "next/server";
import { isAdminRequest, unauthorizedJson } from "@/lib/auth";
import { listDrafts, saveDraft } from "@/lib/data/store";
import { blogDraftRecordSchema } from "@/lib/validations/blog.schema";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedJson();
  return NextResponse.json({ drafts: await listDrafts() });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedJson();
  const body = await request.json();
  const parsed = blogDraftRecordSchema.omit({ id: true, created_at: true, updated_at: true }).parse(body);
  const draft = await saveDraft(parsed);
  return NextResponse.json({ draft });
}
