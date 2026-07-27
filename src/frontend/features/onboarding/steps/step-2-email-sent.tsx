"use client";

import { CheckCircle2, Mail, ExternalLink } from "lucide-react";

interface Step2EmailSentProps {
  email: string;
  onBack: () => void;
}

export function Step2EmailSent({ email, onBack }: Step2EmailSentProps) {
  return (
    <div className="ob-otp-page">
      <div className="ob-otp-card">
        <div className="ob-otp-icon">
          <Mail size={32} />
        </div>
        <h1 className="ob-otp-card__title">Kiểm tra hộp thư Email</h1>
        <p className="ob-otp-card__sub">
          Chúng tôi đã gửi một liên kết xác nhận đến <strong>{email}</strong>.
          <br />
          Vui lòng mở email và nhấn vào liên kết để xác nhận tài khoản của bạn.
        </p>

        <div className="ob-email-sent-notice">
          <CheckCircle2 size={18} />
          <span>Sau khi nhấn vào liên kết, bạn sẽ được tự động chuyển thẳng đến bước thiết lập hồ sơ.</span>
        </div>

        <a
          href="https://mail.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="ob-btn-primary"
          style={{ textDecoration: "none", margin: "20px 0 10px" }}
        >
          Mở Hộp Thư Email <ExternalLink size={16} />
        </a>

        <button className="ob-btn-ghost" onClick={onBack} type="button">
          ← Sử dụng email khác
        </button>
      </div>
    </div>
  );
}
