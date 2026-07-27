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
import { apiClient } from "@/lib/api-client";
import { getSession } from "@/features/onboarding/onboarding.service";

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
    // 1. Restore local storage demo state if any
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

    // 2. Load authenticated user profile from NestJS REST API
    getSession().then(async (session) => {
      if (!session) return;
      const email = session.user.email;
      const rawName = email ? email.split("@")[0] : "Người dùng";
      const formattedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

      let fetchedName = formattedName;
      let gender = defaultProfile.gender;
      let height = defaultProfile.height;
      let weight = defaultProfile.weight;
      let goal = defaultProfile.goal;
      let activity = defaultProfile.activity;

      try {
        const userProfile = await apiClient.get<{ full_name?: string }>('/profiles/me', session.access_token);
        if (userProfile?.full_name) {
          fetchedName = userProfile.full_name;
        }
      } catch {
        // Fallback to email name
      }

      try {
        const nutProfile = await apiClient.get<{
          gender?: string;
          height_cm?: number | string;
          weight_kg?: number | string;
          goal?: string;
          activity_level?: string;
        }>('/nutrition-profiles/current', session.access_token);

        if (nutProfile) {
          if (nutProfile.gender === 'male' || nutProfile.gender === 'female') gender = nutProfile.gender;
          if (nutProfile.height_cm) height = Number(nutProfile.height_cm);
          if (nutProfile.weight_kg) weight = Number(nutProfile.weight_kg);
          if (nutProfile.goal === 'lose_weight') goal = 'lose';
          else if (nutProfile.goal === 'gain_muscle') goal = 'gain';
          else if (nutProfile.goal === 'maintain') goal = 'maintain';
        }
      } catch {
        // Keep default
      }

      setProfile((prev) => ({
        ...prev,
        name: fetchedName,
        gender,
        height,
        weight,
        goal: goal as Profile['goal'],
        activity,
      }));
    });

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

  const activateDemo = (_planCode: string, planName: string) => {
    setSubscribed(true);
    setSubscribeOpen(false);
    setToast(`Gói subscription ${planName} đã được kích hoạt trong bản demo.`);
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
      {subscribeOpen && <SubscriptionModal onClose={() => setSubscribeOpen(false)} onActivate={activateDemo} />}
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
