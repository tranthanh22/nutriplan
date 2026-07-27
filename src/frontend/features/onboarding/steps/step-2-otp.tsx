"use client";

import { useRef, useState } from "react";
import { Mail } from "lucide-react";

interface Step2OtpProps {
  email: string;
  onVerify: (token: string) => Promise<void>;
  onBack: () => void;
}

const OTP_LENGTH = 6;

export function Step2Otp({ email, onVerify, onBack }: Step2OtpProps) {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = cleaned;
    setDigits(next);
    if (cleaned && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    e.preventDefault();
    const next = [...digits];
    Array.from(pasted).forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    const lastFilled = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[lastFilled]?.focus();
  };

  const handleSubmit = async () => {
    const token = digits.join("");
    if (token.length < OTP_LENGTH) return;
    setError("");
    setLoading(true);
    try {
      await onVerify(token);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isFull = digits.every(Boolean);

  return (
    <div className="ob-otp-page">
      <div className="ob-otp-card">
        <div className="ob-otp-icon">
          <Mail size={28} />
        </div>
        <h1 className="ob-otp-card__title">Check your email</h1>
        <p className="ob-otp-card__sub">
          We sent a 6-digit code to <strong>{email}</strong>. Enter it below to verify your
          account.
        </p>

        <div className="ob-otp-inputs" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              id={`ob-otp-${i}`}
              type="text"
              inputMode="numeric"
              pattern="\d*"
              maxLength={1}
              className={`ob-otp-digit${d ? " ob-otp-digit--filled" : ""}`}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              autoFocus={i === 0}
              autoComplete={i === 0 ? "one-time-code" : "off"}
            />
          ))}
        </div>

        {error && <p className="ob-error ob-error--center">{error}</p>}

        <button
          className="ob-btn-primary"
          onClick={handleSubmit}
          disabled={!isFull || loading}
          type="button"
        >
          {loading ? "Verifying…" : "Verify & Continue →"}
        </button>

        <button className="ob-btn-ghost" onClick={onBack} type="button">
          ← Use a different email
        </button>
      </div>
    </div>
  );
}
