"use client";

import Link from "next/link";
import {
  Bot,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  LoaderCircle,
  LogOut,
  Save,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  createBillingPortal,
  cancelCurrentSubscription,
  getCurrentSubscription,
  getSettings,
  resumeCurrentSubscription,
  SettingsApiError,
  type CurrentSubscription,
  updateSettings
} from "./settings-api";

function formatDate(value: string | null | undefined) {
  if (!value) return "Chưa có";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}

function readError(error: unknown) {
  if (error instanceof SettingsApiError) return error.message;
  return error instanceof Error ? error.message : "Đã có lỗi xảy ra.";
}

export function SettingsPage({ onChangePlan }: { onChangePlan: () => void }) {
  const [assistantName, setAssistantName] = useState("Nutri");
  const [savedName, setSavedName] = useState("Nutri");
  const [subscription, setSubscription] = useState<CurrentSubscription>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [resuming, setResuming] = useState(false);
  const [confirmCancellation, setConfirmCancellation] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    void Promise.all([getSettings(), getCurrentSubscription()])
      .then(([settings, current]) => {
        if (!active) return;
        setAssistantName(settings.assistantName);
        setSavedName(settings.assistantName);
        setSubscription(current);
      })
      .catch((requestError) => {
        if (active) setError(readError(requestError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const active = Boolean(
    subscription &&
      ["active", "cancel_at_period_end"].includes(subscription.status) &&
      subscription.current_period_end &&
      new Date(subscription.current_period_end) > new Date()
  );
  const remainingDays = useMemo(() => {
    if (!active || !subscription?.current_period_end) return 0;
    return Math.max(
      1,
      Math.ceil(
        (new Date(subscription.current_period_end).getTime() - Date.now()) /
          86_400_000
      )
    );
  }, [active, subscription]);
  const trialing = active && subscription?.provider === "internal_trial";
  const cancellationScheduled =
    active &&
    (subscription?.status === "cancel_at_period_end" ||
      subscription?.cancel_at_period_end === true);
  const stripeRecurring = Boolean(
    subscription?.provider === "stripe" &&
      subscription.provider_subscription_id?.startsWith("sub_")
  );
  const autoRenewing = active && stripeRecurring && !cancellationScheduled;
  const needsLogin = error.toLowerCase().includes("đăng nhập");

  async function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const result = await updateSettings(assistantName);
      setAssistantName(result.assistantName);
      setSavedName(result.assistantName);
      setSaved(true);
      window.dispatchEvent(
        new CustomEvent("nutriplan:assistant-name", {
          detail: { assistantName: result.assistantName }
        })
      );
    } catch (requestError) {
      setError(readError(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function openPortal() {
    setOpeningPortal(true);
    setError("");
    try {
      const result = await createBillingPortal();
      window.location.assign(result.url);
    } catch (requestError) {
      if (requestError instanceof SettingsApiError && requestError.status === 401) {
        window.location.assign(
          `/login?next=${encodeURIComponent("/app?settings=billing")}`
        );
        return;
      }
      setError(readError(requestError));
      setOpeningPortal(false);
    }
  }

  async function signOut() {
    setSigningOut(true);
    setError("");

    try {
      const supabase = createClient();
      const { error: signOutError } = await supabase.auth.signOut({
        scope: "local"
      });

      if (signOutError) throw signOutError;
      window.location.replace("/");
    } catch (signOutError) {
      setError(
        signOutError instanceof Error
          ? signOutError.message
          : "Không thể đăng xuất. Vui lòng thử lại."
      );
      setSigningOut(false);
    }
  }

  async function cancelSubscription() {
    setCancelling(true);
    setError("");
    try {
      const nextSubscription = await cancelCurrentSubscription();
      setSubscription(nextSubscription);
      setConfirmCancellation(false);
    } catch (requestError) {
      setError(readError(requestError));
    } finally {
      setCancelling(false);
    }
  }

  async function resumeSubscription() {
    setResuming(true);
    setError("");
    try {
      const nextSubscription = await resumeCurrentSubscription();
      setSubscription(nextSubscription);
    } catch (requestError) {
      setError(readError(requestError));
    } finally {
      setResuming(false);
    }
  }

  return (
    <div className="page-content settings-page">
      <header className="page-title settings-title">
        <div>
          <span className="section-kicker">TÀI KHOẢN NUTRIPLAN</span>
          <h1>Cài đặt</h1>
          <p>Tùy chỉnh trợ lý, quản lý quyền truy cập và thông tin thanh toán.</p>
        </div>
      </header>

      {loading ? (
        <div className="settings-loading"><LoaderCircle className="spin" /> Đang tải cài đặt…</div>
      ) : (
        <div className="settings-grid">
          <section className="settings-card settings-card--assistant">
            <div className="settings-card__head">
              <span><Bot size={20} /></span>
              <div>
                <h2>Tên trợ lý ảo</h2>
                <p>Tên này xuất hiện trong hội thoại và được Gemini dùng khi trả lời.</p>
              </div>
            </div>
            <div className="assistant-name-preview">
              <span><Bot size={18} /></span>
              <div><strong>{assistantName.trim() || "Nutri"}</strong><p>Mình có thể giúp bạn lên kế hoạch bữa ăn hôm nay.</p></div>
            </div>
            <form className="settings-form" onSubmit={saveName}>
              <label htmlFor="assistant-name">Tên hiển thị</label>
              <div>
                <input
                  id="assistant-name"
                  maxLength={32}
                  minLength={2}
                  onChange={(event) => {
                    setAssistantName(event.target.value);
                    setSaved(false);
                  }}
                  placeholder="Ví dụ: Nutri"
                  required
                  value={assistantName}
                />
                <button
                  className="button button--dark"
                  disabled={saving || assistantName.trim() === savedName}
                  type="submit"
                >
                  {saving ? <LoaderCircle className="spin" size={17} /> : <Save size={17} />}
                  {saving ? "Đang lưu…" : "Lưu tên"}
                </button>
              </div>
              <small>{assistantName.length}/32 ký tự</small>
              {saved && <span className="settings-success"><CheckCircle2 size={15} /> Đã cập nhật tên trợ lý.</span>}
            </form>
          </section>

          <section className="settings-card">
            <div className="settings-card__head">
              <span><Sparkles size={20} /></span>
              <div><h2>Gói subscription</h2><p>Theo dõi và gia hạn quyền truy cập NutriPlan Plus.</p></div>
            </div>
            <div className={`subscription-summary ${active ? "is-active" : ""}`}>
              <div>
                <span className="subscription-summary__status">
                  {cancellationScheduled ? "ĐÃ TẮT TỰ ĐỘNG GIA HẠN" : autoRenewing ? "TỰ ĐỘNG GIA HẠN" : trialing ? "ĐANG DÙNG THỬ" : active ? "ĐANG HOẠT ĐỘNG" : "TÀI KHOẢN MIỄN PHÍ"}
                </span>
                <h3>{active ? subscription?.subscription_plans?.name ?? "NutriPlan Plus" : "NutriPlan Free"}</h3>
                <p>
                  {active
                    ? `${cancellationScheduled ? "Còn quyền truy cập" : trialing ? "Dùng thử" : "Còn"} ${remainingDays} ngày · hiệu lực đến ${formatDate(subscription?.current_period_end)}`
                    : "Nâng cấp để xem recipe chi tiết và sử dụng đầy đủ AI Insight."}
                </p>
              </div>
              {active && <CheckCircle2 size={27} />}
            </div>
            <p className="settings-note">
              {cancellationScheduled
                ? `Tự động gia hạn đã tắt. Bạn vẫn dùng Plus đến hết ngày ${formatDate(subscription?.current_period_end)}.`
                : autoRenewing
                  ? `Stripe sẽ tự động gia hạn vào cuối kỳ hiện tại (${formatDate(subscription?.current_period_end)}). Bạn có thể tắt bất cứ lúc nào.`
                  : "Gói hiện tại là gói theo thời hạn và không tự động gia hạn."}
            </p>
            <div className="settings-subscription-actions">
              <button className="button button--dark" onClick={onChangePlan}>
                <Sparkles size={17} /> {active ? "Chọn gói mới" : "Chọn gói Plus"}
              </button>
              {cancellationScheduled && stripeRecurring && (
                <button className="button button--dark" disabled={resuming} onClick={() => void resumeSubscription()} type="button">
                  {resuming ? <LoaderCircle className="spin" size={17} /> : <Sparkles size={17} />}
                  {resuming ? "Đang bật lại…" : "Bật lại tự động gia hạn"}
                </button>
              )}
              {active && !cancellationScheduled && (
                <button
                  className="button button--danger-outline"
                  disabled={cancelling}
                  onClick={() => setConfirmCancellation(true)}
                  type="button"
                >
                  {autoRenewing ? "Tắt tự động gia hạn" : "Hủy gói"}
                </button>
              )}
            </div>
            {confirmCancellation && (
              <div className="subscription-cancel-confirm" role="alert">
                <div>
                  <strong>{autoRenewing ? "Tắt tự động gia hạn?" : "Xác nhận hủy gói?"}</strong>
                  <p>Stripe sẽ không thu kỳ tiếp theo. Bạn vẫn sử dụng đầy đủ tính năng Plus đến {formatDate(subscription?.current_period_end)}.</p>
                </div>
                <div>
                  <button className="button button--ghost" disabled={cancelling} onClick={() => setConfirmCancellation(false)} type="button">Giữ gói</button>
                  <button className="button button--danger" disabled={cancelling} onClick={() => void cancelSubscription()} type="button">
                    {cancelling ? <LoaderCircle className="spin" size={17} /> : null}
                    {cancelling ? "Đang cập nhật…" : autoRenewing ? "Tắt gia hạn" : "Xác nhận hủy"}
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="settings-card">
            <div className="settings-card__head">
              <span><CreditCard size={20} /></span>
              <div><h2>Phương thức thanh toán</h2><p>Thẻ và lịch sử thanh toán được bảo mật bởi Stripe.</p></div>
            </div>
            <div className="payment-security">
              <ShieldCheck size={22} />
              <div>
                <strong>NutriPlan không lưu số thẻ</strong>
                <p>Bạn sẽ được chuyển sang Stripe Customer Portal để thêm, xóa hoặc đổi thẻ.</p>
              </div>
            </div>
            <button
              className="button button--outline"
              disabled={openingPortal}
              onClick={() => void openPortal()}
            >
              {openingPortal ? <LoaderCircle className="spin" size={17} /> : <ExternalLink size={17} />}
              {openingPortal ? "Đang mở Stripe…" : "Quản lý phương thức thanh toán"}
            </button>
            {process.env.NEXT_PUBLIC_STRIPE_TEST_MODE === "true" && (
              <small className="settings-test-mode">Stripe Test mode · không thu tiền thật</small>
            )}
          </section>

        </div>
      )}

      {!loading && (
        <button
          className="button button--outline settings-logout-button"
          disabled={signingOut}
          onClick={() => void signOut()}
          type="button"
        >
          {signingOut ? <LoaderCircle className="spin" size={17} /> : <LogOut size={17} />}
          {signingOut ? "Đang đăng xuất…" : "Đăng xuất"}
        </button>
      )}

      {error && (
        <div className="settings-error">
          <span>{error}</span>
          {needsLogin && <Link href="/login?next=/app">Đăng nhập</Link>}
        </div>
      )}
    </div>
  );
}
