"use client";

import { CheckCircle2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppNavigation } from "@/components/layout/app-navigation";
import { AssistantWidget } from "@/features/assistant/assistant-widget";
import { DashboardPage } from "@/features/dashboard/dashboard-page";
import { ImageAnalysisModal } from "@/features/image-analysis/image-analysis-modal";
import { JournalPage } from "@/features/journal/journal-page";
import { KitchenPage } from "@/features/kitchens/kitchen-page";
import { OrderModal } from "@/features/kitchens/order-modal";
import {
  backendLogToJournal,
  confirmPersonalMeal,
  getNutritionJournal
} from "@/features/meal-plan/meal-plan-api";
import { MealPlanPage } from "@/features/meal-plan/meal-plan-page";
import { MealModal } from "@/features/meals/meal-modal";
import { HealthOnboardingModal } from "@/features/onboarding/health-onboarding-modal";
import {
  getMyProfile,
  getOnboardingStatus,
  saveNutritionProfile,
  type NutritionProfile,
  updateMyName
} from "@/features/onboarding/onboarding-api";
import { ProfileReviewBanner } from "@/features/onboarding/profile-review-banner";
import { SubscriptionModal } from "@/features/subscription/subscription-modal";
import { SettingsPage } from "@/features/settings/settings-page";
import type { KitchenOffer, Meal } from "@/lib/data";
import { calculateNutrition, defaultProfile, initialJournal, mealToEntry } from "@/lib/nutrition";
import type { JournalEntry, Profile, View } from "@/types/app";

const ACTIVITY_FACTORS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9
} as const;

function ageFromBirthDate(value: string) {
  const birthDate = new Date(`${value}T00:00:00`);
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  if (
    now.getMonth() < birthDate.getMonth() ||
    (now.getMonth() === birthDate.getMonth() &&
      now.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }
  return age;
}

function profileDetails(profile: NutritionProfile): Partial<Profile> {
  return {
    gender: profile.gender,
    age: ageFromBirthDate(profile.birth_date),
    height: Number(profile.height_cm),
    weight: Number(profile.weight_kg),
    activity: ACTIVITY_FACTORS[profile.activity_level],
    goal:
      profile.goal === "lose_weight"
        ? "lose"
        : profile.goal === "gain_muscle"
          ? "gain"
          : "maintain",
    allergies: profile.food_allergies.join(", ") || "Không có"
  };
}

export function NutriPlanApp() {
  const [view, setView] = useState<View>("home");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [subscribed, setSubscribed] = useState(false);
  const [journal, setJournal] = useState<JournalEntry[]>(initialJournal);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<KitchenOffer | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [nutritionProfile, setNutritionProfile] = useState<NutritionProfile | null>(null);
  const [onboardingRequired, setOnboardingRequired] = useState(false);
  const [profileReviewDue, setProfileReviewDue] = useState(false);
  const [reviewDismissed, setReviewDismissed] = useState(false);
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [menuRevision, setMenuRevision] = useState(0);

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
        if (parsed.profile) {
          setProfile({
            ...parsed.profile,
            name: parsed.profile.name === "Minh Anh" ? "Bạn" : parsed.profile.name
          });
        }
        if (typeof parsed.subscribed === "boolean") setSubscribed(parsed.subscribed);
        if (parsed.journal) setJournal(parsed.journal);
      } catch {
        window.localStorage.removeItem("nutriplan-demo");
      }
    }
    if (checkoutConfirmed) setSubscribed(true);
    if (new URLSearchParams(window.location.search).get("settings") === "billing") {
      setView("settings");
      setToast("Bạn đã quay lại từ trang quản lý thanh toán Stripe.");
      window.history.replaceState({}, "", window.location.pathname);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([
      getOnboardingStatus(),
      getMyProfile().catch(() => null)
    ])
      .then(([status, userProfile]) => {
        if (cancelled) return;
        const storedName = userProfile?.full_name?.trim();
        setNutritionProfile(status.profile);
        setOnboardingRequired(!status.hasProfile);
        setProfileReviewDue(status.reviewDue && status.hasProfile);
        if (!status.hasProfile) setProfileOpen(true);
        if (status.profile) {
          setProfile((current) => ({
            ...current,
            ...profileDetails(status.profile!),
            name: storedName || current.name
          }));
        } else if (storedName) {
          setProfile((current) => ({
            ...current,
            name: storedName
          }));
        }
      })
      .catch(() => {
        // Không khóa ứng dụng khi backend tạm thời không sẵn sàng.
      });
    return () => {
      cancelled = true;
    };
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
    if (!subscribed) return;
    let cancelled = false;
    void getNutritionJournal()
      .then(({ entries }) => {
        if (!cancelled) setJournal(entries.map(backendLogToJournal));
      })
      .catch(() => {
        // Giữ dữ liệu hiện có nếu API tạm thời không sẵn sàng.
      });
    return () => {
      cancelled = true;
    };
  }, [subscribed]);

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

  const addMeal = async (
    meal: Meal,
    source: JournalEntry["source"] = "Kế hoạch"
  ) => {
    if (meal.consumptionStatus === "eaten") {
      setSelectedMeal(null);
      setToast("Bữa ăn này đã được ghi nhận trước đó.");
      return;
    }

    if (meal.mealPlanItemId) {
      const persisted = backendLogToJournal(
        await confirmPersonalMeal(meal.mealPlanItemId)
      );
      setJournal((current) => [
        persisted,
        ...current.filter((item) => item.id !== persisted.id)
      ]);
      setMenuRevision((current) => current + 1);
      setToast(`Đã ghi “${meal.name}” vào nhật ký dinh dưỡng.`);
      setSelectedMeal(null);
      return;
    }

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
        {profileReviewDue && !reviewDismissed && (
          <ProfileReviewBanner
            onReview={() => setProfileOpen(true)}
            onDismiss={() => setReviewDismissed(true)}
          />
        )}
        {view === "home" && (
          <DashboardPage
            profile={profile}
            nutrition={nutrition}
            consumed={consumed}
            subscribed={subscribed}
            menuRevision={menuRevision}
            onEdit={() => setProfileOpen(true)}
            onGo={navigate}
            onMeal={setSelectedMeal}
            onSubscribe={() => setSubscribeOpen(true)}
          />
        )}
        {view === "plan" && (
          <MealPlanPage
            key={`${profile.gender}-${profile.age}-${profile.height}-${profile.weight}-${profile.activity}-${profile.goal}`}
            subscribed={subscribed}
            onSubscribe={() => setSubscribeOpen(true)}
            onEditProfile={() => setProfileOpen(true)}
            onMeal={setSelectedMeal}
            onLogCreated={(entry) => {
              setJournal((items) => [
                entry,
                ...items.filter((item) => item.id !== entry.id)
              ]);
              setMenuRevision((current) => current + 1);
              setToast(`Đã ghi “${entry.name}” vào nhật ký dinh dưỡng.`);
            }}
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
        {view === "settings" && (
          <SettingsPage onChangePlan={() => setSubscribeOpen(true)} />
        )}
      </AppNavigation>

      <AssistantWidget />

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
            setMenuRevision((current) => current + 1);
            setToast("Đặt món thành công. Bếp đã nhận yêu cầu của bạn.");
          }}
        />
      )}
      {profileOpen && (
        <HealthOnboardingModal
          current={nutritionProfile}
          currentName={profile.name}
          required={onboardingRequired}
          onClose={() => setProfileOpen(false)}
          onSave={async (input, fullName) => {
            const [savedProfile, savedUserProfile] = await Promise.all([
              saveNutritionProfile(input),
              updateMyName(fullName)
            ]);
            setNutritionProfile(savedProfile);
            setProfile((current) => ({
              ...current,
              ...profileDetails(savedProfile),
              name: savedUserProfile.full_name?.trim() || fullName
            }));
            setOnboardingRequired(false);
            setProfileReviewDue(false);
            setReviewDismissed(false);
            setMenuRevision((current) => current + 1);
            setProfileOpen(false);
            setToast("Hồ sơ đã lưu. Thực đơn sẽ được tính lại theo mục tiêu mới.");
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
