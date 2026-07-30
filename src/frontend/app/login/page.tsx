import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/features/auth/login-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Đăng nhập | NutriPlan",
  description: "Đăng nhập NutriPlan để xem kế hoạch và AI Health Insight cá nhân."
};

function safeNextPath(value?: string) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/app";
}

export default async function LoginPage({ searchParams }: { searchParams?: { next?: string } }) {
  const nextPath = safeNextPath(searchParams?.next);
  let signedIn = false;
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getClaims();
    signedIn = Boolean(data?.claims?.sub);
  } catch {
    // Form phía client sẽ hiển thị lỗi cấu hình nếu Supabase chưa sẵn sàng.
  }
  if (signedIn) redirect(nextPath);

  return <LoginForm nextPath={nextPath} />;
}
