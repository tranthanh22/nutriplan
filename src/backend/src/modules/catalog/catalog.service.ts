import { ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../common/auth/auth-user.interface';
import { SupabaseService } from '../../database/supabase.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Injectable()
export class CatalogService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  async preview() {
    const { data, error } = await this.supabase
      .getPublicClient()
      .from('dishes')
      .select('id, name, slug, short_description, ingredient_summary, image_path, meal_types, dish_nutrition(*)')
      .eq('status', 'active')
      .limit(20);
    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async recipe(user: AuthUser, dishId: string) {
    if (!(await this.subscriptions.hasActive(user))) {
      throw new ForbiddenException('Recipe chi tiết yêu cầu subscription còn hiệu lực');
    }
    const { data, error } = await this.supabase
      .createUserClient(user.accessToken)
      .from('recipes')
      .select('*, dishes(id, name, slug, image_path)')
      .eq('dish_id', dishId)
      .maybeSingle();
    if (error) throw new InternalServerErrorException(error.message);
    if (!data) throw new NotFoundException('Không tìm thấy Recipe');
    return data;
  }
}
