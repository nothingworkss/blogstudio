import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { z } from "zod";
import { getEnv, hasOpenAiEnv } from "@/lib/env";

let client: OpenAI | null = null;

export function getOpenAIClient() {
  if (!hasOpenAiEnv()) return null;
  if (!client) {
    client = new OpenAI({ apiKey: getEnv("OPENAI_API_KEY") });
  }
  return client;
}

export async function runStructuredResponse<T extends z.ZodType>({
  schema,
  schemaName,
  instructions,
  input,
  model = getEnv("OPENAI_MODEL") || "gpt-5.2-mini",
}: {
  schema: T;
  schemaName: string;
  instructions: string;
  input: unknown;
  model?: string;
}): Promise<z.infer<T> | null> {
  const openai = getOpenAIClient();
  if (!openai) return null;

  const response = await openai.responses.create({
    model,
    instructions,
    input: typeof input === "string" ? input : JSON.stringify(input),
    text: {
      format: zodTextFormat(schema, schemaName),
      verbosity: "medium",
    },
  });

  return schema.parse(JSON.parse(response.output_text));
}

export async function runVisionStructuredResponse<T extends z.ZodType>({
  schema,
  schemaName,
  instructions,
  text,
  imageUrls,
  model = getEnv("OPENAI_VISION_MODEL") || getEnv("OPENAI_MODEL") || "gpt-5.2-mini",
}: {
  schema: T;
  schemaName: string;
  instructions: string;
  text: string;
  imageUrls: string[];
  model?: string;
}): Promise<z.infer<T> | null> {
  const openai = getOpenAIClient();
  if (!openai) return null;

  const content = [
    { type: "input_text", text },
    ...imageUrls.map((imageUrl) => ({
      type: "input_image",
      image_url: imageUrl,
    })),
  ];

  const response = await openai.responses.create({
    model,
    instructions,
    input: [
      {
        role: "user",
        content,
      },
    ] as never,
    text: {
      format: zodTextFormat(schema, schemaName),
      verbosity: "medium",
    },
  });

  return schema.parse(JSON.parse(response.output_text));
}
