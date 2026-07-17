import { BadRequestException } from '@nestjs/common';
import {
  ActivityLevel,
  CreateNutritionProfileDto,
  Gender,
  NutritionGoal,
} from './dto/create-nutrition-profile.dto';
import { NutritionCalculatorService } from './nutrition-calculator.service';

describe('NutritionCalculatorService', () => {
  const service = new NutritionCalculatorService();

  const baseInput: CreateNutritionProfileDto = {
    gender: Gender.Male,
    birthDate: '2000-01-15',
    heightCm: 170,
    weightKg: 70,
    activityLevel: ActivityLevel.Moderate,
    goal: NutritionGoal.Maintain,
    dietaryPreferences: [],
    dislikedIngredients: [],
  };

  it('calculates positive BMR, TDEE and macro targets', () => {
    const result = service.calculate(baseInput);

    expect(result.bmrKcal).toBeGreaterThan(0);
    expect(result.tdeeKcal).toBeGreaterThan(result.bmrKcal);
    expect(result.targetCaloriesKcal).toBe(result.tdeeKcal);
    expect(result.targetProteinG).toBe(126);
    expect(result.formulaCode).toBe('mifflin_st_jeor');
  });

  it('reduces the calorie target for a weight-loss goal', () => {
    const maintain = service.calculate(baseInput);
    const weightLoss = service.calculate({
      ...baseInput,
      goal: NutritionGoal.LoseWeight,
    });

    expect(weightLoss.targetCaloriesKcal).toBe(maintain.targetCaloriesKcal - 350);
  });

  it('rejects users younger than the supported MVP age', () => {
    const birthYear = new Date().getUTCFullYear() - 10;

    expect(() =>
      service.calculate({ ...baseInput, birthDate: `${birthYear}-01-01` }),
    ).toThrow(BadRequestException);
  });
});
