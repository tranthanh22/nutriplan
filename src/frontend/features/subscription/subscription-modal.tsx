"use client";

import { AlertCircle, ArrowRight, CheckCircle2, CreditCard, LoaderCircle, LockKeyhole, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/modal";
import type { CurrentSubscription } from "@/features/settings/settings-api";

type SubscriptionPlan = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price_amount: number | string;
  currency: string;
  features: { access_days?: number; recipe_access?: boolean };
};

function formatPrice(amount: number | string, currency: string) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(Number(amount));
}

function planDuration(plan: SubscriptionPlan) {
  const days = plan.features?.access_days;
  if (days === 7) return "7 ngày";
  if (days === 30) return "1 tháng";
  if (days === 90) return "3 tháng";
  return `${days ?? 0} ngày`;
}

function readError(payload: unknown) {
  if (!payload || typeof payload !== "object" || !("message" in payload)) return "Không thể tạo phiên thanh toán.";
  const message = payload.message;
  return Array.isArray(message) ? message.join(", ") : typeof message === "string" ? message : "Không thể tạo phiên thanh toán.";
}

export function SubscriptionModal({
  hasActiveAccess,
  onActivated,
  onClose
}: {
  hasActiveAccess: boolean;
  onActivated: (subscription: NonNullable<CurrentSubscription>) => void;
  onClose: () => void;
}) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [startingTrial, setStartingTrial] = useState(false);
  const [error, setError] = useState("");
  const idempotencyKey = useRef("");

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/subscriptions", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const payload: unknown = await response.json().catch(() => null);
        if (!response.ok) throw new Error(readError(payload));
        const nextPlans = Array.isArray(payload) ? payload as SubscriptionPlan[] : [];
        setPlans(nextPlans);
        setSelectedId(nextPlans.find((plan) => plan.code === "monthly")?.id ?? nextPlans[0]?.id ?? "");
      })
      .catch((requestError) => {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        setError(requestError instanceof Error ? requestError.message : "Không thể tải các gói subscription.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const selectedPlan = plans.find((plan) => plan.id === selectedId) ?? null;

  async function startTrial() {
    setStartingTrial(true);
    setError("");
    try {
      const response = await fetch("/api/subscriptions/trial", { method: "POST" });
      const payload: unknown = await response.json().catch(() => null);
      if (response.status === 401) {
        window.location.assign(`/login?next=${encodeURIComponent("/app")}`);
        return;
      }
      if (!response.ok) throw new Error(readError(payload));
      onActivated(payload as NonNullable<CurrentSubscription>);
    } catch (trialError) {
      setError(trialError instanceof Error ? trialError.message : "Không thể kích hoạt dùng thử.");
      setStartingTrial(false);
    }
  }

  async function checkout() {
    if (!selectedPlan) return;
    setCheckingOut(true);
    setError("");
    idempotencyKey.current ||= crypto.randomUUID();

    try {
      const response = await fetch("/api/subscriptions/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedPlan.id, idempotencyKey: idempotencyKey.current })
      });
      const payload: unknown = await response.json().catch(() => null);
      if (response.status === 401) {
        window.location.assign(
          `/login?next=${encodeURIComponent("/app")}`
        );
        return;
      }
      if (!response.ok) throw new Error(readError(payload));
      if (
        payload &&
        typeof payload === "object" &&
        "status" in payload &&
        payload.status === "already_paid"
      ) {
        window.location.assign("/app?checkout=success");
        return;
      }
      if (!payload || typeof payload !== "object" || !("checkoutUrl" in payload) || typeof payload.checkoutUrl !== "string") {
        throw new Error("Giao dịch đã được thanh toán hoặc checkout URL không hợp lệ.");
      }
      window.location.assign(payload.checkoutUrl);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Không thể bắt đầu thanh toán.");
      setCheckingOut(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="subscription-modal">
        <button className="modal-close subscription-modal__close" aria-label="Đóng" onClick={onClose}><X size={19} /></button>
        <div className="subscription-modal__mark"><Sparkles /></div>
        <span className="section-kicker">NUTRIPLAN PLUS</span>
        {process.env.NEXT_PUBLIC_STRIPE_TEST_MODE === "true" && (
          <div className="stripe-test-badge">
            <CreditCard size={15} /> STRIPE TEST MODE · KHÔNG THU TIỀN THẬT
          </div>
        )}
        <h2>Ăn đúng kế hoạch,<br />nhẹ đầu mỗi ngày.</h2>
        <p>Mở khóa bộ công cụ giúp bạn biến mục tiêu thành thói quen thực tế. Gói được tự động gia hạn và có thể hủy bất cứ lúc nào.</p>
        <div className="benefit-list">
          <div><CheckCircle2 /><span><strong>Thực đơn cá nhân hóa</strong><small>Recipe, định lượng và dinh dưỡng chi tiết</small></span></div>
          <div><CheckCircle2 /><span><strong>AI Health Insight đầy đủ</strong><small>Quan sát và đề xuất dựa trên hồ sơ hiện hành</small></span></div>
          <div><CheckCircle2 /><span><strong>Làm mới mỗi tuần</strong><small>Nhận kế hoạch mới khi gói còn hiệu lực</small></span></div>
        </div>

        {!hasActiveAccess ? (
          <div className="subscription-trial-card">
            <div>
              <strong>Dùng thử Plus 7 ngày</strong>
              <span>Không cần thẻ · chỉ áp dụng một lần cho mỗi tài khoản</span>
            </div>
            <button className="button button--dark" disabled={startingTrial || checkingOut} onClick={() => void startTrial()}>
              {startingTrial ? <LoaderCircle className="spin" size={17} /> : <Sparkles size={17} />}
              {startingTrial ? "Đang kích hoạt…" : "Bắt đầu dùng thử"}
            </button>
          </div>
        ) : null}

        {loading && <div className="subscription-loading"><LoaderCircle className="spin" /><span>Đang tải bảng giá…</span></div>}
        {!loading && plans.length > 0 && <div className="subscription-options" aria-label="Chọn thời hạn subscription">
          {plans.map((plan) => (
            <button type="button" key={plan.id} className={`subscription-option ${selectedId === plan.id ? "subscription-option--active" : ""}`} onClick={() => { setSelectedId(plan.id); idempotencyKey.current = ""; }}>
              {plan.code === "monthly" && <span className="subscription-option__badge">Phổ biến</span>}
              <strong>{planDuration(plan)}</strong>
              <b>{formatPrice(plan.price_amount, plan.currency)}</b>
              <small>{plan.code === "quarterly" ? "Tiết kiệm nhất" : plan.description}</small>
            </button>
          ))}
        </div>}

        {selectedPlan && <div className="subscription-price"><div><strong>{formatPrice(selectedPlan.price_amount, selectedPlan.currency)}</strong><span> / {planDuration(selectedPlan)}</span></div><small>Tự động gia hạn mỗi {planDuration(selectedPlan)} · Có thể tắt trong Cài đặt · Không bao gồm tiền món bếp</small></div>}
        {error && <div className="subscription-error"><AlertCircle size={17} /><span>{error}</span></div>}
        <button className="button button--cream button--full" disabled={!selectedPlan || checkingOut || startingTrial} onClick={() => void checkout()}>
          {checkingOut ? <LoaderCircle className="spin" size={18} /> : <LockKeyhole size={18} />}
          {checkingOut ? "Đang mở cổng thanh toán…" : selectedPlan ? `Đăng ký gói ${planDuration(selectedPlan)}` : "Chọn một gói"}
          {!checkingOut && <ArrowRight size={18} />}
        </button>
        <small className="demo-caption">Thanh toán được xử lý bảo mật bởi Stripe. NutriPlan không lưu thông tin thẻ.</small>
      </div>
    </Modal>
  );
}
