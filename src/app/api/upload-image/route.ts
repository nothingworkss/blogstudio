import { NextResponse, type NextRequest } from "next/server";
import { isAdminRequest, unauthorizedJson } from "@/lib/auth";
import { uploadBlogImage } from "@/lib/supabase/storage";

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedJson();

  const formData = await request.formData();
  const file = formData.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "image file이 필요합니다." }, { status: 400 });
  }

  const result = await uploadBlogImage(file);
  return NextResponse.json(result);
}
