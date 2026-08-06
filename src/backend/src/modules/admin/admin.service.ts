import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import { AdminKitchenStatus } from './dto/update-kitchen-status.dto';

const REVENUE_STATUSES = new Set(['paid', 'confirmed', 'completed']);
const PAID_PAYMENT_STATUSES = new Set([
  'succeeded',
  'partially_refunded',
  'refunded',
]);
const ACTIVE_SUBSCRIPTION_STATUSES = new Set([
  'active',
  'cancel_at_period_end',
]);

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

  async kitchens() {
    const admin = this.supabase.getAdminClient();
    const [kitchensResult, membersResult, offersResult, ordersResult] =
      await Promise.all([
        admin
          .from('kitchens')
          .select(
            'id, name, slug, description, phone, email, address_text, status, rating_average, rating_count, created_at, updated_at',
          )
          .order('created_at', { ascending: false }),
        admin
          .from('kitchen_members')
          .select('kitchen_id, user_id, role, is_active, created_at'),
        admin
          .from('kitchen_offers')
          .select(
            'id, kitchen_id, code, name, type, description, price_amount, currency, package_days, meals_per_day, status, available_from, available_until, created_at',
          )
          .order('created_at', { ascending: false }),
        admin
          .from('kitchen_orders')
          .select(
            'id, kitchen_id, offer_id, user_id, status, total_amount, currency, created_at',
          )
          .order('created_at', { ascending: false }),
      ]);

    const failure = [
      kitchensResult,
      membersResult,
      offersResult,
      ordersResult,
    ].find((result) => result.error);
    if (failure?.error) {
      throw new InternalServerErrorException(failure.error.message);
    }

    const memberUserIds = [
      ...new Set((membersResult.data ?? []).map((member) => member.user_id)),
    ];
    const profilesResult = memberUserIds.length
      ? await admin
          .from('profiles')
          .select('id, full_name, phone')
          .in('id', memberUserIds)
      : { data: [], error: null };
    if (profilesResult.error) {
      throw new InternalServerErrorException(profilesResult.error.message);
    }
    const profileMap = new Map(
      (profilesResult.data ?? []).map((profile) => [profile.id, profile]),
    );

    const kitchens = (kitchensResult.data ?? []).map((kitchen) => {
      const members = (membersResult.data ?? [])
        .filter((member) => member.kitchen_id === kitchen.id)
        .map((member) => ({
          ...member,
          profile: profileMap.get(member.user_id) ?? null,
        }));
      const offers = (offersResult.data ?? []).filter(
        (offer) => offer.kitchen_id === kitchen.id,
      );
      const orders = (ordersResult.data ?? []).filter(
        (order) => order.kitchen_id === kitchen.id,
      );
      const revenue = orders
        .filter((order) => REVENUE_STATUSES.has(String(order.status)))
        .reduce((sum, order) => sum + Number(order.total_amount), 0);

      return {
        ...kitchen,
        stats: {
          memberCount: members.length,
          activeMembers: members.filter((member) => member.is_active).length,
          orderCount: orders.length,
          completedOrders: orders.filter((order) => order.status === 'completed')
            .length,
          customerCount: new Set(orders.map((order) => order.user_id)).size,
          revenue,
          activeOffers: offers.filter((offer) => offer.status === 'active').length,
          lastOrderAt: orders[0]?.created_at ?? null,
        },
        members,
        offers,
      };
    });

    return {
      generatedAt: new Date().toISOString(),
      summary: {
        total: kitchens.length,
        active: kitchens.filter((kitchen) => kitchen.status === 'active').length,
        suspended: kitchens.filter((kitchen) => kitchen.status === 'suspended')
          .length,
        pending: kitchens.filter((kitchen) => kitchen.status === 'pending').length,
        closed: kitchens.filter((kitchen) => kitchen.status === 'closed').length,
        totalRevenue: kitchens.reduce(
          (sum, kitchen) => sum + kitchen.stats.revenue,
          0,
        ),
        totalOrders: kitchens.reduce(
          (sum, kitchen) => sum + kitchen.stats.orderCount,
          0,
        ),
        activeOffers: kitchens.reduce(
          (sum, kitchen) => sum + kitchen.stats.activeOffers,
          0,
        ),
      },
      kitchens,
    };
  }

  async subscriptionAnalytics() {
    const admin = this.supabase.getAdminClient();
    const now = Date.now();
    const [customersResult, plansResult, subscriptionsResult, paymentsResult] =
      await Promise.all([
        admin
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'customer'),
        admin
          .from('subscription_plans')
          .select(
            'id, code, name, description, price_amount, currency, billing_interval, interval_count, is_active, created_at',
          )
          .order('price_amount'),
        admin
          .from('subscriptions')
          .select(
            'id, user_id, plan_id, status, provider, current_period_start, current_period_end, cancel_at_period_end, cancelled_at, activated_at, created_at',
          ),
        admin
          .from('payments')
          .select(
            'id, user_id, subscription_id, amount, refunded_amount, currency, status, paid_at, created_at',
          )
          .eq('type', 'subscription')
          .in('status', [...PAID_PAYMENT_STATUSES]),
      ]);

    const failure = [
      customersResult,
      plansResult,
      subscriptionsResult,
      paymentsResult,
    ].find((result) => result.error);
    if (failure?.error) {
      throw new InternalServerErrorException(failure.error.message);
    }

    const subscriptions = subscriptionsResult.data ?? [];
    const payments = paymentsResult.data ?? [];
    const trialUserIds = new Set(
      subscriptions
        .filter((subscription) => subscription.provider === 'internal_trial')
        .map((subscription) => subscription.user_id),
    );
    const paidPayments = payments.filter((payment) =>
      PAID_PAYMENT_STATUSES.has(String(payment.status)),
    );
    const paidUserIds = new Set(paidPayments.map((payment) => payment.user_id));
    const convertedTrialUserIds = new Set(
      [...paidUserIds].filter((userId) => trialUserIds.has(userId)),
    );
    const paidSubscriptions = subscriptions.filter(
      (subscription) => subscription.provider !== 'internal_trial',
    );
    const cancelledPaidUserIds = new Set(
      paidSubscriptions
        .filter(
          (subscription) =>
            subscription.cancel_at_period_end === true ||
            ['cancel_at_period_end', 'cancelled'].includes(
              String(subscription.status),
            ) ||
            Boolean(subscription.cancelled_at),
        )
        .map((subscription) => subscription.user_id)
        .filter((userId) => paidUserIds.has(userId)),
    );
    const activePaidUserIds = new Set(
      paidSubscriptions
        .filter(
          (subscription) =>
            ACTIVE_SUBSCRIPTION_STATUSES.has(String(subscription.status)) &&
            Boolean(subscription.current_period_end) &&
            new Date(String(subscription.current_period_end)).getTime() > now,
        )
        .map((subscription) => subscription.user_id),
    );
    const activeTrialUserIds = new Set(
      subscriptions
        .filter(
          (subscription) =>
            subscription.provider === 'internal_trial' &&
            ACTIVE_SUBSCRIPTION_STATUSES.has(String(subscription.status)) &&
            Boolean(subscription.current_period_end) &&
            new Date(String(subscription.current_period_end)).getTime() > now,
        )
        .map((subscription) => subscription.user_id),
    );
    const netRevenue = (payment: (typeof paidPayments)[number]) =>
      Math.max(0, Number(payment.amount) - Number(payment.refunded_amount ?? 0));
    const totalRevenue = paidPayments.reduce(
      (sum, payment) => sum + netRevenue(payment),
      0,
    );
    const customerCount = customersResult.count ?? 0;
    const percentage = (numerator: number, denominator: number) =>
      denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : 0;

    const plans = (plansResult.data ?? []).map((plan) => {
      const planSubscriptions = paidSubscriptions.filter(
        (subscription) => subscription.plan_id === plan.id,
      );
      const planSubscriptionIds = new Set(
        planSubscriptions.map((subscription) => subscription.id),
      );
      const planPayments = paidPayments.filter((payment) =>
        planSubscriptionIds.has(payment.subscription_id),
      );
      const buyerIds = new Set(planPayments.map((payment) => payment.user_id));
      const activeBuyerIds = new Set(
        planSubscriptions
          .filter(
            (subscription) =>
              ACTIVE_SUBSCRIPTION_STATUSES.has(String(subscription.status)) &&
              Boolean(subscription.current_period_end) &&
              new Date(String(subscription.current_period_end)).getTime() > now,
          )
          .map((subscription) => subscription.user_id),
      );
      const cancelledBuyerIds = new Set(
        planSubscriptions
          .filter(
            (subscription) =>
              subscription.cancel_at_period_end === true ||
              ['cancel_at_period_end', 'cancelled'].includes(
                String(subscription.status),
              ) ||
              Boolean(subscription.cancelled_at),
          )
          .map((subscription) => subscription.user_id)
          .filter((userId) => buyerIds.has(userId)),
      );
      const convertedBuyerIds = new Set(
        [...buyerIds].filter((userId) => trialUserIds.has(userId)),
      );
      const revenue = planPayments.reduce(
        (sum, payment) => sum + netRevenue(payment),
        0,
      );

      return {
        ...plan,
        metrics: {
          revenue,
          revenueSharePercent: percentage(revenue, totalRevenue),
          buyers: buyerIds.size,
          activeSubscribers: activeBuyerIds.size,
          paymentCount: planPayments.length,
          trialConversions: convertedBuyerIds.size,
          cancellations: cancelledBuyerIds.size,
          cancellationRatePercent: percentage(
            cancelledBuyerIds.size,
            buyerIds.size,
          ),
        },
      };
    });

    return {
      generatedAt: new Date().toISOString(),
      summary: {
        customers: customerCount,
        revenue: totalRevenue,
        payingCustomers: paidUserIds.size,
        payingCustomerRatePercent: percentage(paidUserIds.size, customerCount),
        activePaidSubscribers: activePaidUserIds.size,
        activePaidRatePercent: percentage(
          activePaidUserIds.size,
          customerCount,
        ),
        trialUsers: trialUserIds.size,
        activeTrials: activeTrialUserIds.size,
        convertedTrials: convertedTrialUserIds.size,
        trialConversionRatePercent: percentage(
          convertedTrialUserIds.size,
          trialUserIds.size,
        ),
        cancelledCustomers: cancelledPaidUserIds.size,
        cancellationRatePercent: percentage(
          cancelledPaidUserIds.size,
          paidUserIds.size,
        ),
        successfulPayments: paidPayments.length,
      },
      plans,
      definitions: {
        revenue: 'Tổng tiền subscription đã thu trừ số tiền hoàn lại.',
        payingCustomerRate:
          'Khách từng thanh toán subscription thành công / tổng khách hàng.',
        activePaidRate:
          'Khách trả phí còn thời hạn sử dụng / tổng khách hàng.',
        trialConversion:
          'Khách từng dùng thử và sau đó thanh toán / tổng khách từng dùng thử.',
        cancellationRate:
          'Khách trả phí từng yêu cầu hoặc đã hủy / tổng khách từng trả phí.',
      },
    };
  }

  async updateKitchenStatus(kitchenId: string, status: AdminKitchenStatus) {
    const admin = this.supabase.getAdminClient();
    const { data, error } = await admin
      .from('kitchens')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', kitchenId)
      .select('id, name, slug, status, updated_at')
      .maybeSingle();
    if (error) throw new InternalServerErrorException(error.message);
    if (!data) throw new NotFoundException('Không tìm thấy tài khoản nhà bếp');
    return data;
  }
}
