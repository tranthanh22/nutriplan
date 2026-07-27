"use client";

import { useState } from "react";
import { Eye, EyeOff, Leaf, Mail, Lock } from "lucide-react";

interface Step1AuthProps {
  onSuccess: (email: string) => void;
  onSignUp: (email: string, password: string) => Promise<void>;
}

export function Step1Auth({ onSuccess, onSignUp }: Step1AuthProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setError("");
    setLoading(true);
    try {
      await onSignUp(email.trim(), password);
      onSuccess(email.trim());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ob-auth-page">
      {/* Brand header */}
      <div className="ob-auth-brand">
        <div className="ob-auth-brand__icon">
          <Leaf size={22} />
        </div>
        <span>NutriPlan</span>
      </div>

      <div className="ob-auth-card">
        <h1 className="ob-auth-card__title">Tạo tài khoản NutriPlan</h1>
        <p className="ob-auth-card__sub">
          Bắt đầu hành trình dinh dưỡng cá nhân hoá dành riêng cho bạn.
        </p>

        <form className="ob-auth-form" onSubmit={handleSubmit} noValidate>
          <div className="ob-field">
            <label htmlFor="ob-email" className="ob-label">
              Địa chỉ Email
            </label>
            <div className="ob-input-wrap">
              <Mail size={16} className="ob-input-icon" />
              <input
                id="ob-email"
                type="email"
                className="ob-input ob-input--icon"
                placeholder="ban@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="ob-field">
            <label htmlFor="ob-password" className="ob-label">
              Mật khẩu
            </label>
            <div className="ob-input-wrap">
              <Lock size={16} className="ob-input-icon" />
              <input
                id="ob-password"
                type={showPw ? "text" : "password"}
                className="ob-input ob-input--icon ob-input--pw"
                placeholder="Ít nhất 8 ký tự"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
              <button
                type="button"
                className="ob-pw-toggle"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && <p className="ob-error">{error}</p>}

          <button
            type="submit"
            className="ob-btn-primary"
            disabled={loading || !email || password.length < 8}
          >
            {loading ? "Đang tạo tài khoản…" : "Tạo tài khoản →"}
          </button>
        </form>

        <p className="ob-auth-footer">
          Bằng việc đăng ký, bạn đồng ý với{" "}
          <a href="#" className="ob-link">
            Điều khoản dịch vụ
          </a>{" "}
          và{" "}
          <a href="#" className="ob-link">
            Chính sách bảo mật
          </a>
          .
        </p>
      </div>
    </div>
  );
}
