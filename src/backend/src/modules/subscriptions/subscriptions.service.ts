import { Injectable, InternalServerErrorException, NotImplementedException } from '@nestjs/common';
import type { AuthUser } from '../../common/auth/auth-user.interface';
import { SupabaseService } from '../../database/supabase.service';
import type { CreateSubscriptionCheckoutDto } from './dto/create-subscription-checkout.dto';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly supabase: SupabaseService) {}

  async listPlans() {
    const { data, error } = await this.supabase
      .getPublicClient()
      .from('subscription_plans')
      .select('id, code, name, description, price_amount, currency, billing_interval, interval_count, features')
      .eq('is_active', true)
      .order('price_amount');
    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async current(user: AuthUser) {
    const { data, error } = await this.supabase
      .createUserClient(user.accessToken)
      .from('subscriptions')
      .select('*, subscription_plans(*)')
      .in('status', ['active', 'cancel_at_period_end', 'pending_payment'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async hasActive(user: AuthUser) {
    const current = await this.current(user);
    if (!current) return false;
    if (!['active', 'cancel_at_period_end'].includes(current.status as string)) return false;
    return Boolean(current.current_period_end && new Date(current.current_period_end as string) > new Date());
  }

  createCheckout(_user: AuthUser, _dto: CreateSubscriptionCheckoutDto) {
    throw new NotImplementedException(
      'Khung API đã sẵn sàng; cần chốt provider/luồng chuyển khoản trước khi tạo transaction payment',
    );
  }
}
