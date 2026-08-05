import type { Meal } from "@/lib/data";
import type { JournalEntry, Profile } from "@/types/app";

export const defaultProfile: Profile = {
  name: "Bạn",
  gender: "female",
  age: 24,
  height: 162,
  weight: 58,
  activity: 1.55,
  goal: "lose",
  targetWeight: 53,
  goalDurationWeeks: 12,
  allergies: "Không có"
};

export function calculateNutrition(profile: Profile) {
  const bmr =
    profile.gender === "male"
      ? 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5
      : 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;
  const tdee = Math.round(bmr * profile.activity);
  const weeklyWeightDelta =
    (profile.targetWeight - profile.weight) / profile.goalDurationWeeks;
  const estimatedDailyAdjustment = (weeklyWeightDelta * 7700) / 7;
  const adjustment =
    profile.goal === "lose"
      ? Math.max(-750, Math.min(-200, estimatedDailyAdjustment))
      : profile.goal === "gain"
        ? Math.max(150, Math.min(500, estimatedDailyAdjustment))
        : 0;
  const target = Math.round(Math.max(1200, tdee + adjustment));
  const protein = Math.round(profile.weight * (profile.goal === "gain" ? 2 : 1.8));
  const fat = Math.round((target * 0.27) / 9);
  const carbs = Math.round((target - protein * 4 - fat * 9) / 4);

  return {
    bmr: Math.round(bmr),
    tdee,
    target,
    protein,
    carbs,
    fat
  };
}

export function mealToEntry(meal: Meal, source: JournalEntry["source"]): JournalEntry {
  return {
    id: `${meal.id}-${Date.now()}`,
    name: meal.name,
    slot: "Bữa ăn",
    calories: meal.calories,
    protein: meal.protein,
    carbs: meal.carbs,
    fat: meal.fat,
    source,
    time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
  };
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND"
  }).format(value);
}
