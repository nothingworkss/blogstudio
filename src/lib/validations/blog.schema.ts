import { z } from "zod";
import { imageObservationSchema, uploadedImageSchema } from "./image.schema";
import { productRecommendationSchema } from "./product.schema";

export const postTypeSchema = z.enum([
  "답례품 판매형",
  "시즌 선물형",
  "작업일기형",
  "제품 소개형",
  "검색 유입 정보형",
]);

export const referenceStyleSchema = z.enum([
  "검색 유입 정보형",
  "답례품 추천형",
  "시즌 선물형",
  "제품 디테일형",
  "작업일기형",
]);

export const blogDraftInputSchema = z.object({
  topic: z.string().min(1),
  main_keyword: z.string().min(1),
  sub_keywords: z.array(z.string()).default([]),
  target_reader: z.string().default(""),
  situation: z.string().default(""),
  raw_memo: z.string().default(""),
  post_type: postTypeSchema.default("답례품 판매형"),
  reference_style: referenceStyleSchema.default("답례품 추천형"),
  preferred_products: z.array(z.string()).default([]),
  product_detail_answers: z.record(z.string(), z.record(z.string(), z.string())).default({}),
  cta: z.string().default(""),
  images: z.array(uploadedImageSchema).default([]),
});

export const blogSectionSchema = z.object({
  id: z.string(),
  type: z.enum([
    "intro",
    "empathy",
    "product_recommendation",
    "recommend_list",
    "order_checklist",
    "faq",
    "cta",
  ]),
  heading: z.string().optional(),
  body: z.string(),
});

export const wordpressSectionSchema = z.object({
  id: z.string(),
  heading: z.string(),
  body: z.string(),
});

export const wordpressDraftOutputSchema = z.object({
  title_candidates: z.array(z.string()).length(5),
  selected_title: z.string(),
  slug: z.string(),
  meta_description: z.string(),
  excerpt: z.string(),
  focus_keyword: z.string(),
  secondary_keywords: z.array(z.string()).default([]),
  sections: z.array(wordpressSectionSchema).min(5),
  faq: z.array(z.object({ q: z.string(), a: z.string() })).length(4),
  tags: z.array(z.string()).min(5).max(15),
  categories: z.array(z.string()).min(1).max(5),
  image_guide: z
    .array(
      z.object({
        position: z.string(),
        image_type: z.string(),
        caption: z.string(),
        alt_text: z.string(),
      }),
    )
    .min(3),
  markdown_for_wordpress: z.string(),
});

export const naverDraftOutputSchema = z.object({
  title_candidates: z.array(z.string()).length(5),
  selected_title: z.string(),
  search_intent: z.string(),
  selected_products: z.array(productRecommendationSchema).length(2),
  sections: z.array(blogSectionSchema).min(6),
  faq: z.array(z.object({ q: z.string(), a: z.string() })).length(4),
  hashtags: z.array(z.string()).min(10).max(15),
  image_guide: z
    .array(
      z.object({
        position: z.string(),
        image_type: z.string(),
        caption: z.string(),
      }),
    )
    .min(3),
  plain_text_for_naver: z.string(),
});

export const naverGenerationOutputSchema = naverDraftOutputSchema
  .omit({ selected_products: true, plain_text_for_naver: true })
  .extend({ sections: z.array(blogSectionSchema).length(7) });

export const wordpressGenerationOutputSchema = wordpressDraftOutputSchema
  .omit({ markdown_for_wordpress: true })
  .extend({ sections: z.array(wordpressSectionSchema).length(7) });

const titleIdeaTypeSchema = z.enum([
  "정보형",
  "경험 확인형",
  "비교형",
  "문제 해결형",
  "궁금증 유발형",
  "구매 직전형",
]);

const titleScoreSchema = z.object({
  search_intent: z.number().min(0).max(10),
  click_appeal: z.number().min(0).max(10),
  naturalness: z.number().min(0).max(10),
  keyword_fit: z.number().min(0).max(10),
});

const titleCandidateGroupSchema = z.object({
  type: titleIdeaTypeSchema,
  titles: z.array(z.string()).length(5),
});

const rankedTitleCandidateSchema = z.object({
  title: z.string(),
  type: titleIdeaTypeSchema,
  scores: titleScoreSchema,
  reason: z.string(),
});

const titleEvaluationRecordSchema = z.object({
  title: z.string(),
  type: titleIdeaTypeSchema,
  search_intent_score: z.number().min(0).max(10),
  click_appeal_score: z.number().min(0).max(10),
  naturalness_score: z.number().min(0).max(10),
  keyword_fit_score: z.number().min(0).max(10),
  reason: z.string(),
});

export const titleChannelGenerationSchema = z.object({
  candidate_groups: z.array(titleCandidateGroupSchema).length(6),
  ranked_candidates: z.array(rankedTitleCandidateSchema).length(5),
  title_candidates: z.array(z.string()).length(5),
  selected_title: z.string(),
});

export const titleGenerationOutputSchema = z.object({
  naver: titleChannelGenerationSchema,
  wordpress: titleChannelGenerationSchema,
});

export const blogDraftOutputSchema = naverDraftOutputSchema.extend({
  wordpress: wordpressDraftOutputSchema,
  title_analysis: z.object({
    naver: z.array(titleEvaluationRecordSchema),
    wordpress: z.array(titleEvaluationRecordSchema),
  }).optional(),
});

export const draftQualityCheckSchema = z.object({
  warnings: z.array(
    z.object({
      level: z.enum(["info", "warning", "danger"]),
      message: z.string(),
    }),
  ),
  exaggeration_found: z.boolean(),
  unsupported_claim_found: z.boolean(),
  mobile_readability_score: z.number().min(0).max(100),
  suggestions: z.array(z.string()),
});

export const blogDraftRecordSchema = z.object({
  id: z.string(),
  brand_id: z.string().nullable().optional(),
  title: z.string(),
  main_keyword: z.string(),
  sub_keywords: z.array(z.string()),
  target_reader: z.string().default(""),
  topic: z.string(),
  situation: z.string(),
  raw_memo: z.string(),
  post_type: postTypeSchema,
  status: z.enum(["draft", "published", "archived"]),
  selected_products: z.array(productRecommendationSchema),
  content_json: blogDraftOutputSchema,
  image_observations: z.array(imageObservationSchema),
  naver_plain_text: z.string(),
  wordpress_title: z.string().nullable().optional(),
  wordpress_markdown: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});
