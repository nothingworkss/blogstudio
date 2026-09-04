import { randomUUID } from "crypto";
import type { BlogDraftRecord } from "@/types/blog";
import type { Brand, Product } from "@/types/product";
import { seedBrand, seedDrafts, seedProducts } from "./seed";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const memory = {
  brand: seedBrand,
  products: [...seedProducts],
  drafts: [...seedDrafts],
};

export async function getBrand(): Promise<Brand> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return memory.brand;

  const { data, error } = await supabase.from("brands").select("*").limit(1).maybeSingle();
  if (error || !data) return memory.brand;
  return data as Brand;
}

export async function updateBrand(brand: Partial<Brand>) {
  const supabase = getSupabaseAdmin();
  const next = { ...memory.brand, ...brand };
  memory.brand = next;

  if (supabase) {
    await supabase.from("brands").upsert(next);
  }

  return next;
}

export async function listProducts(): Promise<Product[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return memory.products;

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: true });

  if (error || !data) return memory.products;
  return data as Product[];
}

export async function upsertProduct(product: Partial<Product> & Pick<Product, "name" | "category">) {
  const next: Product = {
    id: product.id || randomUUID(),
    brand_id: product.brand_id ?? seedBrand.id,
    name: product.name,
    category: product.category,
    short_description: product.short_description ?? "",
    long_description: product.long_description ?? "",
    fit_situations: product.fit_situations ?? [],
    keywords: product.keywords ?? [],
    strengths: product.strengths ?? [],
    cautions: product.cautions ?? [],
    editorial_profile: product.editorial_profile ?? null,
    default_intro: product.default_intro ?? "",
    default_faq: product.default_faq ?? [],
    image_url: product.image_url ?? null,
    is_active: product.is_active ?? true,
  };

  memory.products = [...memory.products.filter((item) => item.id !== next.id), next];

  const supabase = getSupabaseAdmin();
  if (supabase) {
    await supabase.from("products").upsert(next);
  }

  return next;
}

export async function listDrafts(): Promise<BlogDraftRecord[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return memory.drafts.sort(byUpdatedAt);

  const { data, error } = await supabase
    .from("blog_drafts")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error || !data) return memory.drafts.sort(byUpdatedAt);

  return data.map((draft) => ({
    ...(draft as BlogDraftRecord),
    target_reader: draft.target_reader ?? "",
    content_json: draft.content_json,
    selected_products: draft.selected_products ?? [],
    image_observations: [],
  }));
}

export async function getDraft(id: string): Promise<BlogDraftRecord | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return memory.drafts.find((draft) => draft.id === id) ?? null;

  const { data, error } = await supabase.from("blog_drafts").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;

  const { data: images } = await supabase
    .from("blog_images")
    .select("observation")
    .eq("draft_id", id)
    .order("sort_order", { ascending: true });

  return {
    ...(data as BlogDraftRecord),
    target_reader: data.target_reader ?? "",
    selected_products: data.selected_products ?? [],
    content_json: data.content_json,
    image_observations: images?.map((item) => item.observation).filter(Boolean) ?? [],
  };
}

export async function saveDraft(
  draft: Omit<BlogDraftRecord, "id" | "created_at" | "updated_at"> & {
    id?: string;
    created_at?: string;
    updated_at?: string;
  },
) {
  const now = new Date().toISOString();
  const next: BlogDraftRecord = {
    ...draft,
    id: draft.id || randomUUID(),
    created_at: draft.created_at ?? (draft.id ? (memory.drafts.find((item) => item.id === draft.id)?.created_at ?? now) : now),
    updated_at: now,
  };

  memory.drafts = [next, ...memory.drafts.filter((item) => item.id !== next.id)];

  const supabase = getSupabaseAdmin();
  if (supabase) {
    await supabase.from("blog_drafts").upsert({
      id: next.id,
      brand_id: next.brand_id,
      title: next.title,
      main_keyword: next.main_keyword,
      sub_keywords: next.sub_keywords,
      target_reader: next.target_reader,
      topic: next.topic,
      situation: next.situation,
      raw_memo: next.raw_memo,
      post_type: next.post_type,
      status: next.status,
      selected_products: next.selected_products,
      content_json: next.content_json,
      naver_plain_text: next.naver_plain_text,
      wordpress_title: next.wordpress_title ?? next.content_json.wordpress?.selected_title ?? null,
      wordpress_markdown: next.wordpress_markdown ?? next.content_json.wordpress?.markdown_for_wordpress ?? null,
      created_at: next.created_at,
      updated_at: next.updated_at,
    });
  }

  return next;
}

export async function logGeneration(params: {
  draft_id?: string | null;
  step: string;
  input_json: unknown;
  output_json: unknown;
}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  await supabase.from("generation_logs").insert({
    draft_id: params.draft_id ?? null,
    step: params.step,
    input_json: params.input_json,
    output_json: params.output_json,
  });
}

function byUpdatedAt(a: BlogDraftRecord, b: BlogDraftRecord) {
  return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
}
