import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../../common/auth/auth-user.interface';
import { SupabaseService } from '../../database/supabase.service';
import { NutritionService } from '../nutrition/nutrition.service';
import { UpsertDailyWellnessDto } from './dto/upsert-daily-wellness.dto';

export interface DailyWellnessRecord {
  id: string;
  user_id: string;
  nutrition_profile_id: string;
  checkin_date: string;
  activity_type: string;
  activity_minutes: number;
  activity_intensity: string;
  fatigue_level: number;
  energy_level: number;
  sleep_hours: number | string;
  sleep_quality: number;
  stress_level: number;
  mood: string;
  water_liters: number | string | null;
  symptoms: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class WellnessService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly nutrition: NutritionService,
  ) {}

  async getToday(user: AuthUser) {
    const { data, error } = await this.supabase
      .createUserClient(user.accessToken)
      .from('daily_wellness_checkins')
      .select('*')
      .eq('user_id', user.id)
      .eq('checkin_date', this.today())
      .maybeSingle();
    if (error) throw new InternalServerErrorException(error.message);
    return (data as DailyWellnessRecord | null) ?? null;
  }

  async upsertToday(user: AuthUser, dto: UpsertDailyWellnessDto) {
    let profile;
    try {
      profile = await this.nutrition.getCurrent(user);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException('Hãy hoàn tất hồ sơ dinh dưỡng trước khi check-in');
      }
      throw error;
    }

    const payload = {
      user_id: user.id,
      nutrition_profile_id: profile.id,
      checkin_date: this.today(),
      activity_type: dto.activityType,
      activity_minutes: dto.activityMinutes,
      activity_intensity: dto.activityIntensity,
      fatigue_level: dto.fatigueLevel,
      energy_level: dto.energyLevel,
      sleep_hours: dto.sleepHours,
      sleep_quality: dto.sleepQuality,
      stress_level: dto.stressLevel,
      mood: dto.mood,
      water_liters: dto.waterLiters ?? null,
      symptoms: dto.symptoms,
      notes: dto.notes?.trim() || null,
    };
    const { data, error } = await this.supabase
      .createUserClient(user.accessToken)
      .from('daily_wellness_checkins')
      .upsert(payload, { onConflict: 'user_id,checkin_date' })
      .select('*')
      .single();
    if (error) throw new InternalServerErrorException(error.message);
    return data as DailyWellnessRecord;
  }

  private today() {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  }
}
