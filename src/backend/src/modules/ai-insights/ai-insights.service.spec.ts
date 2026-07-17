import { BadRequestException } from '@nestjs/common';
import type { AuthUser } from '../../common/auth/auth-user.interface';
import type { NutritionProfileRecord } from '../nutrition/nutrition-profile.interface';
import { AiInsightsService } from './ai-insights.service';
import type { HealthInsightProvider } from './health-insight-provider.interface';

const user: AuthUser = {
  id: '11111111-1111-4111-8111-111111111111',
  role: 'customer',
  accessToken: 'test-token',
};

const profile: NutritionProfileRecord = {
  id: '22222222-2222-4222-8222-222222222222',
  user_id: user.id,
  version: 1,
  gender: 'male',
  birth_date: '2000-01-15',
  height_cm: 170,
  weight_kg: 70,
  activity_level: 'moderate',
  goal: 'maintain',
  dietary_preferences: [],
  disliked_ingredients: [],
  medical_notes: null,
  bmr_kcal: 1650,
  tdee_kcal: 2557.5,
  target_calories_kcal: 2557.5,
  target_protein_g: 126,
  target_carbs_g: 320.39,
  target_fat_g: 76.73,
  formula_code: 'mifflin_st_jeor',
  formula_version: 'mifflin-st-jeor-v1',
  is_current: true,
  calculated_at: '2026-07-17T00:00:00.000Z',
  created_at: '2026-07-17T00:00:00.000Z',
};

function createExistingQuery(record: unknown) {
  const query = {
    select: jest.fn(),
    eq: jest.fn(),
    maybeSingle: jest.fn().mockResolvedValue({ data: record, error: null }),
  };
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  return query;
}

describe('AiInsightsService', () => {
  it('does not issue a duplicate provider request while insight is processing', async () => {
    const query = createExistingQuery({
      id: '33333333-3333-4333-8333-333333333333',
      status: 'processing',
    });
    const generate = jest.fn();
    const provider: HealthInsightProvider = {
      providerName: 'mock',
      modelName: 'mock-v1',
      generate,
    };
    const service = new AiInsightsService(
      { getAdminClient: () => ({ from: () => query }) } as never,
      { getCurrent: jest.fn().mockResolvedValue(profile) } as never,
      { hasActive: jest.fn() } as never,
      provider,
    );

    await expect(service.generate(user)).resolves.toEqual({
      id: '33333333-3333-4333-8333-333333333333',
      status: 'processing',
      retryAfterSeconds: 3,
    });
    expect(generate).not.toHaveBeenCalled();
  });

  it('blocks AI analysis when persisted metrics are outside the safe domain', async () => {
    const generate = jest.fn();
    const provider: HealthInsightProvider = {
      providerName: 'mock',
      modelName: 'mock-v1',
      generate,
    };
    const service = new AiInsightsService(
      { getAdminClient: jest.fn() } as never,
      { getCurrent: jest.fn().mockResolvedValue({ ...profile, bmr_kcal: 200 }) } as never,
      { hasActive: jest.fn() } as never,
      provider,
    );

    await expect(service.generate(user)).rejects.toBeInstanceOf(BadRequestException);
    expect(generate).not.toHaveBeenCalled();
  });
});
