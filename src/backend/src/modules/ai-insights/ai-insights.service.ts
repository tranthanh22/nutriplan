import { createHash } from 'node:crypto';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../../common/auth/auth-user.interface';
import { SupabaseService } from '../../database/supabase.service';
import { NutritionService } from '../nutrition/nutrition.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { OpenAiHealthInsightProvider } from './openai-health-insight.provider';
import type { NutritionProfileRecord } from '../nutrition/nutrition-profile.interface';

const PROMPT_VERSION = 'health-insight-v1';

interface AiInsightRecord {
  id: string;
  status: string;
  safety_status: string;
  generated_at: string | null;
  preview_summary: string | null;
  output_data: unknown;
}

@Injectable()
export class AiInsightsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly nutrition: NutritionService,
    private readonly subscriptions: SubscriptionsService,
    private readonly provider: OpenAiHealthInsightProvider,
  ) {}

  async latest(user: AuthUser) {
    const profile = await this.nutrition.getCurrent(user);
    const insight = await this.findCompleted(profile.id);
    if (!insight) throw new NotFoundException('Chưa có AI Insight cho hồ sơ hiện hành');
    return this.present(user, insight);
  }

  async generate(user: AuthUser) {
    const profile = await this.nutrition.getCurrent(user);
    const input = this.buildMinimalInput(profile);
    const inputFingerprint = this.hash(JSON.stringify(input));
    const cached = await this.findCached(profile.id, inputFingerprint);
    if (cached) return this.present(user, cached);

    const admin = this.supabase.getAdminClient();
    const baseRecord = {
      nutrition_profile_id: profile.id,
      provider: 'openai',
      model: this.provider.modelName,
      prompt_version: PROMPT_VERSION,
      formula_version: profile.formula_version,
      input_fingerprint: inputFingerprint,
      input_data: input,
      status: 'processing',
      safety_status: 'pending',
    };
    const { data: row, error: insertError } = await admin
      .from('ai_health_insights')
      .insert(baseRecord)
      .select('id')
      .single();

    if (insertError) {
      const raced = await this.findCached(profile.id, inputFingerprint);
      if (raced) return this.present(user, raced);
      throw new InternalServerErrorException(insertError.message);
    }

    try {
      const generated = await this.provider.generate(input, this.hash(user.id));
      const output = generated.output;
      const safetyStatus =
        output.safety_flags.length > 0 || output.recommend_professional_review
          ? 'review_required'
          : 'passed';
      const previewSummary = output.summary.slice(0, 240);
      const { data, error } = await admin
        .from('ai_health_insights')
        .update({
          output_data: output,
          preview_summary: previewSummary,
          status: 'completed',
          safety_status: safetyStatus,
          input_tokens: generated.inputTokens,
          output_tokens: generated.outputTokens,
          generated_at: new Date().toISOString(),
        })
        .eq('id', row.id)
        .select('*')
        .single();
      if (error) throw new InternalServerErrorException(error.message);
      return this.present(user, data as AiInsightRecord);
    } catch (error) {
      await admin
        .from('ai_health_insights')
        .update({
          status: 'failed',
          error_code: 'provider_error',
          error_message: error instanceof Error ? error.message.slice(0, 500) : 'Unknown error',
        })
        .eq('id', row.id);
      throw error;
    }
  }

  private async present(user: AuthUser, insight: AiInsightRecord) {
    const subscribed = await this.subscriptions.hasActive(user);
    if (!subscribed) {
      return {
        id: insight.id,
        status: insight.status,
        generatedAt: insight.generated_at,
        previewSummary: insight.preview_summary,
        requiresSubscription: true,
      };
    }
    return {
      id: insight.id,
      status: insight.status,
      safetyStatus: insight.safety_status,
      generatedAt: insight.generated_at,
      insight: insight.output_data,
      requiresSubscription: false,
    };
  }

  private async findCompleted(profileId: string) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('ai_health_insights')
      .select('*')
      .eq('nutrition_profile_id', profileId)
      .eq('status', 'completed')
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new InternalServerErrorException(error.message);
    return data as AiInsightRecord | null;
  }

  private async findCached(profileId: string, inputFingerprint: string) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('ai_health_insights')
      .select('*')
      .eq('nutrition_profile_id', profileId)
      .eq('provider', 'openai')
      .eq('model', this.provider.modelName)
      .eq('prompt_version', PROMPT_VERSION)
      .eq('input_fingerprint', inputFingerprint)
      .eq('status', 'completed')
      .maybeSingle();
    if (error) throw new InternalServerErrorException(error.message);
    return data as AiInsightRecord | null;
  }

  private buildMinimalInput(profile: NutritionProfileRecord) {
    const birthDate = new Date(`${String(profile.birth_date)}T00:00:00.000Z`);
    const age = new Date().getUTCFullYear() - birthDate.getUTCFullYear();
    return {
      age,
      gender: profile.gender,
      height_cm: Number(profile.height_cm),
      weight_kg: Number(profile.weight_kg),
      activity_level: profile.activity_level,
      goal: profile.goal,
      dietary_preferences: profile.dietary_preferences,
      disliked_ingredients: profile.disliked_ingredients,
      bmr_kcal: Number(profile.bmr_kcal),
      tdee_kcal: Number(profile.tdee_kcal),
      target_calories_kcal: Number(profile.target_calories_kcal),
      target_protein_g: Number(profile.target_protein_g),
      target_carbs_g: Number(profile.target_carbs_g),
      target_fat_g: Number(profile.target_fat_g),
      formula_version: profile.formula_version,
    };
  }

  private hash(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }
}
