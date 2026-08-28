import { NextResponse, type NextRequest } from "next/server";
import { isAdminRequest, unauthorizedJson } from "@/lib/auth";
import { getBrand, updateBrand } from "@/lib/data/store";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedJson();
  return NextResponse.json({ brand: await getBrand() });
}

export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request)) return unauthorizedJson();
  const body = await request.json();
  const brand = await updateBrand(body);
  return NextResponse.json({ brand });
}
