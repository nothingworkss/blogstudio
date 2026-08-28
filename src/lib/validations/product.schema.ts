import { z } from "zod";

export const productFaqSchema = z.object({
  q: z.string().min(1),
  a: z.string().min(1),
});

export const productEditorialProfileSchema = z.object({
  recommended_situation: z.string().default(""),
  one_line_point: z.string().default(""),
  message_point: z.string().default(""),
  packaging_mood: z.string().default(""),
  order_check: z.string().default(""),
  owner_comment: z.string().default(""),
  photo_points: z.string().default(""),
  faq_notes: z.string().default(""),
});

export const productRecommendationSummarySchema = productEditorialProfileSchema.pick({
  recommended_situation: true,
  one_line_point: true,
  message_point: true,
  packaging_mood: true,
  order_check: true,
});

export const productSchema = z.object({
  id: z.string().optional(),
  brand_id: z.string().nullable().optional(),
  name: z.string().min(1),
  category: z.string().min(1),
  short_description: z.string().nullable().optional(),
  long_description: z.string().nullable().optional(),
  fit_situations: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  strengths: z.array(z.string()).default([]),
  cautions: z.array(z.string()).default([]),
  editorial_profile: productEditorialProfileSchema.nullable().optional(),
  default_intro: z.string().nullable().optional(),
  default_faq: z.array(productFaqSchema).default([]),
  image_url: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
});

export const productRecommendationSchema = z.object({
  product_name: z.string(),
  reason: z.string(),
  angle: z.string(),
  main_points: z.array(z.string()),
  caution: z.string(),
  summary: productRecommendationSummarySchema,
  owner_comment: z.string(),
  missing_info: z.array(z.string()),
  score: z.number().optional(),
});
