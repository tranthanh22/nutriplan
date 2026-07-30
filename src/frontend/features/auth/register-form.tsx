"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Leaf,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserRound
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

function registerErrorMessage(error: unknown) {
  if (!error || typeof error !== "object") {
    return "Không thể tạo tài khoản. Hãy thử lại.";
  }
  const code = "code" in error ? error.code : undefined;
  if (code === "user_already_exists") {
    return "Email này đã có tài khoản. Hãy chuyển sang đăng nhập.";
  }
  if (code === "weak_password") {
    return "Mật khẩu chưa đủ mạnh. Hãy dùng ít nhất 8 ký tự.";
  }
  if (code === "over_email_send_rate_limit") {
    return "Đã gửi quá nhiều email. Vui lòng chờ rồi thử lại.";
  }
  return "message" in error && typeof error.message === "string"
    ? error.message
    : "Không thể tạo tài khoản. Hãy thử lại.";
}

export function RegisterForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmationSent, setConfirmationSent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận chưa trùng khớp.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: name.trim()
          }
        }
      });
      if (signUpError) throw signUpError;
      if (data.session) {
        router.replace(nextPath);
        router.refresh();
        return;
      }
      setConfirmationSent(true);
    } catch (signUpError) {
      setError(registerErrorMessage(signUpError));
    } finally {
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
        <Link className="login-brand" href="/">
          <span>
            <Leaf size={22} />
          </span>
          NutriPlan
        </Link>
        <div className="login-showcase__content">
          <span className="login-kicker">BẮT ĐẦU MIỄN PHÍ</span>
          <h1>
            Hiểu cơ thể,
            <br />
            ăn đúng hơn.
          </h1>
          <p>
            Tạo hồ sơ một lần để nhận phân tích AI, thực đơn cá nhân và theo dõi
            bữa ăn mỗi ngày.
          </p>
          <div className="login-trust">
            <ShieldCheck size={20} />
            <div>
              <strong>Dữ liệu thuộc về bạn</strong>
              <span>
                Mật khẩu do Supabase Auth bảo vệ và không được lưu trong mã
                nguồn NutriPlan.
              </span>
            </div>
          </div>
        </div>
        <small>
          NutriPlan hỗ trợ lập kế hoạch, không thay thế tư vấn y khoa.
        </small>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <Link className="login-back" href="/">
            <ArrowLeft size={16} /> Về trang giới thiệu
          </Link>
          {confirmationSent ? (
            <div className="register-confirmation">
              <span>
                <CheckCircle2 size={28} />
              </span>
              <h2>Kiểm tra email của bạn</h2>
              <p>
                Supabase đã gửi liên kết xác nhận tới <strong>{email}</strong>.
                Xác nhận email rồi đăng nhập để vào NutriPlan.
              </p>
              <Link className="button button--primary button--full" href="/login">
                Đi tới đăng nhập
              </Link>
            </div>
          ) : (
            <>
              <div className="login-card__heading">
                <span className="login-card__icon">
                  <UserRound size={22} />
                </span>
                <h2>Tạo tài khoản</h2>
                <p>Bắt đầu với hồ sơ và phân tích dinh dưỡng của riêng bạn.</p>
              </div>
              <form className="login-form" onSubmit={(event) => void submit(event)}>
                <label htmlFor="register-name">Họ và tên</label>
                <div className="login-input">
                  <UserRound size={18} />
                  <input
                    id="register-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Nguyễn Minh Anh"
                    autoComplete="name"
                    required
                  />
                </div>
                <label htmlFor="register-email">Email</label>
                <div className="login-input">
                  <Mail size={18} />
                  <input
                    id="register-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="ban@example.com"
                    autoComplete="email"
                    required
                  />
                </div>
                <label htmlFor="register-password">Mật khẩu</label>
                <div className="login-input">
                  <LockKeyhole size={18} />
                  <input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Tối thiểu 8 ký tự"
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    onClick={() => setShowPassword((visible) => !visible)}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                <label htmlFor="register-confirm-password">
                  Xác nhận mật khẩu
                </label>
                <div className="login-input">
                  <LockKeyhole size={18} />
                  <input
                    id="register-confirm-password"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Nhập lại mật khẩu"
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </div>
                {error ? (
                  <div className="login-error" role="alert">
                    <AlertCircle size={17} />
                    <span>{error}</span>
                  </div>
                ) : null}
                <button
                  className="button button--primary button--full login-submit"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <LoaderCircle className="spin" size={18} />
                  ) : (
                    <UserRound size={18} />
                  )}
                  {loading ? "Đang tạo tài khoản…" : "Đăng ký"}
                </button>
              </form>
              <p className="login-help">
                Đã có tài khoản? <Link href="/login">Đăng nhập ngay</Link>
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
