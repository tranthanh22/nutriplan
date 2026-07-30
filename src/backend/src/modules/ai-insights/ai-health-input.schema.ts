import { z } from 'zod';

export const AiHealthInputSchema = z
  .object({
    age: z.number().int().min(16).max(100),
    gender: z.enum(['male', 'female']),
    height_cm: z.number().min(80).max(250),
    weight_kg: z.number().min(20).max(400),
    activity_level: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
    activity_days_per_week: z.number().int().min(0).max(7),
    goal: z.enum(['lose_weight', 'maintain', 'gain_muscle']),
    dietary_preferences: z.array(z.string().max(100)).max(20),
    disliked_ingredients: z.array(z.string().max(100)).max(50),
    food_allergies: z.array(z.string().max(100)).max(30),
    food_intolerances: z.array(z.string().max(100)).max(30),
    bmr_kcal: z.number().min(500).max(5000),
    tdee_kcal: z.number().min(600).max(10000),
    target_calories_kcal: z.number().min(1200).max(10000),
    target_protein_g: z.number().min(0).max(500),
    target_carbs_g: z.number().min(0).max(1000),
    target_fat_g: z.number().min(0).max(500),
    formula_version: z.string().min(1).max(100),
    daily_context: z
      .object({
        checkin_date: z.string().date(),
        activity_type: z.enum([
          'rest',
          'walking',
          'cardio',
          'strength',
          'sport',
          'mixed',
        ]),
        activity_minutes: z.number().int().min(0).max(600),
        activity_intensity: z.enum(['rest', 'light', 'moderate', 'high']),
        fatigue_level: z.number().int().min(1).max(5),
        energy_level: z.number().int().min(1).max(5),
        sleep_hours: z.number().min(0).max(24),
        sleep_quality: z.number().int().min(1).max(5),
        stress_level: z.number().int().min(1).max(5),
        mood: z.enum(['very_low', 'low', 'neutral', 'good', 'very_good']),
        water_liters: z.number().min(0).max(10).nullable(),
        symptoms: z.array(z.string().max(100)).max(12),
      })
      .nullable(),
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
