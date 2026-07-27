// ────────────────────────────────────────────────────────────
//  Onboarding types — mirrors the real Supabase DB schema
// ────────────────────────────────────────────────────────────

/** Gender values accepted by the nutrition_profiles RPC */
export type Gender = 'male' | 'female';

/** Activity level values accepted by the nutrition_profiles RPC */
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

/** Goal values accepted by the nutrition_profiles RPC */
export type NutritionGoal = 'lose_weight' | 'maintain' | 'gain_muscle';

/** Generic selectable option returned from Supabase lookup tables */
export interface SelectOption {
  id: string;
  label: string;
}

/** Allergen row from the `allergens` table */
export interface AllergenOption {
  id: string;
  code: string;
  name: string;
  description: string | null;
}

/** All data collected across the onboarding wizard */
export interface OnboardingData {
  // Step 1
  email: string;
  password: string;

  // Step 3 – demographics
  heightCm: number;
  weightKg: number;
  gender: Gender;
  activityLevel: ActivityLevel;
  birthDate: string; // YYYY-MM-DD

  // Step 4 – goal
  goal: NutritionGoal;

  // Step 5 – dietary preference labels (e.g. 'vegan', 'keto')
  dietaryPreferences: string[];

  // Step 6 – liked meal types (free-text labels stored to disliked_ingredients complement)
  likedMealTypes: string[];

  // Step 7 – allergen / disliked ingredient codes or names
  dislikedIngredients: string[];
}
