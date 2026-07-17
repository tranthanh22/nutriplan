export type View = "home" | "plan" | "kitchens" | "journal";

export type Profile = {
  name: string;
  gender: "male" | "female";
  age: number;
  height: number;
  weight: number;
  activity: number;
  goal: "lose" | "maintain" | "gain";
  allergies: string;
};

export type JournalEntry = {
  id: string;
  name: string;
  slot: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source: "Kế hoạch" | "Bếp đối tác" | "Ảnh ước tính" | "Nhập tay";
  time: string;
  image?: string;
};

export type NutritionSummary = {
  bmr: number;
  tdee: number;
  target: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type ConsumedNutrition = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};
