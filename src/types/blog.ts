import type { ImageObservation, UploadedImage } from "./image";
import type { ProductRecommendation } from "./product";

export type PostType =
  | "답례품 판매형"
  | "시즌 선물형"
  | "작업일기형"
  | "제품 소개형"
  | "검색 유입 정보형";

export type ReferenceStyle =
  | "검색 유입 정보형"
  | "답례품 추천형"
  | "시즌 선물형"
  | "제품 디테일형"
  | "작업일기형";

export type BlogDraftInput = {
  topic: string;
  main_keyword: string;
  sub_keywords: string[];
  target_reader: string;
  situation: string;
  raw_memo: string;
  post_type: PostType;
  reference_style: ReferenceStyle;
  preferred_products: string[];
  product_detail_answers: Record<string, Record<string, string>>;
  cta: string;
  images: UploadedImage[];
};

export type BlogSectionType =
  | "intro"
  | "empathy"
  | "product_recommendation"
  | "recommend_list"
  | "order_checklist"
  | "faq"
  | "cta";

export type BlogSection = {
  id: string;
  type: BlogSectionType;
  heading?: string;
  body: string;
};

export type WordPressSection = {
  id: string;
  heading: string;
  body: string;
};

export type WordPressDraftOutput = {
  title_candidates: string[];
  selected_title: string;
  slug: string;
  meta_description: string;
  excerpt: string;
  focus_keyword: string;
  secondary_keywords: string[];
  sections: WordPressSection[];
  faq: {
    q: string;
    a: string;
  }[];
  tags: string[];
  categories: string[];
  image_guide: {
    position: string;
    image_type: string;
    caption: string;
    alt_text: string;
  }[];
  markdown_for_wordpress: string;
};

export type TitleEvaluationRecord = {
  title: string;
  type: string;
  search_intent_score: number;
  click_appeal_score: number;
  naturalness_score: number;
  keyword_fit_score: number;
  reason: string;
};

export type BlogDraftOutput = {
  title_candidates: string[];
  selected_title: string;
  search_intent: string;
  selected_products: ProductRecommendation[];
  sections: BlogSection[];
  faq: {
    q: string;
    a: string;
  }[];
  hashtags: string[];
  image_guide: {
    position: string;
    image_type: string;
    caption: string;
  }[];
  plain_text_for_naver: string;
  wordpress: WordPressDraftOutput;
  title_analysis?: {
    naver: TitleEvaluationRecord[];
    wordpress: TitleEvaluationRecord[];
  };
};

export type BlogDraftRecord = {
  id: string;
  brand_id?: string | null;
  title: string;
  main_keyword: string;
  sub_keywords: string[];
  target_reader: string;
  topic: string;
  situation: string;
  raw_memo: string;
  post_type: PostType;
  status: "draft" | "published" | "archived";
  selected_products: ProductRecommendation[];
  content_json: BlogDraftOutput;
  image_observations: ImageObservation[];
  naver_plain_text: string;
  wordpress_title?: string | null;
  wordpress_markdown?: string | null;
  created_at: string;
  updated_at: string;
};

export type DraftQualityCheck = {
  warnings: {
    level: "info" | "warning" | "danger";
    message: string;
  }[];
  exaggeration_found: boolean;
  unsupported_claim_found: boolean;
  mobile_readability_score: number;
  suggestions: string[];
};
