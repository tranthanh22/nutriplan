import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../../common/auth/auth-user.interface';
import { SupabaseService } from '../../database/supabase.service';
import type { CreateKitchenOrderDto } from './dto/create-kitchen-order.dto';
import type { UpdateDailyOrderItemDto } from './dto/update-daily-order-item.dto';
import {
  DailyOrderStatus,
  type UpdateDailyOrderStatusDto,
} from './dto/update-daily-order-status.dto';
import {
  KitchenOrderStatus,
  type UpdateOrderStatusDto,
} from './dto/update-order-status.dto';

type DashboardDailyOrder = {
  kitchen_order_id: string;
  delivery_date: string;
  status: string;
  [key: string]: unknown;
};

@Injectable()
export class OrdersService {
  constructor(private readonly supabase: SupabaseService) {}

  async mine(user: AuthUser) {
    const { data, error } = await this.supabase
      .createUserClient(user.accessToken)
      .from('kitchen_orders')
      .select('*, kitchens(id, name, slug), kitchen_order_items(*)')
      .order('created_at', { ascending: false });
    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async create(user: AuthUser, dto: CreateKitchenOrderDto) {
    if (
      this.timeToMinutes(dto.deliveryWindowEnd) <=
      this.timeToMinutes(dto.deliveryWindowStart)
    ) {
      throw new BadRequestException(
        'Giờ kết thúc giao hàng phải sau giờ bắt đầu',
      );
    }

    const admin = this.supabase.getAdminClient();
    const { data: offer, error: offerError } = await admin
      .from('kitchen_offers')
      .select('id, kitchens!inner(status)')
      .eq('code', dto.offerCode)
      .eq('status', 'active')
      .eq('kitchens.status', 'active')
      .maybeSingle();
    if (offerError) throw new InternalServerErrorException(offerError.message);
    if (!offer) throw new BadRequestException('Gói bếp không còn khả dụng');

    const { data, error } = await admin.rpc('create_mock_kitchen_order_schedule', {
      p_user_id: user.id,
      p_offer_code: dto.offerCode,
      p_recipient_name: dto.recipientName,
      p_recipient_phone: dto.recipientPhone,
      p_delivery_address: dto.deliveryAddress,
      p_delivery_note: dto.deliveryNote ?? null,
      p_delivery_window_start: dto.deliveryWindowStart,
      p_delivery_window_end: dto.deliveryWindowEnd,
      p_idempotency_key: dto.idempotencyKey,
      p_quantity: dto.quantity,
    });
    if (error) {
      if (error.message.includes('kitchen_offer_not_available')) {
        throw new BadRequestException('Gói bếp không còn khả dụng');
      }
      if (error.message.includes('invalid_kitchen_order_input')) {
        throw new BadRequestException('Thông tin nhận món chưa hợp lệ');
      }
      if (error.message.includes('invalid_delivery_window')) {
        throw new BadRequestException('Khung giờ giao hàng chưa hợp lệ');
      }
      if (error.message.includes('overlapping_kitchen_package')) {
        const [, orderNumber, endDate] =
          error.message.match(/overlapping_kitchen_package:([^:]+):(\d{4}-\d{2}-\d{2})/) ?? [];
        const formattedEndDate = endDate
          ? new Intl.DateTimeFormat('vi-VN', { timeZone: 'UTC' }).format(
              new Date(`${endDate}T00:00:00.000Z`),
            )
          : null;
        throw new ConflictException(
          `Bạn đang có gói này hoạt động${orderNumber ? ` (${orderNumber})` : ''}${formattedEndDate ? ` đến ${formattedEndDate}` : ''}. Hãy hoàn thành hoặc hủy gói hiện tại trước khi mua lại.`,
        );
      }
      throw new InternalServerErrorException(error.message);
    }
    const createdOrderId = this.isRecord(data) && typeof data.id === 'string'
      ? data.id
      : null;
    const isDuplicate = this.isRecord(data) && data.duplicate === true;
    if (createdOrderId && !isDuplicate) {
      await this.snapshotCustomerNutrition(admin, user.id, createdOrderId);
    }
    return data;
  }

  private timeToMinutes(value: string) {
    const [hours, minutes] = value.split(':').map(Number);
    return hours * 60 + minutes;
  }

  async kitchenDashboard(user: AuthUser) {
    const admin = this.supabase.getAdminClient();
    const kitchenIds = await this.getManagedKitchenIds(user);

    if (kitchenIds.length === 0) {
      return {
        kitchens: [],
        summary: { total: 0, confirmed: 0, completed: 0, cancelled: 0, revenue: 0 },
        orders: [],
      };
    }

    const [{ data: kitchens, error: kitchensError }, { data: orders, error: ordersError }] =
      await Promise.all([
        admin
          .from('kitchens')
          .select('id, name, slug, status')
          .in('id', kitchenIds)
          .order('name'),
        admin
          .from('kitchen_orders')
          .select(
            'id, order_number, user_id, kitchen_id, offer_id, status, recipient_name, recipient_phone, delivery_address, delivery_note, allergen_snapshot, policy_snapshot, total_amount, currency, paid_at, created_at, updated_at, kitchens(id, name), kitchen_offers(id, name, type, package_days, meals_per_day, description), kitchen_order_items(id, item_name, quantity, item_snapshot)',
          )
          .in('kitchen_id', kitchenIds)
          .order('created_at', { ascending: false })
          .limit(200),
      ]);
    if (kitchensError) throw new InternalServerErrorException(kitchensError.message);
    if (ordersError) throw new InternalServerErrorException(ordersError.message);

    const orderIds = (orders ?? []).map((order) => order.id);
    const dailyOrdersResult = orderIds.length
      ? await admin
          .from('daily_orders')
          .select(
            'id, kitchen_order_id, delivery_date, meal_type, delivery_window_start, delivery_window_end, status, accepted_at, preparing_at, out_for_delivery_at, delivered_at, failed_at, cancelled_at, failure_reason, updated_at, daily_order_items(id, dish_name, ingredient_snapshot, servings, calories_kcal, protein_g, carbs_g, fat_g, allergen_snapshot)',
          )
          .in('kitchen_order_id', orderIds)
          .order('delivery_date', { ascending: true })
          .order('delivery_window_start', { ascending: true })
      : { data: [], error: null };
    if (dailyOrdersResult.error) {
      throw new InternalServerErrorException(dailyOrdersResult.error.message);
    }

    const customerIds = [...new Set((orders ?? []).map((order) => order.user_id))];
    const [customersResult, nutritionResult] = customerIds.length
      ? await Promise.all([
          admin.from('profiles').select('id, full_name, phone').in('id', customerIds),
          admin
            .from('nutrition_profiles')
            .select(
              'user_id, dietary_preferences, disliked_ingredients, food_allergies, food_intolerances',
            )
            .in('user_id', customerIds)
            .eq('is_current', true),
        ])
      : [
          { data: [], error: null },
          { data: [], error: null },
        ];
    if (customersResult.error) {
      throw new InternalServerErrorException(customersResult.error.message);
    }
    if (nutritionResult.error) {
      throw new InternalServerErrorException(nutritionResult.error.message);
    }

    const customerMap = new Map(
      (customersResult.data ?? []).map((profile) => [profile.id, profile]),
    );
    const nutritionMap = new Map(
      (nutritionResult.data ?? []).map((profile) => [profile.user_id, profile]),
    );
    const dailyOrdersByOrder = new Map<string, DashboardDailyOrder[]>();
    for (const dailyOrder of (dailyOrdersResult.data ?? []) as DashboardDailyOrder[]) {
      const current = dailyOrdersByOrder.get(dailyOrder.kitchen_order_id) ?? [];
      current.push(dailyOrder);
      dailyOrdersByOrder.set(dailyOrder.kitchen_order_id, current);
    }
    const enrichedOrders = (orders ?? []).map((order) => {
      const snapshot = this.readNutritionSnapshot(order.policy_snapshot);
      const current = nutritionMap.get(order.user_id);
      const dailyOrders = dailyOrdersByOrder.get(String(order.id)) ?? [];
      const deliveredMeals = dailyOrders.filter(
        (dailyOrder) => dailyOrder.status === 'delivered',
      ).length;
      return {
        ...order,
        daily_orders: dailyOrders,
        fulfillment: {
          total_meals: dailyOrders.length,
          delivered_meals: deliveredMeals,
          remaining_meals: dailyOrders.length - deliveredMeals,
          start_date: dailyOrders.at(0)?.delivery_date ?? null,
          end_date: dailyOrders.at(-1)?.delivery_date ?? null,
          status:
            dailyOrders.length === 0
              ? 'not_scheduled'
              : deliveredMeals === dailyOrders.length
                ? 'completed'
                : order.status === 'cancelled'
                  ? 'cancelled'
                  : 'active',
        },
        customer: customerMap.get(order.user_id) ?? null,
        nutrition_requirements: {
          dietary_preferences:
            snapshot?.dietary_preferences ??
            this.toStringArray(current?.dietary_preferences),
          food_allergies:
            this.toStringArray(order.allergen_snapshot).length > 0
              ? this.toStringArray(order.allergen_snapshot)
              : snapshot?.food_allergies ?? this.toStringArray(current?.food_allergies),
          food_intolerances:
            snapshot?.food_intolerances ??
            this.toStringArray(current?.food_intolerances),
          disliked_ingredients:
            snapshot?.disliked_ingredients ??
            this.toStringArray(current?.disliked_ingredients),
          source: snapshot ? 'order_snapshot' : 'current_profile',
        },
      };
    });
    const completed = enrichedOrders.filter((order) => order.status === 'completed');

    return {
      kitchens: kitchens ?? [],
      summary: {
        total: enrichedOrders.length,
        confirmed: enrichedOrders.filter((order) => order.status === 'confirmed').length,
        completed: completed.length,
        cancelled: enrichedOrders.filter((order) => order.status === 'cancelled').length,
        revenue: completed.reduce((sum, order) => sum + Number(order.total_amount), 0),
      },
      orders: enrichedOrders,
    };
  }

  async updateStatus(user: AuthUser, orderId: string, dto: UpdateOrderStatusDto) {
    const admin = this.supabase.getAdminClient();
    const { data: order, error: orderError } = await admin
      .from('kitchen_orders')
      .select('id, kitchen_id, status')
      .eq('id', orderId)
      .maybeSingle();
    if (orderError) throw new InternalServerErrorException(orderError.message);
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    if (user.role !== 'admin') {
      const kitchenIds = await this.getManagedKitchenIds(user);
      if (!kitchenIds.includes(order.kitchen_id)) {
        throw new ForbiddenException('Bạn không được quản lý đơn của bếp này');
      }
    }

    const transitions: Record<string, string[]> = {
      pending_payment: ['cancelled'],
      paid: ['confirmed', 'cancelled'],
      confirmed: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
      refunded: [],
    };
    if (!transitions[order.status]?.includes(dto.status)) {
      throw new BadRequestException(
        `Không thể chuyển trạng thái từ ${order.status} sang ${dto.status}`,
      );
    }

    const now = new Date().toISOString();
    const updates: Record<string, string> = { status: dto.status };
    if (dto.status === KitchenOrderStatus.Completed) updates.completed_at = now;
    if (dto.status === KitchenOrderStatus.Cancelled) updates.cancelled_at = now;

    const { data, error } = await admin
      .from('kitchen_orders')
      .update(updates)
      .eq('id', orderId)
      .eq('status', order.status)
      .select('id, order_number, status, updated_at, completed_at, cancelled_at')
      .maybeSingle();
    if (error) throw new InternalServerErrorException(error.message);
    if (!data) throw new BadRequestException('Đơn đã được cập nhật bởi một phiên làm việc khác');
    return data;
  }

  async updateDailyOrderStatus(
    user: AuthUser,
    orderId: string,
    dailyOrderId: string,
    dto: UpdateDailyOrderStatusDto,
  ) {
    const admin = this.supabase.getAdminClient();
    const { data: dailyOrder, error: dailyOrderError } = await admin
      .from('daily_orders')
      .select('id, kitchen_order_id, kitchen_id, status')
      .eq('id', dailyOrderId)
      .eq('kitchen_order_id', orderId)
      .maybeSingle();
    if (dailyOrderError) {
      throw new InternalServerErrorException(dailyOrderError.message);
    }
    if (!dailyOrder) throw new NotFoundException('Không tìm thấy bữa ăn trong gói');

    if (user.role !== 'admin') {
      const kitchenIds = await this.getManagedKitchenIds(user);
      if (!kitchenIds.includes(dailyOrder.kitchen_id)) {
        throw new ForbiddenException('Bạn không được quản lý bữa ăn của bếp này');
      }
    }

    const transitions: Record<string, DailyOrderStatus[]> = {
      scheduled: [DailyOrderStatus.Accepted, DailyOrderStatus.Cancelled],
      accepted: [DailyOrderStatus.Preparing, DailyOrderStatus.Cancelled],
      preparing: [
        DailyOrderStatus.OutForDelivery,
        DailyOrderStatus.Failed,
        DailyOrderStatus.Cancelled,
      ],
      out_for_delivery: [DailyOrderStatus.Delivered, DailyOrderStatus.Failed],
      delivered: [],
      failed: [],
      cancelled: [],
    };
    if (!transitions[dailyOrder.status]?.includes(dto.status)) {
      throw new BadRequestException(
        `Không thể chuyển bữa từ ${dailyOrder.status} sang ${dto.status}`,
      );
    }

    const now = new Date().toISOString();
    const timestampColumn: Partial<Record<DailyOrderStatus, string>> = {
      accepted: 'accepted_at',
      preparing: 'preparing_at',
      out_for_delivery: 'out_for_delivery_at',
      delivered: 'delivered_at',
      failed: 'failed_at',
      cancelled: 'cancelled_at',
    };
    const updates: Record<string, string> = { status: dto.status };
    const timestamp = timestampColumn[dto.status];
    if (timestamp) updates[timestamp] = now;
    if (dto.status === DailyOrderStatus.Failed) {
      updates.failure_reason = dto.note ?? 'Bếp báo không thể hoàn tất bữa';
    }

    const { data: updated, error: updateError } = await admin
      .from('daily_orders')
      .update(updates)
      .eq('id', dailyOrderId)
      .eq('status', dailyOrder.status)
      .select(
        'id, kitchen_order_id, delivery_date, meal_type, status, accepted_at, preparing_at, out_for_delivery_at, delivered_at, failed_at, cancelled_at, updated_at',
      )
      .maybeSingle();
    if (updateError) throw new InternalServerErrorException(updateError.message);
    if (!updated) {
      throw new BadRequestException('Bữa ăn đã được cập nhật ở phiên làm việc khác');
    }

    const { error: historyError } = await admin.from('order_status_history').insert({
      daily_order_id: dailyOrderId,
      from_status: dailyOrder.status,
      to_status: dto.status,
      changed_by: user.id,
      note: dto.note ?? null,
    });
    if (historyError) {
      throw new InternalServerErrorException(historyError.message);
    }

    if (dto.status === DailyOrderStatus.Delivered) {
      const { count, error: remainingError } = await admin
        .from('daily_orders')
        .select('id', { count: 'exact', head: true })
        .eq('kitchen_order_id', orderId)
        .neq('status', 'delivered');
      if (remainingError) {
        throw new InternalServerErrorException(remainingError.message);
      }
      if (count === 0) {
        const { error: completeError } = await admin
          .from('kitchen_orders')
          .update({ status: 'completed', completed_at: now })
          .eq('id', orderId)
          .eq('status', 'confirmed');
        if (completeError) {
          throw new InternalServerErrorException(completeError.message);
        }
      }
    }

    return updated;
  }

  async updateDailyOrderItem(
    user: AuthUser,
    orderId: string,
    dailyOrderId: string,
    itemId: string,
    dto: UpdateDailyOrderItemDto,
  ) {
    const admin = this.supabase.getAdminClient();
    const [{ data: dailyOrder, error: dailyOrderError }, { data: order, error: orderError }] =
      await Promise.all([
        admin
          .from('daily_orders')
          .select('id, kitchen_order_id, kitchen_id, status')
          .eq('id', dailyOrderId)
          .eq('kitchen_order_id', orderId)
          .maybeSingle(),
        admin
          .from('kitchen_orders')
          .select('id, allergen_snapshot')
          .eq('id', orderId)
          .maybeSingle(),
      ]);
    if (dailyOrderError) {
      throw new InternalServerErrorException(dailyOrderError.message);
    }
    if (orderError) throw new InternalServerErrorException(orderError.message);
    if (!dailyOrder || !order) {
      throw new NotFoundException('Không tìm thấy bữa ăn trong gói');
    }

    if (user.role !== 'admin') {
      const kitchenIds = await this.getManagedKitchenIds(user);
      if (!kitchenIds.includes(dailyOrder.kitchen_id)) {
        throw new ForbiddenException('Bạn không được chỉnh thực đơn của bếp này');
      }
    }
    if (!['scheduled', 'accepted'].includes(String(dailyOrder.status))) {
      throw new BadRequestException(
        'Chỉ được chỉnh món trước khi bếp bắt đầu chuẩn bị',
      );
    }

    const customerAllergens = new Set(
      this.toStringArray(order.allergen_snapshot).map((value) =>
        value.trim().toLocaleLowerCase('vi'),
      ),
    );
    const unsafeAllergens = dto.allergens.filter((value) =>
      customerAllergens.has(value.trim().toLocaleLowerCase('vi')),
    );
    if (unsafeAllergens.length > 0) {
      throw new BadRequestException(
        `Món có dị nguyên khách đã khai báo: ${unsafeAllergens.join(', ')}`,
      );
    }

    const { data, error } = await admin
      .from('daily_order_items')
      .update({
        dish_name: dto.dishName.trim(),
        ingredient_snapshot: dto.ingredients.map((value) => value.trim()).filter(Boolean),
        servings: dto.servings,
        calories_kcal: dto.caloriesKcal,
        protein_g: dto.proteinG,
        carbs_g: dto.carbsG,
        fat_g: dto.fatG,
        allergen_snapshot: dto.allergens.map((value) => value.trim()).filter(Boolean),
      })
      .eq('id', itemId)
      .eq('daily_order_id', dailyOrderId)
      .select(
        'id, daily_order_id, dish_name, ingredient_snapshot, servings, calories_kcal, protein_g, carbs_g, fat_g, allergen_snapshot',
      )
      .maybeSingle();
    if (error) throw new InternalServerErrorException(error.message);
    if (!data) throw new NotFoundException('Không tìm thấy món ăn trong bữa');
    return data;
  }

  private async getManagedKitchenIds(user: AuthUser) {
    const admin = this.supabase.getAdminClient();
    if (user.role === 'admin') {
      const { data, error } = await admin.from('kitchens').select('id');
      if (error) throw new InternalServerErrorException(error.message);
      return (data ?? []).map((kitchen) => kitchen.id);
    }

    const { data, error } = await admin
      .from('kitchen_members')
      .select('kitchen_id')
      .eq('user_id', user.id)
      .eq('is_active', true);
    if (error) throw new InternalServerErrorException(error.message);
    return (data ?? []).map((membership) => membership.kitchen_id);
  }

  private async snapshotCustomerNutrition(
    admin: ReturnType<SupabaseService['getAdminClient']>,
    userId: string,
    orderId: string,
  ) {
    const [{ data: profile, error: profileError }, { data: order, error: orderError }] =
      await Promise.all([
        admin
          .from('nutrition_profiles')
          .select(
            'dietary_preferences, disliked_ingredients, food_allergies, food_intolerances',
          )
          .eq('user_id', userId)
          .eq('is_current', true)
          .maybeSingle(),
        admin
          .from('kitchen_orders')
          .select('policy_snapshot')
          .eq('id', orderId)
          .single(),
      ]);
    if (profileError) throw new InternalServerErrorException(profileError.message);
    if (orderError) throw new InternalServerErrorException(orderError.message);
    if (!profile) return;

    const policySnapshot = this.isRecord(order.policy_snapshot)
      ? order.policy_snapshot
      : {};
    const { error: snapshotError } = await admin
      .from('kitchen_orders')
      .update({
        allergen_snapshot: this.toStringArray(profile.food_allergies),
        policy_snapshot: {
          ...policySnapshot,
          customer_nutrition: {
            dietary_preferences: this.toStringArray(profile.dietary_preferences),
            food_allergies: this.toStringArray(profile.food_allergies),
            food_intolerances: this.toStringArray(profile.food_intolerances),
            disliked_ingredients: this.toStringArray(profile.disliked_ingredients),
            captured_at: new Date().toISOString(),
          },
        },
      })
      .eq('id', orderId);
    if (snapshotError) throw new InternalServerErrorException(snapshotError.message);
  }

  private readNutritionSnapshot(value: unknown) {
    if (!this.isRecord(value) || !this.isRecord(value.customer_nutrition)) return null;
    const nutrition = value.customer_nutrition;
    return {
      dietary_preferences: this.toStringArray(nutrition.dietary_preferences),
      food_allergies: this.toStringArray(nutrition.food_allergies),
      food_intolerances: this.toStringArray(nutrition.food_intolerances),
      disliked_ingredients: this.toStringArray(nutrition.disliked_ingredients),
    };
  }

  private toStringArray(value: unknown): string[] {
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string')
      : [];
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
