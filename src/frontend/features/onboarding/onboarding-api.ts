export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export type NutritionGoal = "lose_weight" | "maintain" | "gain_muscle";

export type NutritionProfile = {
  id: string;
  version: number;
  gender: "male" | "female";
  birth_date: string;
  height_cm: number | string;
  weight_kg: number | string;
  activity_level: ActivityLevel;
  activity_days_per_week: number;
  goal: NutritionGoal;
  target_weight_kg: number | string;
  goal_duration_weeks: number;
  dietary_preferences: string[];
  disliked_ingredients: string[];
  food_allergies: string[];
  food_intolerances: string[];
  medical_notes: string | null;
  calculated_at: string;
  created_at: string;
};

export type NutritionProfileInput = {
  gender: "male" | "female";
  birthDate: string;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  activityDaysPerWeek: number;
  goal: NutritionGoal;
  targetWeightKg: number;
  goalDurationWeeks: number;
  dietaryPreferences: string[];
  dislikedIngredients: string[];
  foodAllergies: string[];
  foodIntolerances: string[];
  medicalNotes?: string;
};

export type OnboardingStatus = {
  hasProfile: boolean;
  reviewDue: boolean;
  nextReviewAt: string | null;
  profile: NutritionProfile | null;
};

export type UserProfile = {
  id: string;
  role: "customer" | "kitchen_staff" | "admin";
  full_name: string | null;
};

async function parseResponse<T>(response: Response): Promise<T> {
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      "message" in payload
        ? Array.isArray(payload.message)
          ? payload.message.join(", ")
          : String(payload.message)
        : "Không thể kết nối NutriPlan API.";
    throw new Error(message);
  }
  return payload as T;
}

export async function getOnboardingStatus() {
  return parseResponse<OnboardingStatus>(
    await fetch("/api/nutrition-profiles/status", { cache: "no-store" })
  );
}

export async function saveNutritionProfile(input: NutritionProfileInput) {
  return parseResponse<NutritionProfile>(
    await fetch("/api/nutrition-profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    })
  );
}

export async function getMyProfile() {
  return parseResponse<UserProfile>(
    await fetch("/api/profiles/me", { cache: "no-store" })
  );
}

export async function updateMyName(fullName: string) {
  return parseResponse<UserProfile>(
    await fetch("/api/profiles/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: fullName.trim() })
    })
  );
}

export function profileToInput(
  profile: NutritionProfile | null
): NutritionProfileInput {
  return {
    gender: profile?.gender ?? "female",
    birthDate: profile?.birth_date ?? "2000-01-01",
    heightCm: Number(profile?.height_cm ?? 165),
    weightKg: Number(profile?.weight_kg ?? 60),
    activityLevel: profile?.activity_level ?? "moderate",
    activityDaysPerWeek: Number(profile?.activity_days_per_week ?? 3),
    goal: profile?.goal ?? "maintain",
    targetWeightKg: Number(profile?.target_weight_kg ?? profile?.weight_kg ?? 60),
    goalDurationWeeks: Number(profile?.goal_duration_weeks ?? 12),
    dietaryPreferences: profile?.dietary_preferences ?? [],
    dislikedIngredients: profile?.disliked_ingredients ?? [],
    foodAllergies: profile?.food_allergies ?? [],
    foodIntolerances: profile?.food_intolerances ?? [],
    medicalNotes: profile?.medical_notes ?? ""
  };
}
