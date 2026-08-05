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
    const client = this.supabase.createUserClient(user.accessToken);
    const [recipeResult, dishResult] = await Promise.all([
      client
        .from('recipes')
        .select(
          'dish_id, instructions, cooking_tips, storage_instructions, safety_notes, version, reviewed_at',
        )
        .eq('dish_id', dishId)
        .maybeSingle(),
      client
        .from('dishes')
        .select(
          'id, name, slug, image_path, ingredient_summary, prep_time_minutes, cook_time_minutes',
        )
        .eq('id', dishId)
        .eq('status', 'active')
        .maybeSingle(),
    ]);
    if (recipeResult.error) {
      throw new InternalServerErrorException(recipeResult.error.message);
    }
    if (dishResult.error) {
      throw new InternalServerErrorException(dishResult.error.message);
    }
    if (!recipeResult.data || !dishResult.data) {
      throw new NotFoundException('Không tìm thấy Recipe');
    }

    const ingredients = String(dishResult.data.ingredient_summary ?? '')
      .split(',')
      .map((ingredient) => ingredient.trim())
      .filter(Boolean);

    return {
      ...recipeResult.data,
      ingredients,
      prep_time_minutes: dishResult.data.prep_time_minutes,
      cook_time_minutes: dishResult.data.cook_time_minutes,
      dishes: {
        id: dishResult.data.id,
        name: dishResult.data.name,
        slug: dishResult.data.slug,
        image_path: dishResult.data.image_path,
      },
    };
  }
}
