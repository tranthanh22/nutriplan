import { z } from 'zod';

export const AiHealthInputSchema = z
  .object({
    age: z.number().int().min(16).max(100),
    gender: z.enum(['male', 'female']),
    height_cm: z.number().min(80).max(250),
    weight_kg: z.number().min(20).max(400),
    activity_level: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
    goal: z.enum(['lose_weight', 'maintain', 'gain_muscle']),
    dietary_preferences: z.array(z.string().max(100)).max(20),
    disliked_ingredients: z.array(z.string().max(100)).max(50),
    bmr_kcal: z.number().min(500).max(5000),
    tdee_kcal: z.number().min(600).max(10000),
    target_calories_kcal: z.number().min(1200).max(10000),
    target_protein_g: z.number().min(0).max(500),
    target_carbs_g: z.number().min(0).max(1000),
    target_fat_g: z.number().min(0).max(500),
    formula_version: z.string().min(1).max(100),
  })
  .superRefine((input, context) => {
    if (input.tdee_kcal < input.bmr_kcal) {
      context.addIssue({
        code: 'custom',
        path: ['tdee_kcal'],
        message: 'TDEE phải lớn hơn hoặc bằng BMR',
      });
    }

    const macroCalories =
      input.target_protein_g * 4 + input.target_carbs_g * 4 + input.target_fat_g * 9;
    const ratio = macroCalories / input.target_calories_kcal;
    if (ratio < 0.8 || ratio > 1.2) {
      context.addIssue({
        code: 'custom',
        path: ['target_calories_kcal'],
        message: 'Tổng năng lượng từ macro lệch quá 20% so với calorie mục tiêu',
      });
    }
  });

export type AiHealthInput = z.infer<typeof AiHealthInputSchema>;
