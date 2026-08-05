import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  ActivityLevel,
  CreateNutritionProfileDto,
  Gender,
  NutritionGoal,
} from './create-nutrition-profile.dto';

describe('CreateNutritionProfileDto contract', () => {
  it('accepts onboarding activity, allergy and intolerance fields', async () => {
    const input = plainToInstance(CreateNutritionProfileDto, {
      gender: Gender.Female,
      birthDate: '2000-01-15',
      heightCm: 165,
      weightKg: 60,
      activityLevel: ActivityLevel.Moderate,
      activityDaysPerWeek: 4,
      goal: NutritionGoal.Maintain,
      targetWeightKg: 60,
      goalDurationWeeks: 12,
      dietaryPreferences: ['Ăn cân bằng'],
      dislikedIngredients: ['kẹo'],
      foodAllergies: ['đậu phộng'],
      foodIntolerances: ['đậu nành'],
      medicalNotes: '',
    });

    const errors = await validate(input, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors).toEqual([]);
  });
});
