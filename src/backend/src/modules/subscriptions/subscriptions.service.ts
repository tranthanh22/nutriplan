import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import type { AuthUser } from '../../common/auth/auth-user.interface';
import { SupabaseService } from '../../database/supabase.service';
import type { CreateSubscriptionCheckoutDto } from './dto/create-subscription-checkout.dto';

interface CheckoutMetadata {
  checkout_url?: unknown;
  stripe_session_id?: unknown;
  stripe_attempt?: unknown;
}

interface CheckoutRecord {
  subscription_id: string;
  payment_id: string;
  plan_code: string;
  plan_name: string;
  price_amount: number | string;
  currency: string;
  access_days: number;
  payment_status: string;
  payment_metadata: CheckoutMetadata | null;
}

interface PlanBilling {
  billing_interval: 'day' | 'month' | 'year';
  interval_count: number;
}

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);
  private stripeClient?: Stripe;
  private portalConfigurationId?: string;

  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService,
  ) {}

  async listPlans() {
    const { data, error } = await this.supabase
      .getPublicClient()
      .from('subscription_plans')
      .select(
        'id, code, name, description, price_amount, currency, billing_interval, interval_count, features',
      )
      .eq('is_active', true)
      .order('price_amount');
    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async current(user: AuthUser) {
    const client = this.supabase.createUserClient(user.accessToken);
    const { data: active, error: activeError } = await client
      .from('subscriptions')
      .select('*, subscription_plans(*)')
      .in('status', ['active', 'cancel_at_period_end'])
      .order('current_period_end', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (activeError)
      throw new InternalServerErrorException(activeError.message);
    if (active) return active;

    const { data: pending, error: pendingError } = await client
      .from('subscriptions')
      .select('*, subscription_plans(*)')
      .eq('status', 'pending_payment')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (pendingError)
      throw new InternalServerErrorException(pendingError.message);
    return pending;
  }

  async hasActive(user: AuthUser) {
    const current = await this.current(user);
    if (!current) return false;
    if (
      !['active', 'cancel_at_period_end'].includes(current.status as string)
    ) {
      return false;
    }
    return Boolean(
      current.current_period_end &&
      new Date(current.current_period_end as string) > new Date(),
    );
  }

  async startTrial(user: AuthUser) {
    const current = await this.current(user);
    if (
      current &&
      ['active', 'cancel_at_period_end'].includes(String(current.status)) &&
      current.current_period_end &&
      new Date(String(current.current_period_end)) > new Date()
    ) {
      return current;
    }

    const admin = this.supabase.getAdminClient();
    const { data: previousTrial, error: previousTrialError } = await admin
      .from('subscriptions')
      .select('id, status, current_period_end')
      .eq('user_id', user.id)
      .eq('provider', 'internal_trial')
      .limit(1)
      .maybeSingle();
    if (previousTrialError) {
      throw new InternalServerErrorException(previousTrialError.message);
    }
    if (previousTrial) {
      throw new ForbiddenException(
        'Tài khoản này đã sử dụng gói dùng thử 7 ngày',
      );
    }

    const { data: plan, error: planError } = await admin
      .from('subscription_plans')
      .select('id')
      .eq('code', 'weekly')
      .eq('is_active', true)
      .maybeSingle();
    if (planError) throw new InternalServerErrorException(planError.message);
    if (!plan) {
      throw new ServiceUnavailableException(
        'Chưa cấu hình gói dùng thử 7 ngày',
      );
    }

    const periodStart = new Date();
    const periodEnd = new Date(periodStart.getTime() + 7 * 86_400_000);
    const { data: trial, error: trialError } = await admin
      .from('subscriptions')
      .insert({
        user_id: user.id,
        plan_id: plan.id,
        status: 'active',
        provider: 'internal_trial',
        provider_subscription_id: `trial:${user.id}`,
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        activated_at: periodStart.toISOString(),
      })
      .select('*, subscription_plans(*)')
      .single();
    if (trialError) {
      if (trialError.code === '23505') {
        throw new ForbiddenException(
          'Tài khoản đã có gói Plus hoặc đã sử dụng gói dùng thử',
        );
      }
      throw new InternalServerErrorException(trialError.message);
    }
    return trial;
  }

  async createCheckout(user: AuthUser, dto: CreateSubscriptionCheckoutDto) {
    const current = await this.current(user);
    if (
      current &&
      ['active', 'cancel_at_period_end'].includes(String(current.status)) &&
      current.current_period_end &&
      new Date(String(current.current_period_end)) > new Date()
    ) {
      throw new BadRequestException(
        'Bạn đang có gói Plus còn hiệu lực. Hãy quản lý tự động gia hạn trong Cài đặt.',
      );
    }
    const admin = this.supabase.getAdminClient();
    const { data, error } = await admin.rpc('create_subscription_checkout', {
      p_user_id: user.id,
      p_plan_id: dto.planId,
      p_idempotency_key: dto.idempotencyKey,
    });

    if (error) {
      if (error.message.includes('subscription_plan_not_found')) {
        throw new BadRequestException(
          'Gói subscription không tồn tại hoặc đã ngừng bán',
        );
      }
      if (error.message.includes('idempotency_key_conflict')) {
        throw new BadRequestException(
          'Mã giao dịch đã được dùng cho yêu cầu khác',
        );
      }
      throw new InternalServerErrorException(error.message);
    }

    const checkout = (
      Array.isArray(data) ? data[0] : data
    ) as CheckoutRecord | null;
    if (!checkout) {
      throw new InternalServerErrorException('Không thể khởi tạo giao dịch');
    }

    if (checkout.payment_status === 'succeeded') {
      return {
        status: 'already_paid',
        paymentId: checkout.payment_id,
        subscriptionId: checkout.subscription_id,
      };
    }

    const stripe = this.getStripe();
    const billing = await this.getPlanBilling(checkout.plan_code);
    const frontendUrl = this.config
      .getOrThrow<string>('FRONTEND_URL')
      .replace(/\/$/, '');
    const storedSessionId = this.readMetadataString(
      checkout.payment_metadata,
      'stripe_session_id',
    );
    const storedUrl = this.readMetadataString(
      checkout.payment_metadata,
      'checkout_url',
    );

    let storedSession: Stripe.Checkout.Session | null = null;
    if (storedSessionId) {
      try {
        storedSession =
          await stripe.checkout.sessions.retrieve(storedSessionId);
      } catch {
        // Session cũ hết hạn hoặc không còn đọc được: tạo session mới.
      }
    }

    if (storedSession?.status === 'open' && storedUrl) {
      return {
        checkoutUrl: storedUrl,
        paymentId: checkout.payment_id,
        subscriptionId: checkout.subscription_id,
        expiresAt: storedSession.expires_at
          ? new Date(storedSession.expires_at * 1000).toISOString()
          : null,
        testMode: this.isTestMode(),
      };
    }

    if (
      storedSession?.status === 'complete' &&
      storedSession.payment_status === 'paid'
    ) {
      await this.fulfillCheckoutSession(
        storedSession,
        `checkout.reconcile.${storedSession.id}`,
      );
      return {
        status: 'already_paid',
        paymentId: checkout.payment_id,
        subscriptionId: checkout.subscription_id,
      };
    }

    if (!['pending', 'processing'].includes(checkout.payment_status)) {
      const { error: resetError } = await admin
        .from('payments')
        .update({
          status: 'pending',
          failure_code: null,
          failure_message: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', checkout.payment_id)
        .eq('user_id', user.id);
      if (resetError) {
        throw new InternalServerErrorException(resetError.message);
      }
    }

    const attempt =
      this.readMetadataNumber(checkout.payment_metadata, 'stripe_attempt') + 1;
    const customerId = await this.getOrCreateStripeCustomer(user);
    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.create(
        {
          mode: 'subscription',
          payment_method_types: ['card'],
          client_reference_id: user.id,
          customer: customerId,
          subscription_data: {
            metadata: {
              paymentId: String(checkout.payment_id),
              subscriptionId: String(checkout.subscription_id),
              userId: user.id,
              planCode: String(checkout.plan_code),
            },
          },
          line_items: [
            {
              quantity: 1,
              price_data: {
                currency: String(checkout.currency).toLowerCase(),
                unit_amount: Math.round(Number(checkout.price_amount)),
                recurring: {
                  interval: billing.billing_interval,
                  interval_count: billing.interval_count,
                },
                product_data: {
                  name: String(checkout.plan_name),
                  description: `NutriPlan Plus tự động gia hạn mỗi ${this.describeBillingCycle(billing)}`,
                },
              },
            },
          ],
          metadata: {
            paymentId: String(checkout.payment_id),
            subscriptionId: String(checkout.subscription_id),
            userId: user.id,
            planCode: String(checkout.plan_code),
          },
          success_url: `${frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${frontendUrl}/app?checkout=cancelled`,
          expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
        },
        { idempotencyKey: `${checkout.payment_id}:checkout:${attempt}` },
      );
    } catch (stripeError) {
      throw new BadGatewayException(
        stripeError instanceof Error
          ? stripeError.message
          : 'Không thể kết nối Stripe',
      );
    }

    if (!session.url) {
      throw new BadGatewayException('Stripe không trả về checkout URL');
    }

    const { error: updateError } = await admin
      .from('payments')
      .update({
        provider_payment_id: session.id,
        status: 'pending',
        failure_code: null,
        failure_message: null,
        metadata: {
          checkout_url: session.url,
          stripe_session_id: session.id,
          stripe_attempt: attempt,
          test_mode: this.isTestMode(),
        },
      })
      .eq('id', checkout.payment_id)
      .eq('user_id', user.id);

    if (updateError) {
      throw new InternalServerErrorException(updateError.message);
    }

    return {
      checkoutUrl: session.url,
      paymentId: checkout.payment_id,
      subscriptionId: checkout.subscription_id,
      expiresAt: new Date(session.expires_at * 1000).toISOString(),
      testMode: this.isTestMode(),
    };
  }

  async createBillingPortal(user: AuthUser) {
    const stripe = this.getStripe();
    const frontendUrl = this.config
      .getOrThrow<string>('FRONTEND_URL')
      .replace(/\/$/, '');

    try {
      const [customerId, configurationId] = await Promise.all([
        this.getOrCreateStripeCustomer(user),
        this.getOrCreatePortalConfiguration(stripe, frontendUrl),
      ]);
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        configuration: configurationId,
        return_url: `${frontendUrl}/?settings=billing`,
      });
      return {
        url: session.url,
        testMode: this.isTestMode(),
      };
    } catch (error) {
      if (
        error instanceof ServiceUnavailableException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      throw new BadGatewayException(
        error instanceof Error
          ? error.message
          : 'Không thể mở trang quản lý thanh toán Stripe',
      );
    }
  }

  async cancelAtPeriodEnd(user: AuthUser) {
    const current = await this.current(user);
    if (!current) {
      throw new BadRequestException(
        'Bạn chưa có gói subscription đang hoạt động',
      );
    }

    if (String(current.status) === 'cancel_at_period_end') {
      return current;
    }
    if (
      String(current.status) !== 'active' ||
      !current.current_period_end ||
      new Date(String(current.current_period_end)) <= new Date()
    ) {
      throw new BadRequestException('Gói hiện tại không còn hiệu lực để hủy');
    }

    const providerSubscriptionId = String(
      current.provider_subscription_id ?? '',
    );
    if (
      String(current.provider) === 'stripe' &&
      providerSubscriptionId.startsWith('sub_')
    ) {
      try {
        const stripeSubscription = await this.getStripe().subscriptions.update(
          providerSubscriptionId,
          { cancel_at_period_end: true },
        );
        await this.syncStripeSubscription(stripeSubscription);
        return await this.current(user);
      } catch (error) {
        if (
          error instanceof ServiceUnavailableException ||
          error instanceof InternalServerErrorException
        ) {
          throw error;
        }
        throw new BadGatewayException(
          error instanceof Error
            ? error.message
            : 'Không thể tắt tự động gia hạn trên Stripe',
        );
      }
    }

    const cancelledAt = new Date().toISOString();
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('subscriptions')
      .update({
        status: 'cancel_at_period_end',
        cancel_at_period_end: true,
        cancelled_at: cancelledAt,
        updated_at: cancelledAt,
      })
      .eq('id', String(current.id))
      .eq('user_id', user.id)
      .eq('status', 'active')
      .select('*, subscription_plans(*)')
      .maybeSingle();

    if (error) throw new InternalServerErrorException(error.message);
    if (!data) {
      throw new BadRequestException(
        'Trạng thái gói vừa thay đổi. Vui lòng tải lại và thử lại.',
      );
    }
    return data;
  }

  async resumeAutoRenewal(user: AuthUser) {
    const current = await this.current(user);
    const providerSubscriptionId = String(
      current?.provider_subscription_id ?? '',
    );
    if (
      !current ||
      String(current.status) !== 'cancel_at_period_end' ||
      String(current.provider) !== 'stripe' ||
      !providerSubscriptionId.startsWith('sub_')
    ) {
      throw new BadRequestException(
        'Gói hiện tại không hỗ trợ bật lại tự động gia hạn',
      );
    }
    try {
      const stripeSubscription = await this.getStripe().subscriptions.update(
        providerSubscriptionId,
        { cancel_at_period_end: false },
      );
      await this.syncStripeSubscription(stripeSubscription);
      return await this.current(user);
    } catch (error) {
      if (
        error instanceof ServiceUnavailableException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }
      throw new BadGatewayException(
        error instanceof Error
          ? error.message
          : 'Không thể bật lại tự động gia hạn trên Stripe',
      );
    }
  }

  async checkoutStatus(user: AuthUser, sessionId: string) {
    const stripe = this.getStripe();
    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId);
    } catch (stripeError) {
      throw new BadGatewayException(
        stripeError instanceof Error
          ? stripeError.message
          : 'Không thể kiểm tra Stripe Checkout Session',
      );
    }

    if (
      session.client_reference_id !== user.id ||
      session.metadata?.userId !== user.id
    ) {
      throw new ForbiddenException(
        'Checkout Session không thuộc người dùng hiện tại',
      );
    }

    if (session.status === 'complete' && session.payment_status === 'paid') {
      await this.fulfillCheckoutSession(
        session,
        `checkout.reconcile.${session.id}`,
      );
    }

    return {
      sessionId: session.id,
      checkoutStatus: session.status,
      paymentStatus: session.payment_status,
      paid: session.status === 'complete' && session.payment_status === 'paid',
      testMode: !session.livemode,
      subscription: await this.current(user),
    };
  }

  async handleStripeWebhook(
    rawBody: Buffer | undefined,
    signature: string | undefined,
  ) {
    if (!rawBody || !signature) {
      throw new BadRequestException('Thiếu chữ ký hoặc raw body của Stripe');
    }

    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new ServiceUnavailableException(
        'Cổng thanh toán chưa được cấu hình: backend thiếu STRIPE_WEBHOOK_SECRET',
      );
    }

    let event: Stripe.Event;
    try {
      event = this.getStripe().webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (webhookError) {
      this.logger.warn(
        `Stripe webhook signature rejected: ${
          webhookError instanceof Error
            ? webhookError.message
            : 'unknown verification error'
        }`,
      );
      throw new BadRequestException('Chữ ký webhook Stripe không hợp lệ');
    }

    if (
      event.type === 'checkout.session.completed' ||
      event.type === 'checkout.session.async_payment_succeeded'
    ) {
      const session = event.data.object;
      if (session.payment_status !== 'paid') {
        return { received: true, pending: true };
      }
      return {
        received: true,
        result: await this.fulfillCheckoutSession(
          session,
          event.id,
          new Date(event.created * 1000).toISOString(),
        ),
      };
    }

    if (event.type === 'invoice.paid') {
      const invoice = event.data.object;
      if (invoice.billing_reason === 'subscription_cycle') {
        const subscriptionId = this.invoiceSubscriptionId(invoice);
        if (subscriptionId) {
          const subscription = await this.getStripe().subscriptions.retrieve(
            subscriptionId,
          );
          await this.syncStripeSubscription(subscription);
        }
      }
      return { received: true };
    }

    if (event.type === 'invoice.payment_failed') {
      const subscriptionId = this.invoiceSubscriptionId(event.data.object);
      if (subscriptionId) {
        await this.updateStripeSubscriptionStatus(
          subscriptionId,
          'payment_failed',
        );
      }
      return { received: true };
    }

    if (event.type === 'customer.subscription.updated') {
      await this.syncStripeSubscription(event.data.object);
      return { received: true };
    }

    if (event.type === 'customer.subscription.deleted') {
      await this.syncStripeSubscription(event.data.object);
      return { received: true };
    }

    if (event.type === 'checkout.session.expired') {
      const session = event.data.object;
      const paymentId = session.metadata?.paymentId;
      if (paymentId) {
        await this.supabase
          .getAdminClient()
          .from('payments')
          .update({
            status: 'cancelled',
            failure_code: 'checkout_expired',
            updated_at: new Date().toISOString(),
          })
          .eq('id', paymentId)
          .eq('status', 'pending');
      }
    }

    return { received: true };
  }

  private getStripe() {
    const key = this.config.get<string>('STRIPE_SECRET_KEY');
    if (!key) {
      throw new ServiceUnavailableException(
        'Cổng thanh toán chưa được cấu hình: backend thiếu STRIPE_SECRET_KEY (sk_test_...)',
      );
    }
    if (this.isTestMode() && !key.startsWith('sk_test_')) {
      throw new ServiceUnavailableException(
        'STRIPE_TEST_MODE=true yêu cầu STRIPE_SECRET_KEY bắt đầu bằng sk_test_',
      );
    }
    this.stripeClient ??= new Stripe(key, {
      maxNetworkRetries: 2,
      timeout: 20_000,
    });
    return this.stripeClient;
  }

  private async getOrCreateStripeCustomer(user: AuthUser) {
    const admin = this.supabase.getAdminClient();
    const { data: stored, error: storedError } = await admin
      .from('billing_customers')
      .select('provider_customer_id')
      .eq('user_id', user.id)
      .eq('provider', 'stripe')
      .maybeSingle();
    if (storedError) {
      throw new InternalServerErrorException(storedError.message);
    }

    const stripe = this.getStripe();
    const storedCustomerId =
      typeof stored?.provider_customer_id === 'string'
        ? stored.provider_customer_id
        : null;
    if (storedCustomerId) {
      try {
        const customer = await stripe.customers.retrieve(storedCustomerId);
        if (!customer.deleted) return customer.id;
      } catch {
        // Customer đã bị xóa trong Stripe: tạo lại và cập nhật ánh xạ.
      }
    }

    const customer = await stripe.customers.create(
      {
        ...(user.email ? { email: user.email } : {}),
        metadata: { userId: user.id },
      },
      { idempotencyKey: `nutriplan-customer:${user.id}` },
    );
    const { error: saveError } = await admin.from('billing_customers').upsert(
      {
        user_id: user.id,
        provider: 'stripe',
        provider_customer_id: customer.id,
      },
      { onConflict: 'user_id' },
    );
    if (saveError) throw new InternalServerErrorException(saveError.message);
    return customer.id;
  }

  private async getOrCreatePortalConfiguration(
    stripe: Stripe,
    frontendUrl: string,
  ) {
    const configured = this.config
      .get<string>('STRIPE_PORTAL_CONFIGURATION_ID')
      ?.trim();
    if (configured) return configured;
    if (this.portalConfigurationId) return this.portalConfigurationId;

    const marker = 'nutriplan-settings-v1';
    const existing = await stripe.billingPortal.configurations.list({
      active: true,
      limit: 100,
    });
    const matched = existing.data.find(
      (configuration) => configuration.metadata?.nutriplan === marker,
    );
    if (matched) {
      this.portalConfigurationId = matched.id;
      return matched.id;
    }

    const created = await stripe.billingPortal.configurations.create(
      {
        name: 'NutriPlan payment settings',
        default_return_url: `${frontendUrl}/?settings=billing`,
        metadata: { nutriplan: marker },
        features: {
          customer_update: {
            enabled: true,
            allowed_updates: ['name', 'email', 'address'],
          },
          invoice_history: { enabled: true },
          payment_method_update: { enabled: true },
          subscription_cancel: { enabled: false },
          subscription_update: { enabled: false },
        },
      },
      { idempotencyKey: marker },
    );
    this.portalConfigurationId = created.id;
    return created.id;
  }

  private async fulfillCheckoutSession(
    session: Stripe.Checkout.Session,
    providerEventId: string,
    paidAt = new Date().toISOString(),
  ) {
    const paymentId = session.metadata?.paymentId;
    if (!paymentId) {
      throw new BadRequestException('Stripe Session thiếu paymentId');
    }

    const providerSubscriptionId = this.checkoutSubscriptionId(session);
    const { data, error } = await this.supabase
      .getAdminClient()
      .rpc('complete_subscription_payment', {
        p_payment_id: paymentId,
        p_provider_event_id: providerEventId,
        p_provider_payment_id: providerSubscriptionId ?? session.id,
        p_paid_at: paidAt,
      });
    if (error) throw new InternalServerErrorException(error.message);
    if (providerSubscriptionId) {
      const subscription = await this.getStripe().subscriptions.retrieve(
        providerSubscriptionId,
      );
      await this.syncStripeSubscription(subscription);
    }
    return data;
  }

  private async getPlanBilling(planCode: string): Promise<PlanBilling> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('subscription_plans')
      .select('billing_interval, interval_count')
      .eq('code', planCode)
      .eq('is_active', true)
      .single();
    if (error || !data) {
      throw new InternalServerErrorException(
        error?.message ?? 'Không tìm thấy chu kỳ gia hạn của gói',
      );
    }
    if (!['day', 'month', 'year'].includes(String(data.billing_interval))) {
      throw new InternalServerErrorException(
        'Chu kỳ gói chưa được Stripe hỗ trợ',
      );
    }
    const intervalCount = Number(data.interval_count);
    if (!Number.isInteger(intervalCount) || intervalCount < 1) {
      throw new InternalServerErrorException('Chu kỳ gia hạn của gói không hợp lệ');
    }
    return {
      billing_interval: data.billing_interval as PlanBilling['billing_interval'],
      interval_count: intervalCount,
    };
  }

  private describeBillingCycle(billing: PlanBilling) {
    const unit =
      billing.billing_interval === 'day'
        ? 'ngày'
        : billing.billing_interval === 'month'
          ? 'tháng'
          : 'năm';
    return `${billing.interval_count} ${unit}`;
  }

  private checkoutSubscriptionId(session: Stripe.Checkout.Session) {
    if (typeof session.subscription === 'string') return session.subscription;
    return session.subscription?.id ?? null;
  }

  private invoiceSubscriptionId(invoice: Stripe.Invoice) {
    const subscription = invoice.parent?.subscription_details?.subscription;
    if (typeof subscription === 'string') return subscription;
    return subscription?.id ?? null;
  }

  private stripeSubscriptionPeriod(subscription: Stripe.Subscription) {
    const items = subscription.items.data;
    if (items.length === 0) return null;
    const start = Math.min(...items.map((item) => item.current_period_start));
    const end = Math.max(...items.map((item) => item.current_period_end));
    return {
      start: new Date(start * 1000).toISOString(),
      end: new Date(end * 1000).toISOString(),
    };
  }

  private async syncStripeSubscription(subscription: Stripe.Subscription) {
    const period = this.stripeSubscriptionPeriod(subscription);
    const ended = subscription.status === 'canceled';
    const entitled = ['active', 'trialing'].includes(subscription.status);
    const status = ended
      ? 'cancelled'
      : entitled
        ? subscription.cancel_at_period_end
          ? 'cancel_at_period_end'
          : 'active'
        : 'payment_failed';
    const timestamp = new Date().toISOString();
    const { error } = await this.supabase
      .getAdminClient()
      .from('subscriptions')
      .update({
        provider: 'stripe',
        status,
        cancel_at_period_end: subscription.cancel_at_period_end,
        cancelled_at: subscription.canceled_at
          ? new Date(subscription.canceled_at * 1000).toISOString()
          : null,
        ...(period
          ? {
              current_period_start: period.start,
              current_period_end: period.end,
            }
          : {}),
        updated_at: timestamp,
      })
      .eq('provider_subscription_id', subscription.id);
    if (error) throw new InternalServerErrorException(error.message);
  }

  private async updateStripeSubscriptionStatus(
    providerSubscriptionId: string,
    status: 'payment_failed',
  ) {
    const { error } = await this.supabase
      .getAdminClient()
      .from('subscriptions')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('provider', 'stripe')
      .eq('provider_subscription_id', providerSubscriptionId);
    if (error) throw new InternalServerErrorException(error.message);
  }

  private isTestMode() {
    return this.config.get<boolean>('STRIPE_TEST_MODE') ?? true;
  }

  private readMetadataString(
    metadata: CheckoutMetadata | null,
    key: keyof CheckoutMetadata,
  ) {
    const value = metadata?.[key];
    return typeof value === 'string' ? value : null;
  }

  private readMetadataNumber(
    metadata: CheckoutMetadata | null,
    key: keyof CheckoutMetadata,
  ) {
    const value = metadata?.[key];
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  }
}
