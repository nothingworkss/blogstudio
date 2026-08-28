import { randomUUID } from "crypto";
import { getSupabaseAdmin } from "./server";

export async function uploadBlogImage(file: File) {
  const supabase = getSupabaseAdmin();
  const bytes = await file.arrayBuffer();
  const extension = file.name.split(".").pop() || "png";
  const id = randomUUID();
  const path = `blog-images/${id}.${extension}`;

  if (!supabase) {
    const base64 = Buffer.from(bytes).toString("base64");
    return {
      image_id: id,
      image_url: `data:${file.type || "image/png"};base64,${base64}`,
      storage_path: null,
      demo: true,
    };
  }

  const { error } = await supabase.storage
    .from("blog-images")
    .upload(path, bytes, {
      contentType: file.type || "image/png",
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabase.storage.from("blog-images").getPublicUrl(path);
  return {
    image_id: id,
    image_url: data.publicUrl,
    storage_path: path,
    demo: false,
  };
}
