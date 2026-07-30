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
  Settings2,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  createBillingPortal,
  getCurrentSubscription,
  getSettings,
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

  return (
    <div className="page-content settings-page">
      <header className="page-title settings-title">
        <div>
          <span className="section-kicker">TÀI KHOẢN NUTRIPLAN</span>
          <h1>Cài đặt</h1>
          <p>Tùy chỉnh trợ lý, quản lý quyền truy cập và thông tin thanh toán.</p>
        </div>
        <span className="settings-title__icon"><Settings2 size={24} /></span>
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
                  {active ? "ĐANG HOẠT ĐỘNG" : "TÀI KHOẢN MIỄN PHÍ"}
                </span>
                <h3>{active ? subscription?.subscription_plans?.name ?? "NutriPlan Plus" : "NutriPlan Free"}</h3>
                <p>
                  {active
                    ? `Còn ${remainingDays} ngày · hiệu lực đến ${formatDate(subscription?.current_period_end)}`
                    : "Nâng cấp để xem recipe chi tiết và sử dụng đầy đủ AI Insight."}
                </p>
              </div>
              {active && <CheckCircle2 size={27} />}
            </div>
            <p className="settings-note">
              Gói hiện tại là quyền truy cập theo thời hạn, không tự động gia hạn và
              không thể hủy giữa kỳ.
            </p>
            <button className="button button--dark" onClick={onChangePlan}>
              <Sparkles size={17} /> {active ? "Đổi hoặc gia hạn gói" : "Chọn gói Plus"}
            </button>
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

          <section className="settings-card settings-card--account">
            <div className="settings-card__head">
              <span><LogOut size={20} /></span>
              <div>
                <h2>Đăng xuất</h2>
                <p>Kết thúc phiên NutriPlan trên thiết bị này. Các thiết bị khác vẫn được giữ đăng nhập.</p>
              </div>
            </div>
            <button
              className="button button--outline settings-logout-button"
              disabled={signingOut}
              onClick={() => void signOut()}
              type="button"
            >
              {signingOut ? <LoaderCircle className="spin" size={17} /> : <LogOut size={17} />}
              {signingOut ? "Đang đăng xuất…" : "Đăng xuất"}
            </button>
          </section>
        </div>
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
