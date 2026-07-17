import { BadRequestException, Injectable } from '@nestjs/common';
import {
  ActivityLevel,
  CreateNutritionProfileDto,
  Gender,
  NutritionGoal,
} from './dto/create-nutrition-profile.dto';

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  [ActivityLevel.Sedentary]: 1.2,
  [ActivityLevel.Light]: 1.375,
  [ActivityLevel.Moderate]: 1.55,
  [ActivityLevel.Active]: 1.725,
  [ActivityLevel.VeryActive]: 1.9,
};

@Injectable()
export class NutritionCalculatorService {
  calculate(input: CreateNutritionProfileDto) {
    const age = this.getAge(input.birthDate);
    if (age < 16 || age > 100) {
      throw new BadRequestException('MVP chỉ hỗ trợ người dùng từ 16 đến 100 tuổi');
    }

    const genderOffset = input.gender === Gender.Male ? 5 : -161;
    const bmr = 10 * input.weightKg + 6.25 * input.heightCm - 5 * age + genderOffset;
    const tdee = bmr * ACTIVITY_FACTORS[input.activityLevel];
    const calorieAdjustment =
      input.goal === NutritionGoal.LoseWeight
        ? -350
        : input.goal === NutritionGoal.GainMuscle
          ? 300
          : 0;
    const targetCalories = Math.max(1200, tdee + calorieAdjustment);
    const protein = input.weightKg * (input.goal === NutritionGoal.GainMuscle ? 2 : 1.8);
    const fat = (targetCalories * 0.27) / 9;
    const carbs = Math.max(0, (targetCalories - protein * 4 - fat * 9) / 4);

    return {
      age,
      bmrKcal: this.round(bmr),
      tdeeKcal: this.round(tdee),
      targetCaloriesKcal: this.round(targetCalories),
      targetProteinG: this.round(protein),
      targetCarbsG: this.round(carbs),
      targetFatG: this.round(fat),
      formulaCode: 'mifflin_st_jeor',
      formulaVersion: 'mifflin-st-jeor-v1',
    };
  }

  private getAge(birthDate: string) {
    const birth = new Date(`${birthDate}T00:00:00.000Z`);
    if (Number.isNaN(birth.getTime()) || birth > new Date()) {
      throw new BadRequestException('Ngày sinh không hợp lệ');
    }
    const today = new Date();
    let age = today.getUTCFullYear() - birth.getUTCFullYear();
    const monthDifference = today.getUTCMonth() - birth.getUTCMonth();
    if (monthDifference < 0 || (monthDifference === 0 && today.getUTCDate() < birth.getUTCDate())) {
      age -= 1;
    }
    return age;
  }

  private round(value: number) {
    return Math.round(value * 100) / 100;
  }
}
