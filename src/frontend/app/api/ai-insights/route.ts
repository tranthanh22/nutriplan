import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function forwardToBackend(method: "GET" | "POST") {
  let supabase: ReturnType<typeof createClient>;
  try {
    supabase = createClient();
  } catch {
    return NextResponse.json(
      { message: "Frontend chưa được cấu hình Supabase. Kiểm tra file .env.local." },
      { status: 503 }
    );
  }
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims?.sub) {
    return NextResponse.json({ message: "Vui lòng đăng nhập để xem AI Insight." }, { status: 401 });
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) {
    return NextResponse.json({ message: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." }, { status: 401 });
  }

  const baseUrl = (process.env.NUTRIPLAN_API_BASE_URL ?? "http://localhost:4000/api/v1").replace(/\/$/, "");
  const suffix = method === "GET" ? "/ai-health-insights/latest" : "/ai-health-insights";

  try {
    const response = await fetch(`${baseUrl}${suffix}`, {
      method,
      headers: { Accept: "application/json", Authorization: `Bearer ${accessToken}` },
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
    return NextResponse.json({ message: "Không thể kết nối dịch vụ phân tích." }, { status: 503 });
  }
}

export function GET() {
  return forwardToBackend("GET");
}

export function POST() {
  return forwardToBackend("POST");
}
