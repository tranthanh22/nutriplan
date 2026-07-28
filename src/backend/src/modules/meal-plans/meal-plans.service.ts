import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../../common/auth/auth-user.interface';
import { SupabaseService } from '../../database/supabase.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import type { ConfirmMealEatenDto } from './dto/confirm-meal-eaten.dto';
import type { MenuRangeQueryDto } from './dto/menu-range-query.dto';
import type { ReplaceMealDto } from './dto/replace-meal.dto';

@Injectable()
export class MealPlansService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  async current(user: AuthUser) {
    await this.requireSubscription(user);
    await this.ensureCurrentPlan(user);
    const plan = await this.getPersonalPlan(user);
    if (!plan) throw new NotFoundException('Chưa có kế hoạch đang hoạt động');
    return plan;
  }

  async mine(user: AuthUser, query: MenuRangeQueryDto) {
    const range = this.resolveRange(query);
    const subscriptionActive = await this.subscriptions.hasActive(user);
    let personalPlanUnavailableReason: string | null = null;

    if (subscriptionActive) {
      try {
        await this.ensureCurrentPlan(user);
      } catch (error) {
        if (
          error instanceof BadRequestException &&
          error.message.includes('hồ sơ dinh dưỡng')
        ) {
          personalPlanUnavailableReason = error.message;
        } else {
          throw error;
        }
      }
    }

    const [personalPlan, kitchenMeals, journal] = await Promise.all([
      subscriptionActive ? this.getPersonalPlan(user) : Promise.resolve(null),
      this.getKitchenMeals(user, range.from, range.to),
      this.getJournal(user, range.from, range.to),
    ]);

    return {
      subscriptionActive,
      personalPlanUnavailableReason,
      range,
      personalPlan,
      kitchenMeals,
      journal,
    };
  }

  async journal(user: AuthUser, query: MenuRangeQueryDto) {
    const range = this.resolveRange(query);
    return {
      range,
      entries: await this.getJournal(user, range.from, range.to),
    };
  }

  async replacements(user: AuthUser, itemId: string) {
    await this.requireSubscription(user);
    const { data, error } = await this.supabase
      .getAdminClient()
      .rpc('get_personal_meal_replacement_candidates', {
        p_user_id: user.id,
        p_meal_plan_item_id: itemId,
      });
    if (error) this.throwRpcError(error.message);
    return data ?? [];
  }

  async replace(user: AuthUser, itemId: string, dto: ReplaceMealDto) {
    await this.requireSubscription(user);
    const { data, error } = await this.supabase
      .getAdminClient()
      .rpc('replace_personal_meal', {
        p_user_id: user.id,
        p_meal_plan_item_id: itemId,
        p_dish_id: dto.dishId,
      });
    if (error) this.throwRpcError(error.message);
    return data;
  }

  async confirmPersonalMeal(
    user: AuthUser,
    itemId: string,
    dto: ConfirmMealEatenDto,
  ) {
    await this.requireSubscription(user);
    const { data, error } = await this.supabase
      .getAdminClient()
      .rpc('confirm_personal_meal_eaten', {
        p_user_id: user.id,
        p_meal_plan_item_id: itemId,
        p_consumed_at: dto.consumedAt ?? new Date().toISOString(),
      });
    if (error) this.throwRpcError(error.message);
    return data;
  }

  async confirmKitchenMeal(
    user: AuthUser,
    dailyOrderId: string,
    dto: ConfirmMealEatenDto,
  ) {
    await this.requireSubscription(user);
    const { data, error } = await this.supabase
      .getAdminClient()
      .rpc('confirm_kitchen_meal_eaten', {
        p_user_id: user.id,
        p_daily_order_id: dailyOrderId,
        p_consumed_at: dto.consumedAt ?? new Date().toISOString(),
      });
    if (error) this.throwRpcError(error.message);
    return data;
  }

  private async requireSubscription(user: AuthUser) {
    if (!(await this.subscriptions.hasActive(user))) {
      throw new ForbiddenException(
        'Chức năng này yêu cầu subscription còn hiệu lực',
      );
    }
  }

  private async ensureCurrentPlan(user: AuthUser) {
    const { error } = await this.supabase
      .getAdminClient()
      .rpc('ensure_current_personal_meal_plan', { p_user_id: user.id });
    if (error) this.throwRpcError(error.message);
  }

  private async getPersonalPlan(user: AuthUser) {
    const { data, error } = await this.supabase
      .createUserClient(user.accessToken)
      .from('meal_plans')
      .select(
        `id, name, start_date, end_date, version, generated_by,
        target_calories_kcal, target_protein_g, target_carbs_g, target_fat_g,
        meal_plan_items(
          id, planned_date, meal_type, sequence_no, servings,
          calories_kcal, protein_g, carbs_g, fat_g,
          is_replacement, consumption_status, consumed_at,
          dishes(id, name, slug, short_description, image_path, prep_time_minutes)
        )`,
      )
      .eq('status', 'active')
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  private async getKitchenMeals(user: AuthUser, from: string, to: string) {
    const { data, error } = await this.supabase
      .createUserClient(user.accessToken)
      .from('daily_orders')
      .select(
        `id, delivery_date, meal_type, status, delivery_window_start,
        delivery_window_end, delivered_at,
        kitchens(id, name, slug, logo_path),
        daily_order_items(
          id, dish_id, dish_name, servings,
          calories_kcal, protein_g, carbs_g, fat_g
        ),
        meal_log_entries(id, consumed_at)`,
      )
      .gte('delivery_date', from)
      .lte('delivery_date', to)
      .in('status', [
        'scheduled',
        'accepted',
        'preparing',
        'out_for_delivery',
        'delivered',
      ])
      .order('delivery_date');
    if (error) throw new InternalServerErrorException(error.message);
    return data ?? [];
  }

  private async getJournal(user: AuthUser, from: string, to: string) {
    const start = `${from}T00:00:00.000Z`;
    const end = new Date(`${to}T00:00:00.000Z`);
    end.setUTCDate(end.getUTCDate() + 1);
    const { data, error } = await this.supabase
      .createUserClient(user.accessToken)
      .from('meal_log_entries')
      .select(
        `id, source, consumed_at, meal_type, name, servings,
        calories_kcal, protein_g, carbs_g, fat_g, is_user_confirmed,
        dish_id, meal_plan_item_id, daily_order_id`,
      )
      .gte('consumed_at', start)
      .lt('consumed_at', end.toISOString())
      .order('consumed_at', { ascending: false });
    if (error) throw new InternalServerErrorException(error.message);
    return data ?? [];
  }

  private resolveRange(query: MenuRangeQueryDto) {
    const today = new Date();
    const defaultFrom = today.toISOString().slice(0, 10);
    const defaultToDate = new Date(`${defaultFrom}T00:00:00.000Z`);
    defaultToDate.setUTCDate(defaultToDate.getUTCDate() + 6);
    const from = query.from ?? defaultFrom;
    const to = query.to ?? defaultToDate.toISOString().slice(0, 10);
    if (
      new Date(`${to}T00:00:00.000Z`) <
      new Date(`${from}T00:00:00.000Z`)
    ) {
      throw new BadRequestException('Ngày kết thúc phải sau ngày bắt đầu');
    }
    return { from, to };
  }

  private throwRpcError(message: string): never {
    if (message.includes('nutrition_profile_required')) {
      throw new BadRequestException(
        'Hãy hoàn thành hồ sơ dinh dưỡng trước khi tạo thực đơn',
      );
    }
    if (
      message.includes('active_subscription_required') ||
      message.includes('eaten_meal_cannot_be_replaced')
    ) {
      throw new ForbiddenException(
        message.includes('eaten')
          ? 'Không thể đổi món đã xác nhận ăn'
          : 'Subscription đã hết hiệu lực',
      );
    }
    if (
      message.includes('meal_plan_item_not_found') ||
      message.includes('daily_order_not_found')
    ) {
      throw new NotFoundException('Không tìm thấy bữa ăn');
    }
    if (message.includes('replacement_not_nutritionally_safe')) {
      throw new BadRequestException(
        'Món thay thế không còn phù hợp với mục tiêu dinh dưỡng ngày',
      );
    }
    if (message.includes('kitchen_meal_not_delivered')) {
      throw new BadRequestException(
        'Chỉ có thể xác nhận suất ăn sau khi bếp đã giao',
      );
    }
    throw new InternalServerErrorException(message);
  }
}
