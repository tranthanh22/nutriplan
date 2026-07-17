import type { Meal } from "@/lib/data";
import type { JournalEntry, Profile } from "@/types/app";

export const defaultProfile: Profile = {
  name: "Minh Anh",
  gender: "female",
  age: 24,
  height: 162,
  weight: 58,
  activity: 1.55,
  goal: "lose",
  allergies: "Không có"
};

export const initialJournal: JournalEntry[] = [
  {
    id: "morning-demo",
    name: "Yến mạch xoài sữa chua",
    slot: "Bữa sáng",
    calories: 428,
    protein: 22,
    carbs: 61,
    fat: 11,
    source: "Kế hoạch",
    time: "07:35"
  },
  {
    id: "lunch-demo",
    name: "Ức gà áp chảo & cơm gạo lứt",
    slot: "Bữa trưa",
    calories: 612,
    protein: 48,
    carbs: 67,
    fat: 17,
    source: "Bếp đối tác",
    time: "12:14"
  }
];

export function calculateNutrition(profile: Profile) {
  const bmr =
    profile.gender === "male"
      ? 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5
      : 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;
  const tdee = Math.round(bmr * profile.activity);
  const target = Math.round(tdee + (profile.goal === "lose" ? -350 : profile.goal === "gain" ? 300 : 0));
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
