"use client";

import { CheckCircle2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppNavigation } from "@/components/layout/app-navigation";
import { DashboardPage } from "@/features/dashboard/dashboard-page";
import { ImageAnalysisModal } from "@/features/image-analysis/image-analysis-modal";
import { JournalPage } from "@/features/journal/journal-page";
import { KitchenPage } from "@/features/kitchens/kitchen-page";
import { OrderModal } from "@/features/kitchens/order-modal";
import { MealPlanPage } from "@/features/meal-plan/meal-plan-page";
import { MealModal } from "@/features/meals/meal-modal";
import { ProfileModal } from "@/features/profile/profile-modal";
import { SubscriptionModal } from "@/features/subscription/subscription-modal";
import type { KitchenOffer, Meal } from "@/lib/data";
import { calculateNutrition, defaultProfile, initialJournal, mealToEntry } from "@/lib/nutrition";
import type { JournalEntry, Profile, View } from "@/types/app";

export function NutriPlanApp() {
  const [view, setView] = useState<View>("home");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [subscribed, setSubscribed] = useState(false);
  const [journal, setJournal] = useState<JournalEntry[]>(initialJournal);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<KitchenOffer | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const checkoutConfirmed =
      window.sessionStorage.getItem("nutriplan-checkout-confirmed") === "true";
    const saved = window.localStorage.getItem("nutriplan-demo");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as {
          profile?: Profile;
          subscribed?: boolean;
          journal?: JournalEntry[];
        };
        if (parsed.profile) setProfile(parsed.profile);
        if (typeof parsed.subscribed === "boolean") setSubscribed(parsed.subscribed);
        if (parsed.journal) setJournal(parsed.journal);
      } catch {
        window.localStorage.removeItem("nutriplan-demo");
      }
    }
    if (checkoutConfirmed) setSubscribed(true);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem("nutriplan-demo", JSON.stringify({ profile, subscribed, journal }));
  }, [profile, subscribed, journal, hydrated]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    let cancelled = false;
    const checkoutStatus = new URLSearchParams(window.location.search).get("checkout");

    async function refreshSubscription(attempt = 0) {
      try {
        const response = await fetch("/api/subscriptions/current", { cache: "no-store" });
        if (!response.ok) return;
        const current = await response.json() as { status?: string; current_period_end?: string } | null;
        const active = Boolean(
          current &&
          ["active", "cancel_at_period_end"].includes(current.status ?? "") &&
          current.current_period_end &&
          new Date(current.current_period_end) > new Date()
        );
        if (cancelled) return;
        if (!active && checkoutStatus === "success" && attempt < 5) {
          window.setTimeout(() => void refreshSubscription(attempt + 1), 1200);
          return;
        }
        setSubscribed(active);
        if (active && checkoutStatus === "success") {
          window.sessionStorage.removeItem("nutriplan-checkout-confirmed");
          setToast("Thanh toán thành công. NutriPlan Plus đã được kích hoạt.");
          window.history.replaceState({}, "", window.location.pathname);
          return;
        }
        if (!active && checkoutStatus === "success") {
          window.sessionStorage.removeItem("nutriplan-checkout-confirmed");
        }
      } catch {
        // Giữ trạng thái local khi backend chưa chạy hoặc người dùng chưa đăng nhập.
      }
    }

    if (checkoutStatus === "cancelled") {
      setToast("Bạn đã hủy thanh toán. Chưa có khoản phí nào được ghi nhận.");
      window.history.replaceState({}, "", window.location.pathname);
    }
    void refreshSubscription();
    return () => {
      cancelled = true;
    };
  }, []);

  const nutrition = useMemo(() => calculateNutrition(profile), [profile]);
  const consumed = useMemo(
    () =>
      journal.reduce(
        (sum, item) => ({
          calories: sum.calories + item.calories,
          protein: sum.protein + item.protein,
          carbs: sum.carbs + item.carbs,
          fat: sum.fat + item.fat
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      ),
    [journal]
  );

  const navigate = (next: View) => {
    setView(next);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const addMeal = (meal: Meal, source: JournalEntry["source"] = "Kế hoạch") => {
    setJournal((current) => [...current, mealToEntry(meal, source)]);
    setToast(`Đã ghi “${meal.name}” vào nhật ký hôm nay.`);
    setSelectedMeal(null);
  };

  return (
    <div className="app-shell">
      <AppNavigation
        view={view}
        profile={profile}
        subscribed={subscribed}
        mobileOpen={mobileOpen}
        onNavigate={navigate}
        onOpenMobile={() => setMobileOpen(true)}
        onCloseMobile={() => setMobileOpen(false)}
        onOpenProfile={() => setProfileOpen(true)}
        onSubscribe={() => setSubscribeOpen(true)}
      >
        {view === "home" && (
          <DashboardPage
            profile={profile}
            nutrition={nutrition}
            consumed={consumed}
            subscribed={subscribed}
            onEdit={() => setProfileOpen(true)}
            onGo={navigate}
            onMeal={setSelectedMeal}
            onSubscribe={() => setSubscribeOpen(true)}
          />
        )}
        {view === "plan" && (
          <MealPlanPage
            subscribed={subscribed}
            onSubscribe={() => setSubscribeOpen(true)}
            onMeal={setSelectedMeal}
            onAdd={addMeal}
          />
        )}
        {view === "kitchens" && <KitchenPage subscribed={subscribed} onOrder={setSelectedOffer} />}
        {view === "journal" && (
          <JournalPage
            subscribed={subscribed}
            journal={journal}
            nutrition={nutrition}
            consumed={consumed}
            onAnalyze={() => subscribed ? setImageOpen(true) : setSubscribeOpen(true)}
            onSubscribe={() => setSubscribeOpen(true)}
          />
        )}
      </AppNavigation>

      {selectedMeal && (
        <MealModal
          meal={selectedMeal}
          subscribed={subscribed}
          onClose={() => setSelectedMeal(null)}
          onSubscribe={() => {
            setSelectedMeal(null);
            setSubscribeOpen(true);
          }}
          onAdd={() => addMeal(selectedMeal)}
        />
      )}
      {selectedOffer && (
        <OrderModal
          offer={selectedOffer}
          subscribed={subscribed}
          onClose={() => setSelectedOffer(null)}
          onComplete={() => {
            setSelectedOffer(null);
            setToast("Đặt món thành công. Bếp đã nhận yêu cầu của bạn.");
          }}
        />
      )}
      {profileOpen && (
        <ProfileModal
          value={profile}
          onClose={() => setProfileOpen(false)}
          onSave={(next) => {
            setProfile(next);
            setProfileOpen(false);
            setToast("Hồ sơ và mục tiêu dinh dưỡng đã được cập nhật.");
          }}
        />
      )}
      {subscribeOpen && <SubscriptionModal onClose={() => setSubscribeOpen(false)} />}
      {imageOpen && (
        <ImageAnalysisModal
          onClose={() => setImageOpen(false)}
          onConfirm={(entry) => {
            setJournal((items) => [...items, entry]);
            setImageOpen(false);
            setToast("Đã xác nhận kết quả và thêm vào Meal Log.");
          }}
        />
      )}
      {toast && <div className="toast"><CheckCircle2 size={19} /><span>{toast}</span></div>}
    </div>
  );
}
