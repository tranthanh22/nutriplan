export interface NutritionProfileRecord {
  id: string;
  user_id: string;
  version: number;
  gender: string;
  birth_date: string;
  height_cm: number | string;
  weight_kg: number | string;
  activity_level: string;
  goal: string;
  dietary_preferences: string[];
  disliked_ingredients: string[];
  medical_notes: string | null;
  bmr_kcal: number | string;
  tdee_kcal: number | string;
  target_calories_kcal: number | string;
  target_protein_g: number | string;
  target_carbs_g: number | string;
  target_fat_g: number | string;
  formula_code: string;
  formula_version: string;
  is_current: boolean;
  calculated_at: string;
  created_at: string;
}
