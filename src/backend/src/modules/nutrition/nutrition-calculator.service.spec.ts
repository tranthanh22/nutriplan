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

  it.each([
    [Gender.Female, ActivityLevel.Sedentary, NutritionGoal.Maintain, 155, 48],
    [Gender.Female, ActivityLevel.Light, NutritionGoal.LoseWeight, 160, 55],
    [Gender.Female, ActivityLevel.Moderate, NutritionGoal.GainMuscle, 165, 60],
    [Gender.Female, ActivityLevel.Active, NutritionGoal.Maintain, 170, 68],
    [Gender.Female, ActivityLevel.VeryActive, NutritionGoal.LoseWeight, 175, 75],
    [Gender.Male, ActivityLevel.Sedentary, NutritionGoal.Maintain, 160, 55],
    [Gender.Male, ActivityLevel.Light, NutritionGoal.LoseWeight, 165, 62],
    [Gender.Male, ActivityLevel.Moderate, NutritionGoal.GainMuscle, 170, 70],
    [Gender.Male, ActivityLevel.Active, NutritionGoal.Maintain, 175, 82],
    [Gender.Male, ActivityLevel.VeryActive, NutritionGoal.LoseWeight, 180, 90],
    [Gender.Female, ActivityLevel.Moderate, NutritionGoal.Maintain, 150, 45],
    [Gender.Female, ActivityLevel.Active, NutritionGoal.GainMuscle, 168, 72],
    [Gender.Male, ActivityLevel.Light, NutritionGoal.Maintain, 172, 65],
    [Gender.Male, ActivityLevel.Active, NutritionGoal.GainMuscle, 185, 95],
    [Gender.Male, ActivityLevel.Sedentary, NutritionGoal.LoseWeight, 178, 110],
  ])(
    'keeps calculated metrics in the allowed domain for %s / %s / %s',
    (gender, activityLevel, goal, heightCm, weightKg) => {
      const result = service.calculate({
        ...baseInput,
        gender,
        activityLevel,
        goal,
        heightCm,
        weightKg,
      });

      expect(result.bmrKcal).toBeGreaterThan(500);
      expect(result.tdeeKcal).toBeGreaterThanOrEqual(result.bmrKcal);
      expect(result.targetCaloriesKcal).toBeGreaterThanOrEqual(1200);
      expect(result.targetProteinG).toBeGreaterThan(0);
      expect(result.targetCarbsG).toBeGreaterThanOrEqual(0);
      expect(result.targetFatG).toBeGreaterThan(0);
    },
  );
});
