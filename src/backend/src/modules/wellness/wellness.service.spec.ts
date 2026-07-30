import type { AuthUser } from '../../common/auth/auth-user.interface';
import {
  DailyActivityIntensity,
  DailyActivityType,
  DailyMood,
} from './dto/upsert-daily-wellness.dto';
import { WellnessService } from './wellness.service';

const user: AuthUser = {
  id: '11111111-1111-4111-8111-111111111111',
  role: 'customer',
  accessToken: 'test-token',
};

describe('WellnessService', () => {
  it('always filters today check-in by the authenticated user id', async () => {
    const query = {
      select: jest.fn(),
      eq: jest.fn(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValue(query);
    const service = new WellnessService(
      {
        createUserClient: () => ({ from: () => query }),
      } as never,
      {} as never,
    );

    await expect(service.getToday(user)).resolves.toBeNull();
    expect(query.eq).toHaveBeenCalledWith('user_id', user.id);
    expect(query.eq).toHaveBeenCalledWith(
      'checkin_date',
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    );
  });

  it('upserts a structured check-in owned by the authenticated user', async () => {
    const query = {
      upsert: jest.fn(),
      select: jest.fn(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'checkin-id', user_id: user.id },
        error: null,
      }),
    };
    query.upsert.mockReturnValue(query);
    query.select.mockReturnValue(query);
    const service = new WellnessService(
      {
        createUserClient: () => ({ from: () => query }),
      } as never,
      {
        getCurrent: jest.fn().mockResolvedValue({ id: 'profile-id' }),
      } as never,
    );

    await service.upsertToday(user, {
      activityType: DailyActivityType.Walking,
      activityMinutes: 35,
      activityIntensity: DailyActivityIntensity.Light,
      fatigueLevel: 2,
      energyLevel: 4,
      sleepHours: 7.5,
      sleepQuality: 4,
      stressLevel: 2,
      mood: DailyMood.Good,
      waterLiters: 1.8,
      symptoms: ['Không có'],
      notes: '  Ngủ tốt  ',
    });

    expect(query.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: user.id,
        nutrition_profile_id: 'profile-id',
        activity_minutes: 35,
        fatigue_level: 2,
        notes: 'Ngủ tốt',
      }),
      { onConflict: 'user_id,checkin_date' },
    );
  });
});
