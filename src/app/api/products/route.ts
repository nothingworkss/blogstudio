import { NextResponse, type NextRequest } from "next/server";
import { isAdminRequest, unauthorizedJson } from "@/lib/auth";
import { listProducts, upsertProduct } from "@/lib/data/store";
import { productSchema } from "@/lib/validations/product.schema";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedJson();
  return NextResponse.json({ products: await listProducts() });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedJson();
  const body = await request.json();
  const parsed = productSchema.parse(body);
  const product = await upsertProduct({
    ...parsed,
    name: parsed.name,
    category: parsed.category,
  });
  return NextResponse.json({ product });
}
