import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';

@Injectable()
export class AdminService {
  constructor(private readonly supabase: SupabaseService) {}

  async dashboard() {
    const admin = this.supabase.getAdminClient();
    const now = new Date().toISOString();
    const [
      customers,
      kitchens,
      activeKitchens,
      subscriptions,
      orderCount,
      orders,
      mealLogs,
      aiInsights,
      recentOrders,
    ] = await Promise.all([
      admin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
      admin.from('kitchens').select('*', { count: 'exact', head: true }),
      admin.from('kitchens').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      admin
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .in('status', ['active', 'cancel_at_period_end'])
        .gt('current_period_end', now),
      admin.from('kitchen_orders').select('*', { count: 'exact', head: true }),
      admin
        .from('kitchen_orders')
        .select('total_amount, status')
        .in('status', ['paid', 'confirmed', 'completed']),
      admin.from('meal_log_entries').select('*', { count: 'exact', head: true }),
      admin
        .from('ai_health_insights')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed'),
      admin
        .from('kitchen_orders')
        .select('id, order_number, user_id, status, total_amount, currency, created_at, kitchens(id, name)')
        .order('created_at', { ascending: false })
        .limit(8),
    ]);

    const failures = [
      customers,
      kitchens,
      activeKitchens,
      subscriptions,
      orderCount,
      orders,
      mealLogs,
      aiInsights,
      recentOrders,
    ].find((result) => result.error);
    if (failures?.error) throw new InternalServerErrorException(failures.error.message);

    const recentCustomerIds = [
      ...new Set((recentOrders.data ?? []).map((order) => order.user_id)),
    ];
    const { data: recentCustomers, error: customerError } = recentCustomerIds.length
      ? await admin
          .from('profiles')
          .select('id, full_name')
          .in('id', recentCustomerIds)
      : { data: [], error: null };
    if (customerError) throw new InternalServerErrorException(customerError.message);
    const customerMap = new Map(
      (recentCustomers ?? []).map((profile) => [profile.id, profile.full_name]),
    );

    return {
      generatedAt: now,
      metrics: {
        customers: customers.count ?? 0,
        kitchens: kitchens.count ?? 0,
        activeKitchens: activeKitchens.count ?? 0,
        activeSubscriptions: subscriptions.count ?? 0,
        kitchenOrders: orderCount.count ?? 0,
        kitchenRevenue: (orders.data ?? []).reduce(
          (sum, order) => sum + Number(order.total_amount),
          0,
        ),
        mealLogs: mealLogs.count ?? 0,
        aiInsights: aiInsights.count ?? 0,
      },
      recentOrders: (recentOrders.data ?? []).map((order) => ({
        ...order,
        customerName: customerMap.get(order.user_id) ?? 'Khách hàng',
      })),
    };
  }
}
