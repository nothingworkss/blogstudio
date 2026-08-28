export function getEnv(name: string) {
  return process.env[name]?.trim() || "";
}

export function hasSupabaseEnv() {
  return Boolean(getEnv("NEXT_PUBLIC_SUPABASE_URL") && getEnv("SUPABASE_SERVICE_ROLE_KEY"));
}

export function hasOpenAiEnv() {
  return Boolean(getEnv("OPENAI_API_KEY"));
}

export function hasNaverEnv() {
  return Boolean(getEnv("NAVER_CLIENT_ID") && getEnv("NAVER_CLIENT_SECRET"));
}

export function getMissingProductionEnv() {
  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "OPENAI_API_KEY",
    "ADMIN_PASSWORD",
  ];

  return required.filter((name) => !getEnv(name));
}

export function appBaseUrl() {
  return getEnv("NEXT_PUBLIC_APP_URL") || "http://localhost:3000";
}
