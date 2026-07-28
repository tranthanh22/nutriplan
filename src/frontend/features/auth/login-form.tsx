"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, Eye, EyeOff, Leaf, LoaderCircle, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

function loginErrorMessage(error: unknown) {
  if (!error || typeof error !== "object") return "Không thể đăng nhập. Hãy thử lại.";
  const code = "code" in error ? error.code : undefined;
  if (code === "invalid_credentials") return "Email hoặc mật khẩu không chính xác.";
  if (code === "email_not_confirmed") return "Email chưa được xác nhận. Hãy kiểm tra hộp thư của bạn.";
  if (code === "over_request_rate_limit") return "Bạn thử quá nhiều lần. Vui lòng chờ một chút rồi thử lại.";
  return "message" in error && typeof error.message === "string" ? error.message : "Không thể đăng nhập. Hãy thử lại.";
}

export function LoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });
      if (signInError) throw signInError;
      router.replace(nextPath);
      router.refresh();
    } catch (signInError) {
      setError(loginErrorMessage(signInError));
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-showcase" aria-label="Giới thiệu NutriPlan">
        <Link className="login-brand" href="/"><span><Leaf size={22} /></span>NutriPlan</Link>
        <div className="login-showcase__content">
          <span className="login-kicker">DINH DƯỠNG CÁ NHÂN HÓA</span>
          <h1>Ăn đúng mục tiêu,<br />nhẹ đầu mỗi ngày.</h1>
          <p>Kế hoạch thực tế dựa trên dữ liệu sức khỏe, món ăn phù hợp và tiến độ của riêng bạn.</p>
          <div className="login-trust"><ShieldCheck size={20} /><div><strong>Phiên đăng nhập an toàn</strong><span>Token được quản lý bằng cookie; bạn không cần sao chép hoặc dán mã truy cập.</span></div></div>
        </div>
        <small>NutriPlan hỗ trợ lập kế hoạch, không thay thế tư vấn y khoa.</small>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <Link className="login-back" href="/"><ArrowLeft size={16} /> Về trang tổng quan</Link>
          <div className="login-card__heading"><span className="login-card__icon"><LockKeyhole size={22} /></span><h2>Chào mừng trở lại</h2><p>Đăng nhập để tiếp tục với kế hoạch của bạn.</p></div>

          <form className="login-form" onSubmit={(event) => void submit(event)}>
            <label htmlFor="login-email">Email</label>
            <div className="login-input"><Mail size={18} /><input id="login-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="ban@example.com" autoComplete="email" autoFocus required /></div>

            <label htmlFor="login-password">Mật khẩu</label>
            <div className="login-input"><LockKeyhole size={18} /><input id="login-password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Nhập mật khẩu" autoComplete="current-password" minLength={6} required /><button type="button" aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} onClick={() => setShowPassword((current) => !current)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>

            {error && <div className="login-error" role="alert"><AlertCircle size={17} /><span>{error}</span></div>}
            <button className="button button--dark button--full login-submit" type="submit" disabled={loading}>{loading ? <LoaderCircle className="spin" size={18} /> : <LockKeyhole size={18} />}{loading ? "Đang đăng nhập…" : "Đăng nhập"}</button>
          </form>
          <p className="login-help">Chưa có tài khoản? Tạo người dùng trong Supabase Auth cho bản MVP.</p>
        </div>
      </section>
    </main>
  );
}
