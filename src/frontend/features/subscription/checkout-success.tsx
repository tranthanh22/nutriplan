"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  BrainCircuit,
  Camera,
  CheckCircle2,
  CreditCard,
  Leaf,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Utensils
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type CheckoutResult = {
  paid?: boolean;
  testMode?: boolean;
  checkoutStatus?: string;
  paymentStatus?: string;
  subscription?: {
    current_period_end?: string | null;
    subscription_plans?: { name?: string } | null;
  } | null;
};

function readError(payload: unknown) {
  if (!payload || typeof payload !== "object" || !("message" in payload)) {
    return "Không thể kiểm tra kết quả thanh toán.";
  }
  const message = payload.message;
  return Array.isArray(message)
    ? message.join(", ")
    : typeof message === "string"
      ? message
      : "Không thể kiểm tra kết quả thanh toán.";
}

export function CheckoutSuccess({ sessionId }: { sessionId: string }) {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<CheckoutResult | null>(null);
  const [error, setError] = useState("");
  const [pollAttempt, setPollAttempt] = useState(0);
  const [redirectIn, setRedirectIn] = useState(5);

  const enterApp = useCallback(() => {
    window.sessionStorage.setItem("nutriplan-checkout-confirmed", "true");
    window.location.replace("/?checkout=success");
  }, []);

  const verify = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!sessionId) {
      setError("Thiếu Stripe Checkout Session ID.");
      setLoading(false);
      return;
    }

    if (!silent) setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/subscriptions/checkout/${encodeURIComponent(sessionId)}`,
        { cache: "no-store" }
      );
      const payload: unknown = await response.json().catch(() => null);
      if (response.status === 401) {
        const next = `/checkout/success?session_id=${encodeURIComponent(sessionId)}`;
        window.location.assign(`/login?next=${encodeURIComponent(next)}`);
        return;
      }
      if (!response.ok) throw new Error(readError(payload));
      setResult(payload as CheckoutResult);
    } catch (verificationError) {
      setError(
        verificationError instanceof Error
          ? verificationError.message
          : "Không thể kiểm tra kết quả thanh toán."
      );
    } finally {
      if (!silent) setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    void verify();
  }, [verify]);

  useEffect(() => {
    if (loading || error || !result || result.paid || pollAttempt >= 8) return;
    const timer = window.setTimeout(() => {
      setPollAttempt((current) => current + 1);
      void verify({ silent: true });
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [error, loading, pollAttempt, result, verify]);

  useEffect(() => {
    if (!result?.paid) return;
    setRedirectIn(5);
    const interval = window.setInterval(() => {
      setRedirectIn((current) => Math.max(0, current - 1));
    }, 1000);
    const redirect = window.setTimeout(enterApp, 5000);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(redirect);
    };
  }, [enterApp, result?.paid]);

  const expiresAt = result?.subscription?.current_period_end
    ? new Intl.DateTimeFormat("vi-VN", {
        dateStyle: "long",
        timeStyle: "short"
      }).format(new Date(result.subscription.current_period_end))
    : null;

  return (
    <main className="checkout-result-page">
      <Link className="checkout-result-brand" href="/">
        <span><Leaf size={21} /></span> NutriPlan
      </Link>

      <section className="checkout-result-card" aria-live="polite">
        {loading && (
          <>
            <div className="checkout-result-icon checkout-result-icon--loading">
              <LoaderCircle className="spin" size={32} />
            </div>
            <span className="section-kicker">ĐANG ĐỐI SOÁT STRIPE</span>
            <h1>Đang xác nhận thanh toán…</h1>
            <p>Vui lòng giữ nguyên trang trong vài giây.</p>
          </>
        )}

        {!loading && result?.paid && (
          <>
            <div className="checkout-result-icon checkout-result-icon--success">
              <CheckCircle2 size={34} />
            </div>
            <span className="section-kicker">THANH TOÁN THÀNH CÔNG</span>
            <h1>NutriPlan Plus đã được kích hoạt</h1>
            <p>
              {result.subscription?.subscription_plans?.name ?? "Gói của bạn"}
              {expiresAt ? ` có hiệu lực đến ${expiresAt}.` : " đã sẵn sàng."}
            </p>
            <div className="checkout-unlocked">
              <div><Utensils size={18} /><span>Thực đơn và công thức chi tiết</span></div>
              <div><BrainCircuit size={18} /><span>AI Health Insight đầy đủ</span></div>
              <div><Camera size={18} /><span>Phân tích ảnh và nhật ký bữa ăn</span></div>
            </div>
            {result.testMode && (
              <div className="checkout-test-notice">
                <CreditCard size={18} />
                <span><strong>Stripe Test Mode</strong> — không có tiền thật được thu.</span>
              </div>
            )}
            <button className="button button--dark button--full" onClick={enterApp}>
              Vào ứng dụng ngay <ArrowRight size={17} />
            </button>
            <small className="checkout-redirect-note">
              Tự động chuyển về trang tổng quan sau {redirectIn} giây
            </small>
          </>
        )}

        {!loading && result && !result.paid && (
          <>
            <div className="checkout-result-icon checkout-result-icon--pending">
              <CreditCard size={32} />
            </div>
            <span className="section-kicker">CHƯA HOÀN TẤT</span>
            <h1>Stripe chưa xác nhận thanh toán</h1>
            <p>
              Trạng thái hiện tại: {result.checkoutStatus ?? "không xác định"} ·{" "}
              {result.paymentStatus ?? "chưa thanh toán"}.
            </p>
            {pollAttempt < 8 && (
              <div className="checkout-auto-check">
                <LoaderCircle className="spin" size={15} />
                Đang tự động kiểm tra với Stripe ({pollAttempt + 1}/8)
              </div>
            )}
            <button className="button button--dark button--full" onClick={() => void verify()}>
              <RefreshCw size={17} /> Kiểm tra lại
            </button>
          </>
        )}

        {!loading && error && (
          <>
            <div className="checkout-result-icon checkout-result-icon--error">
              <AlertCircle size={32} />
            </div>
            <span className="section-kicker">KHÔNG THỂ XÁC MINH</span>
            <h1>Thanh toán cần được kiểm tra lại</h1>
            <p>{error}</p>
            <button className="button button--dark button--full" onClick={() => void verify()}>
              <RefreshCw size={17} /> Thử lại
            </button>
          </>
        )}

        <div className="checkout-result-security">
          <ShieldCheck size={16} />
          Thông tin thẻ được xử lý bởi Stripe, không lưu tại NutriPlan.
        </div>
      </section>
    </main>
  );
}
