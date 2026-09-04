create extension if not exists pgcrypto;

create table if not exists brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text,
  tone text not null default '',
  default_cta text not null default '',
  forbidden_words text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade,
  name text not null,
  category text,
  short_description text,
  long_description text,
  fit_situations text[] not null default '{}',
  keywords text[] not null default '{}',
  strengths text[] not null default '{}',
  cautions text[] not null default '{}',
  editorial_profile jsonb not null default '{}'::jsonb,
  default_intro text,
  default_faq jsonb not null default '[]'::jsonb,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists blog_drafts (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete set null,
  title text,
  main_keyword text,
  sub_keywords text[] not null default '{}',
  target_reader text,
  topic text,
  situation text,
  raw_memo text,
  post_type text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  selected_products jsonb not null default '[]'::jsonb,
  content_json jsonb not null default '{}'::jsonb,
  naver_plain_text text,
  wordpress_title text,
  wordpress_markdown text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table blog_drafts add column if not exists wordpress_title text;
alter table blog_drafts add column if not exists wordpress_markdown text;
alter table blog_drafts add column if not exists target_reader text;

create table if not exists blog_images (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid references blog_drafts(id) on delete cascade,
  image_url text not null,
  observation jsonb,
  caption text,
  position_label text,
  sort_order int,
  created_at timestamptz not null default now()
);

create table if not exists generation_logs (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid references blog_drafts(id) on delete set null,
  step text not null,
  input_json jsonb,
  output_json jsonb,
  created_at timestamptz not null default now()
);

create table if not exists reference_patterns (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  intent text not null,
  pattern_json jsonb not null default '{}'::jsonb,
  safety_rules text[] not null default '{}',
  source_note text not null default 'sanitized_internal_pattern',
  created_at timestamptz not null default now()
);

create index if not exists products_brand_id_idx on products (brand_id);
create index if not exists products_active_idx on products (is_active) where is_active = true;
create index if not exists products_keywords_gin_idx on products using gin (keywords);
create index if not exists products_fit_situations_gin_idx on products using gin (fit_situations);
create index if not exists blog_drafts_brand_status_idx on blog_drafts (brand_id, status);
create index if not exists blog_drafts_updated_at_idx on blog_drafts (updated_at desc);
create index if not exists blog_drafts_main_keyword_idx on blog_drafts (main_keyword);
create index if not exists blog_images_draft_id_idx on blog_images (draft_id);
create index if not exists generation_logs_draft_id_idx on generation_logs (draft_id);
create index if not exists generation_logs_created_at_idx on generation_logs (created_at desc);
create index if not exists reference_patterns_name_idx on reference_patterns (name);

alter table brands enable row level security;
alter table products enable row level security;
alter table blog_drafts enable row level security;
alter table blog_images enable row level security;
alter table generation_logs enable row level security;
alter table reference_patterns enable row level security;

create policy "service role manages brands" on brands
  for all using ((select auth.role()) = 'service_role')
  with check ((select auth.role()) = 'service_role');

create policy "service role manages products" on products
  for all using ((select auth.role()) = 'service_role')
  with check ((select auth.role()) = 'service_role');

create policy "service role manages blog drafts" on blog_drafts
  for all using ((select auth.role()) = 'service_role')
  with check ((select auth.role()) = 'service_role');

create policy "service role manages blog images" on blog_images
  for all using ((select auth.role()) = 'service_role')
  with check ((select auth.role()) = 'service_role');

create policy "service role manages generation logs" on generation_logs
  for all using ((select auth.role()) = 'service_role')
  with check ((select auth.role()) = 'service_role');

create policy "service role manages reference patterns" on reference_patterns
  for all using ((select auth.role()) = 'service_role')
  with check ((select auth.role()) = 'service_role');

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists blog_drafts_set_updated_at on blog_drafts;
create trigger blog_drafts_set_updated_at
before update on blog_drafts
for each row execute function set_updated_at();
