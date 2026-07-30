"use client";

import Link from "next/link";
import Image from "next/image";
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
        <Image
          className="login-showcase__image"
          src="/images/figma/auth-healthy-food.jpg"
          alt=""
          fill
          priority
          sizes="50vw"
        />
        <span className="login-showcase__veil" />
        <Link className="login-brand" href="/"><span><Leaf size={22} /></span>NutriPlan</Link>
        <small>NutriPlan hỗ trợ lập kế hoạch, không thay thế tư vấn y khoa.</small>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <Link className="login-back" href="/"><ArrowLeft size={16} /> Về trang giới thiệu</Link>
          <div className="login-card__heading"><span className="login-card__icon"><LockKeyhole size={22} /></span><h2>Chào mừng trở lại</h2><p>Đăng nhập để tiếp tục với kế hoạch của bạn.</p></div>

          <form className="login-form" onSubmit={(event) => void submit(event)}>
            <label htmlFor="login-email">Email</label>
            <div className="login-input"><Mail size={18} /><input id="login-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="ban@example.com" autoComplete="email" autoFocus required /></div>

            <label htmlFor="login-password">Mật khẩu</label>
            <div className="login-input"><LockKeyhole size={18} /><input id="login-password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Nhập mật khẩu" autoComplete="current-password" minLength={6} required /><button type="button" aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"} onClick={() => setShowPassword((current) => !current)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>

            {error && <div className="login-error" role="alert"><AlertCircle size={17} /><span>{error}</span></div>}
            <button className="button button--dark button--full login-submit" type="submit" disabled={loading}>{loading ? <LoaderCircle className="spin" size={18} /> : <LockKeyhole size={18} />}{loading ? "Đang đăng nhập…" : "Đăng nhập"}</button>
          </form>
          <p className="login-help">Chưa có tài khoản? <Link href="/register">Đăng ký miễn phí</Link></p>
        </div>
      </section>
    </main>
  );
}
