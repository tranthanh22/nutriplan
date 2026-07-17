import { ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../common/auth/auth-user.interface';
import { SupabaseService } from '../../database/supabase.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Injectable()
export class MealPlansService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  async current(user: AuthUser) {
    if (!(await this.subscriptions.hasActive(user))) {
      throw new ForbiddenException('Kế hoạch chi tiết yêu cầu subscription còn hiệu lực');
    }
    const { data, error } = await this.supabase
      .createUserClient(user.accessToken)
      .from('meal_plans')
      .select('*, meal_plan_items(*, dishes(id, name, slug, image_path))')
      .eq('status', 'active')
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new InternalServerErrorException(error.message);
    if (!data) throw new NotFoundException('Chưa có kế hoạch đang hoạt động');
    return data;
  }
}
