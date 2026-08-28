import { BlogStudioApp } from "@/components/blog/BlogStudioApp";
import { LoginScreen } from "@/components/layout/LoginScreen";
import type { StudioView } from "@/components/layout/Sidebar";
import { isAdminSession, adminPasswordConfigured } from "@/lib/auth";
import { getBrand, getDraft, listDrafts, listProducts } from "@/lib/data/store";
import { hasOpenAiEnv, hasSupabaseEnv } from "@/lib/env";

export async function StudioPage({
  view,
  draftId,
}: {
  view: StudioView;
  draftId?: string;
}) {
  const authenticated = await isAdminSession();
  if (!authenticated) return <LoginScreen />;

  const [brand, products, drafts] = await Promise.all([getBrand(), listProducts(), listDrafts()]);
  const requestedDraft = draftId ? await getDraft(draftId) : null;
  const orderedDrafts = requestedDraft
    ? [requestedDraft, ...drafts.filter((draft) => draft.id !== requestedDraft.id)]
    : drafts;

  return (
    <BlogStudioApp
      initialView={view}
      initialProducts={products}
      initialDrafts={orderedDrafts}
      brand={brand}
      isDemoMode={!hasSupabaseEnv() || !hasOpenAiEnv() || !adminPasswordConfigured()}
    />
  );
}
