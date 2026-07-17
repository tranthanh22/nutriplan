import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../common/auth/auth-user.interface';
import { SupabaseService } from '../../database/supabase.service';
import { CreateNutritionProfileDto } from './dto/create-nutrition-profile.dto';
import { NutritionCalculatorService } from './nutrition-calculator.service';
import type { NutritionProfileRecord } from './nutrition-profile.interface';

@Injectable()
export class NutritionService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly calculator: NutritionCalculatorService,
  ) {}

  calculate(dto: CreateNutritionProfileDto) {
    return this.calculator.calculate(dto);
  }

  async getCurrent(user: AuthUser): Promise<NutritionProfileRecord> {
    const { data, error } = await this.supabase
      .createUserClient(user.accessToken)
      .from('nutrition_profiles')
      .select('*')
      .eq('is_current', true)
      .maybeSingle();
    if (error) throw new InternalServerErrorException(error.message);
    if (!data) throw new NotFoundException('Chưa có hồ sơ dinh dưỡng');
    return data as NutritionProfileRecord;
  }

  async create(user: AuthUser, dto: CreateNutritionProfileDto) {
    const result = this.calculator.calculate(dto);
    const { data, error } = await this.supabase.createUserClient(user.accessToken).rpc(
      'replace_current_nutrition_profile',
      {
        p_gender: dto.gender,
        p_birth_date: dto.birthDate,
        p_height_cm: dto.heightCm,
        p_weight_kg: dto.weightKg,
        p_activity_level: dto.activityLevel,
        p_goal: dto.goal,
        p_dietary_preferences: dto.dietaryPreferences,
        p_disliked_ingredients: dto.dislikedIngredients,
        p_medical_notes: dto.medicalNotes ?? null,
        p_bmr_kcal: result.bmrKcal,
        p_tdee_kcal: result.tdeeKcal,
        p_target_calories_kcal: result.targetCaloriesKcal,
        p_target_protein_g: result.targetProteinG,
        p_target_carbs_g: result.targetCarbsG,
        p_target_fat_g: result.targetFatG,
        p_formula_code: result.formulaCode,
        p_formula_version: result.formulaVersion,
      },
    );
    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }
}
