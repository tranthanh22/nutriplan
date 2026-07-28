"use client";

import { CheckCircle2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { getSession, signOut } from "@/features/onboarding/onboarding.service";

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
  const [loadingProfile, setLoadingProfile] = useState(true);

  const loadProfileFromBackend = useCallback(async () => {
    try {
      const session = await getSession();
      if (!session) {
        setLoadingProfile(false);
        return;
      }
      const email = session.user.email;
      const rawName = email ? email.split("@")[0] : "Người dùng";
      const formattedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

      let fetchedName = formattedName;
      let gender = defaultProfile.gender;
      let height = defaultProfile.height;
      let weight = defaultProfile.weight;
      let goal = defaultProfile.goal;
      let activity = defaultProfile.activity;
      let allergies = defaultProfile.allergies;
      let age = defaultProfile.age;

      let dietaryPreferences: string[] = ["standard"];

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
          dietary_preferences?: string[];
          disliked_ingredients?: string[];
          birth_date?: string;
        }>('/nutrition-profiles/current', session.access_token);

        if (nutProfile) {
          if (nutProfile.gender === 'male' || nutProfile.gender === 'female') gender = nutProfile.gender;
          if (nutProfile.height_cm) height = Number(nutProfile.height_cm);
          if (nutProfile.weight_kg) weight = Number(nutProfile.weight_kg);
          
          if (nutProfile.goal === 'lose_weight') goal = 'lose';
          else if (nutProfile.goal === 'gain_muscle') goal = 'gain';
          else if (nutProfile.goal === 'maintain') goal = 'maintain';

          if (nutProfile.activity_level === 'sedentary') activity = 1.2;
          else if (nutProfile.activity_level === 'light') activity = 1.375;
          else if (nutProfile.activity_level === 'moderate') activity = 1.55;
          else if (nutProfile.activity_level === 'active' || nutProfile.activity_level === 'very_active') activity = 1.725;

          if (Array.isArray(nutProfile.dietary_preferences) && nutProfile.dietary_preferences.length > 0) {
            dietaryPreferences = nutProfile.dietary_preferences;
          }

          if (Array.isArray(nutProfile.disliked_ingredients) && nutProfile.disliked_ingredients.length > 0) {
            allergies = nutProfile.disliked_ingredients.join(', ');
          } else {
            allergies = "";
          }

          if (nutProfile.birth_date) {
            const birthYear = new Date(nutProfile.birth_date).getFullYear();
            if (!isNaN(birthYear)) {
              age = new Date().getFullYear() - birthYear;
            }
          }
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
        allergies,
        dietaryPreferences,
        age: age > 0 ? age : prev.age,
      }));
    } finally {
      setLoadingProfile(false);
    }
  }, []);

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
    loadProfileFromBackend();
    setHydrated(true);
  }, [loadProfileFromBackend]);

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

  const handleLogout = () => {
    signOut();
    window.localStorage.removeItem("nutriplan-demo");
    window.location.href = "/";
  };

  return (
    <div className="app-shell">
      <AppNavigation
        view={view}
        profile={profile}
        subscribed={subscribed}
        mobileOpen={mobileOpen}
        loadingProfile={loadingProfile}
        onNavigate={navigate}
        onOpenMobile={() => setMobileOpen(true)}
        onCloseMobile={() => setMobileOpen(false)}
        onOpenProfile={() => setProfileOpen(true)}
        onSubscribe={() => setSubscribeOpen(true)}
        onLogout={handleLogout}
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
          onSave={async (next) => {
            setProfile(next);
            setProfileOpen(false);
            setToast("Hồ sơ và mục tiêu dinh dưỡng đã được cập nhật.");

            try {
              const session = await getSession();
              if (session) {
                // 1. Update user profile name
                await apiClient.patch('/profiles/me', { fullName: next.name }, session.access_token);

                // 2. Map activity & goal for nutrition profile API
                let activityLevel = 'moderate';
                if (next.activity <= 1.2) activityLevel = 'sedentary';
                else if (next.activity <= 1.4) activityLevel = 'light';
                else if (next.activity <= 1.6) activityLevel = 'moderate';
                else activityLevel = 'active';

                let goal = 'maintain';
                if (next.goal === 'lose') goal = 'lose_weight';
                else if (next.goal === 'gain') goal = 'gain_muscle';

                const birthYear = new Date().getFullYear() - (next.age || 25);
                const birthDate = `${birthYear}-01-01`;
                const dislikedIngredients = next.allergies
                  ? next.allergies.split(',').map((s) => s.trim()).filter(Boolean)
                  : [];

                await apiClient.post(
                  '/nutrition-profiles',
                  {
                    gender: next.gender,
                    birthDate,
                    heightCm: next.height,
                    weightKg: next.weight,
                    activityLevel,
                    goal,
                    dietaryPreferences: next.dietaryPreferences || ['standard'],
                    dislikedIngredients,
                  },
                  session.access_token,
                );
                await loadProfileFromBackend();
              }
            } catch {
              // Local state updated fallback
            }
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
