import { createHash } from 'node:crypto';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../../common/auth/auth-user.interface';
import { SupabaseService } from '../../database/supabase.service';
import { NutritionService } from '../nutrition/nutrition.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import type { NutritionProfileRecord } from '../nutrition/nutrition-profile.interface';
import { AiHealthInputSchema } from './ai-health-input.schema';
import {
  HEALTH_INSIGHT_PROVIDER,
  type HealthInsightProvider,
} from './health-insight-provider.interface';

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
    @Inject(HEALTH_INSIGHT_PROVIDER)
    private readonly provider: HealthInsightProvider,
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
    const existing = await this.findExisting(profile.id, inputFingerprint);
    if (existing?.status === 'completed') return this.present(user, existing);
    if (existing && ['pending', 'processing'].includes(existing.status)) {
      return this.processing(existing);
    }

    const admin = this.supabase.getAdminClient();
    const baseRecord = {
      nutrition_profile_id: profile.id,
      provider: this.provider.providerName,
      model: this.provider.modelName,
      prompt_version: PROMPT_VERSION,
      formula_version: profile.formula_version,
      input_fingerprint: inputFingerprint,
      input_data: input,
      status: 'processing',
      safety_status: 'pending',
    };
    let row: { id: string };
    if (existing?.status === 'failed') {
      const { data, error } = await admin
        .from('ai_health_insights')
        .update({
          status: 'processing',
          safety_status: 'pending',
          error_code: null,
          error_message: null,
        })
        .eq('id', existing.id)
        .eq('status', 'failed')
        .select('id')
        .maybeSingle();
      if (error) throw new InternalServerErrorException(error.message);
      if (!data) return this.processing(existing);
      row = data;
    } else {
      const { data, error: insertError } = await admin
        .from('ai_health_insights')
        .insert(baseRecord)
        .select('id')
        .single();

      if (insertError) {
        const raced = await this.findExisting(profile.id, inputFingerprint);
        if (raced?.status === 'completed') return this.present(user, raced);
        if (raced) return this.processing(raced);
        throw new InternalServerErrorException(insertError.message);
      }
      row = data;
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
          error_code: this.errorCode(error),
          error_message: 'AI provider không hoàn tất yêu cầu',
        })
        .eq('id', row.id);
      throw error;
    }
  }

  private processing(insight: AiInsightRecord) {
    return {
      id: insight.id,
      status: 'processing',
      retryAfterSeconds: 3,
    };
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

  private async findExisting(profileId: string, inputFingerprint: string) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('ai_health_insights')
      .select('*')
      .eq('nutrition_profile_id', profileId)
      .eq('provider', this.provider.providerName)
      .eq('model', this.provider.modelName)
      .eq('prompt_version', PROMPT_VERSION)
      .eq('input_fingerprint', inputFingerprint)
      .maybeSingle();
    if (error) throw new InternalServerErrorException(error.message);
    return data as AiInsightRecord | null;
  }

  private buildMinimalInput(profile: NutritionProfileRecord) {
    const birthDate = new Date(`${String(profile.birth_date)}T00:00:00.000Z`);
    const now = new Date();
    let age = now.getUTCFullYear() - birthDate.getUTCFullYear();
    if (
      now.getUTCMonth() < birthDate.getUTCMonth() ||
      (now.getUTCMonth() === birthDate.getUTCMonth() &&
        now.getUTCDate() < birthDate.getUTCDate())
    ) {
      age -= 1;
    }
    const parsed = AiHealthInputSchema.safeParse({
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
    });
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Dữ liệu hồ sơ nằm ngoài miền phân tích AI an toàn',
        fields: parsed.error.issues.map((issue) => issue.path.join('.')),
      });
    }
    return parsed.data;
  }

  private errorCode(error: unknown) {
    if (error && typeof error === 'object' && 'status' in error) {
      const status = Number(error.status);
      if (status === 504) return 'provider_timeout';
      if (status === 502) return 'invalid_provider_output';
    }
    return 'provider_error';
  }

  private hash(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }
}
