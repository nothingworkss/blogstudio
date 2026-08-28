export type Brand = {
  id: string;
  name: string;
  domain?: string | null;
  tone: string;
  default_cta: string;
  forbidden_words: string[];
  created_at?: string;
};

export type Product = {
  id: string;
  brand_id?: string | null;
  name: string;
  category: string;
  short_description?: string | null;
  long_description?: string | null;
  fit_situations: string[];
  keywords: string[];
  strengths: string[];
  cautions: string[];
  editorial_profile?: ProductEditorialProfile | null;
  default_intro?: string | null;
  default_faq?: ProductFaq[];
  image_url?: string | null;
  is_active: boolean;
  created_at?: string;
};

export type ProductEditorialProfile = {
  recommended_situation: string;
  one_line_point: string;
  message_point: string;
  packaging_mood: string;
  order_check: string;
  owner_comment: string;
  photo_points: string;
  faq_notes: string;
};

export type ProductFaq = {
  q: string;
  a: string;
};

export type ProductRecommendationSummary = Pick<
  ProductEditorialProfile,
  "recommended_situation" | "one_line_point" | "message_point" | "packaging_mood" | "order_check"
>;

export type ProductRecommendation = {
  product_name: string;
  reason: string;
  angle: string;
  main_points: string[];
  caution: string;
  summary: ProductRecommendationSummary;
  owner_comment: string;
  missing_info: string[];
  score?: number;
};

export type ProductScoreBreakdown = {
  product: Product;
  score: number;
  reasons: string[];
};
