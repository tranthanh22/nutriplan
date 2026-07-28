import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function getVerifiedAccessToken() {
  try {
    const supabase = createClient();
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
    if (claimsError || !claimsData?.claims?.sub) return null;
    const { data: sessionData } = await supabase.auth.getSession();
    return sessionData.session?.access_token ?? null;
  } catch {
    return null;
  }
}

export async function forwardBackendJson(
  path: string,
  init: RequestInit = {},
  accessToken?: string,
) {
  const baseUrl = (process.env.NUTRIPLAN_API_BASE_URL ?? "http://localhost:4000/api/v1").replace(/\/$/, "");
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...init.headers
      },
      cache: "no-store"
    });
    const body = await response.text();
    return new NextResponse(body, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "application/json; charset=utf-8",
        "Cache-Control": "private, no-store"
      }
    });
  } catch {
    return NextResponse.json({ message: "Không thể kết nối NutriPlan backend." }, { status: 503 });
  }
}

export function unauthorizedResponse() {
  return NextResponse.json({ message: "Vui lòng đăng nhập trước khi mua subscription." }, { status: 401 });
}
