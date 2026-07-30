import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/features/auth/register-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Đăng ký | NutriPlan",
  description: "Tạo tài khoản NutriPlan để nhận kế hoạch dinh dưỡng cá nhân."
};

function safeNextPath(value?: string) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/app";
}

export default async function RegisterPage({
  searchParams
}: {
  searchParams?: { next?: string };
}) {
  const nextPath = safeNextPath(searchParams?.next);
  let signedIn = false;
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getClaims();
    signedIn = Boolean(data?.claims?.sub);
  } catch {
    // Form client sẽ hiển thị lỗi cấu hình nếu Supabase chưa sẵn sàng.
  }
  if (signedIn) redirect(nextPath);

  return <RegisterForm nextPath={nextPath} />;
}
