export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export type PlanDish = {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  image_path: string | null;
  prep_time_minutes: number | null;
  dish_kind: "meal" | "snack" | "drink";
  dish_nutrition?:
    | DishMicronutrients
    | DishMicronutrients[]
    | null;
};

export type DishMicronutrients = {
  fiber_g: number | string | null;
  sodium_mg: number | string | null;
  cholesterol_mg: number | string | null;
  potassium_mg: number | string | null;
  calcium_mg: number | string | null;
  iron_mg: number | string | null;
  magnesium_mg: number | string | null;
  vitamin_a_mcg: number | string | null;
  vitamin_c_mg: number | string | null;
  vitamin_d_mcg: number | string | null;
  vitamin_b12_mcg: number | string | null;
};

export type PersonalMealItem = {
  id: string;
  planned_date: string;
  meal_type: MealType;
  sequence_no: number;
  servings: number | string;
  calories_kcal: number | string;
  protein_g: number | string;
  carbs_g: number | string;
  fat_g: number | string;
  is_replacement: boolean;
  consumption_status: "planned" | "eaten";
  consumed_at: string | null;
  dishes: PlanDish;
};

export type PersonalPlan = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  target_calories_kcal: number | string;
  target_protein_g: number | string;
  target_carbs_g: number | string;
  target_fat_g: number | string;
  meal_plan_items: PersonalMealItem[];
};

export type KitchenMeal = {
  id: string;
  delivery_date: string;
  meal_type: MealType;
  status:
    | "scheduled"
    | "accepted"
    | "preparing"
    | "out_for_delivery"
    | "delivered";
  delivery_window_start: string | null;
  delivery_window_end: string | null;
  delivered_at: string | null;
  kitchens: { id: string; name: string; slug: string; logo_path: string | null };
  daily_order_items: Array<{
    id: string;
    dish_id: string | null;
    dish_name: string;
    image_path: string | null;
    ingredient_snapshot: string[];
    servings: number | string;
    calories_kcal: number | string;
    protein_g: number | string;
    carbs_g: number | string;
    fat_g: number | string;
    kitchen_meal_change_requests: KitchenMealChangeRequest[];
  }>;
  meal_log_entries: Array<{
    id: string;
    daily_order_item_id: string | null;
    consumed_at: string;
  }>;
};

export type KitchenMealChangeRequest = {
  id: string;
  reason: "allergy_concern" | "dislike" | "diet_preference" | "other";
  note: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled";
  response_note: string | null;
  created_at: string;
};

export type BackendJournalEntry = {
  id: string;
  source: "recipe" | "kitchen" | "image_estimate" | "manual";
  consumed_at: string;
  meal_type: MealType;
  name: string;
  calories_kcal: number | string;
  protein_g: number | string;
  carbs_g: number | string;
  fat_g: number | string;
  dish_id?: string | null;
  meal_plan_item_id?: string | null;
  daily_order_id?: string | null;
  daily_order_item_id?: string | null;
};

export type JournalEntryDetail = BackendJournalEntry & {
  servings: number;
  image_path: string | null;
  description: string | null;
  ingredients: string[];
  instructions: string[];
  cooking_tips: string | null;
};

export type MyMenusResponse = {
  subscriptionActive: boolean;
  personalPlanUnavailableReason: string | null;
  range: { from: string; to: string };
  personalPlan: PersonalPlan | null;
  kitchenMeals: KitchenMeal[];
  journal: BackendJournalEntry[];
};

export type ReplacementCandidate = {
  dish_id: string;
  name: string;
  short_description: string | null;
  image_path: string | null;
  prep_time_minutes: number | null;
  servings: number | string;
  calories_kcal: number | string;
  protein_g: number | string;
  carbs_g: number | string;
  fat_g: number | string;
  projected_calories_kcal: number | string;
  projected_protein_g: number | string;
  projected_carbs_g: number | string;
  projected_fat_g: number | string;
  balance_score: number;
};
