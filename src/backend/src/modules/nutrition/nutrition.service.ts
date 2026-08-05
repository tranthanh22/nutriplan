import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../common/auth/auth-user.interface';
import { SupabaseService } from '../../database/supabase.service';
import { CreateNutritionProfileDto } from './dto/create-nutrition-profile.dto';
import { WeightHistoryRange } from './dto/get-weight-history-query.dto';
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

  async getStatus(user: AuthUser) {
    const { data, error } = await this.supabase
      .createUserClient(user.accessToken)
      .from('nutrition_profiles')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_current', true)
      .maybeSingle();
    if (error) throw new InternalServerErrorException(error.message);
    if (!data) {
      return {
        hasProfile: false,
        reviewDue: true,
        nextReviewAt: null,
        profile: null,
      };
    }

    const profile = data as NutritionProfileRecord;
    const lastUpdatedAt = profile.calculated_at ?? profile.created_at;
    const nextReviewAt = new Date(
      new Date(lastUpdatedAt).getTime() + 7 * 24 * 60 * 60 * 1000,
    );
    return {
      hasProfile: true,
      reviewDue: nextReviewAt.getTime() <= Date.now(),
      nextReviewAt: nextReviewAt.toISOString(),
      profile,
    };
  }

  async getVersions(user: AuthUser): Promise<NutritionProfileRecord[]> {
    const { data, error } = await this.supabase
      .createUserClient(user.accessToken)
      .from('nutrition_profiles')
      .select('*')
      .order('version', { ascending: false });
    if (error) throw new InternalServerErrorException(error.message);
    return (data ?? []) as NutritionProfileRecord[];
  }

  async getVersion(user: AuthUser, version: number): Promise<NutritionProfileRecord> {
    const { data, error } = await this.supabase
      .createUserClient(user.accessToken)
      .from('nutrition_profiles')
      .select('*')
      .eq('version', version)
      .maybeSingle();
    if (error) throw new InternalServerErrorException(error.message);
    if (!data) throw new NotFoundException(`Không tìm thấy hồ sơ dinh dưỡng phiên bản ${version}`);
    return data as NutritionProfileRecord;
  }

  async create(user: AuthUser, dto: CreateNutritionProfileDto) {
    const result = this.calculator.calculate(dto);
    const { data, error } = await this.supabase.createUserClient(user.accessToken).rpc(
      'replace_current_nutrition_profile_v2',
      {
        p_gender: dto.gender,
        p_birth_date: dto.birthDate,
        p_height_cm: dto.heightCm,
        p_weight_kg: dto.weightKg,
        p_activity_level: dto.activityLevel,
        p_activity_days_per_week: dto.activityDaysPerWeek,
        p_goal: dto.goal,
        p_target_weight_kg: dto.targetWeightKg,
        p_goal_duration_weeks: dto.goalDurationWeeks,
        p_dietary_preferences: dto.dietaryPreferences,
        p_disliked_ingredients: dto.dislikedIngredients,
        p_food_allergies: dto.foodAllergies,
        p_food_intolerances: dto.foodIntolerances,
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

    const { error: progressError } = await this.supabase
      .createUserClient(user.accessToken)
      .from('progress_entries')
      .upsert(
        {
          user_id: user.id,
          recorded_on: this.localDateKey(),
          weight_kg: dto.weightKg,
        },
        { onConflict: 'user_id,recorded_on' },
      );
    if (progressError) throw new InternalServerErrorException(progressError.message);

    return data;
  }

  async getWeightHistory(user: AuthUser, range: WeightHistoryRange) {
    let query = this.supabase
      .createUserClient(user.accessToken)
      .from('progress_entries')
      .select('id, recorded_on, weight_kg, created_at, updated_at')
      .eq('user_id', user.id)
      .order('recorded_on', { ascending: true });

    const startDate = this.getWeightRangeStart(range);
    if (startDate) query = query.gte('recorded_on', startDate);

    const { data, error } = await query;
    if (error) throw new InternalServerErrorException(error.message);
    return { range, entries: data ?? [] };
  }

  private getWeightRangeStart(range: WeightHistoryRange) {
    if (range === WeightHistoryRange.All) return null;

    const date = new Date(`${this.localDateKey()}T00:00:00+07:00`);
    if (range === WeightHistoryRange.SevenDays) date.setDate(date.getDate() - 6);
    if (range === WeightHistoryRange.OneMonth) date.setMonth(date.getMonth() - 1);
    if (range === WeightHistoryRange.ThreeMonths) date.setMonth(date.getMonth() - 3);
    if (range === WeightHistoryRange.OneYear) date.setFullYear(date.getFullYear() - 1);
    return this.localDateKey(date);
  }

  private localDateKey(date = new Date()) {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  }
}
