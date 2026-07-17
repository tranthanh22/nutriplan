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
      .select(
        'id, name, slug, short_description, ingredient_summary, image_path, meal_types, dish_nutrition(calories_kcal, protein_g, carbs_g, fat_g)',
      )
      .eq('status', 'active')
      .limit(20);
    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async allergens() {
    const { data, error } = await this.supabase
      .getPublicClient()
      .from('allergens')
      .select('id, code, name, description')
      .eq('is_active', true)
      .order('name');
    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async detail(dishId: string) {
    const { data, error } = await this.supabase
      .getPublicClient()
      .from('dishes')
      .select(
        `id, name, slug, short_description, ingredient_summary, image_path,
        meal_types, cuisine, prep_time_minutes, cook_time_minutes, difficulty,
        dish_nutrition(*),
        dish_allergens(cross_contamination_risk, notes, allergens(id, code, name, description))`,
      )
      .eq('id', dishId)
      .eq('status', 'active')
      .maybeSingle();
    if (error) throw new InternalServerErrorException(error.message);
    if (!data) throw new NotFoundException('Không tìm thấy món ăn');
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
