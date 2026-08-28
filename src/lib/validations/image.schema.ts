import { z } from "zod";

export const uploadedImageSchema = z.object({
  id: z.string(),
  url: z.string(),
  name: z.string(),
  position_label: z.string().optional(),
});

export const imageObservationSchema = z.object({
  image_url: z.string(),
  visible_products: z.array(z.string()),
  packaging: z.string(),
  colors: z.array(z.string()),
  visible_text: z.array(z.string()),
  quantity: z.string(),
  mood: z.string(),
  caption: z.string(),
  cautions: z.array(z.string()),
});
