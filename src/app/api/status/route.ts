import { NextResponse } from "next/server";
import { getMissingProductionEnv, hasNaverEnv, hasOpenAiEnv, hasSupabaseEnv } from "@/lib/env";
import { adminPasswordConfigured } from "@/lib/auth";

export async function GET() {
  return NextResponse.json({
    supabase: hasSupabaseEnv(),
    openai: hasOpenAiEnv(),
    naver: hasNaverEnv(),
    admin_password: adminPasswordConfigured(),
    missing_required_env: getMissingProductionEnv(),
  });
}
