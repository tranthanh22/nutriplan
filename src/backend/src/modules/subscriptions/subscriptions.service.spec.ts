import {
  BadRequestException,
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import type { AuthUser } from '../../common/auth/auth-user.interface';
import { SubscriptionsService } from './subscriptions.service';

const user: AuthUser = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'customer@example.com',
  role: 'customer',
  accessToken: 'access-token',
};

function createConfig(overrides: Record<string, unknown> = {}) {
  const values: Record<string, unknown> = {
    STRIPE_TEST_MODE: true,
    STRIPE_SECRET_KEY: 'sk_test_example',
    STRIPE_WEBHOOK_SECRET: 'whsec_example',
    FRONTEND_URL: 'http://localhost:3000',
    ...overrides,
  };

  return {
    get: jest.fn((key: string) => values[key]),
    getOrThrow: jest.fn((key: string) => {
      if (values[key] === undefined || values[key] === '') {
        throw new Error(`${key} is required`);
      }
      return values[key];
    }),
  } as unknown as ConfigService;
}

function checkoutSession(
  overrides: Partial<Stripe.Checkout.Session> = {},
): Stripe.Checkout.Session {
  return {
    id: 'cs_test_owned',
    object: 'checkout.session',
    client_reference_id: user.id,
    livemode: false,
    metadata: {
      userId: user.id,
      paymentId: '22222222-2222-4222-8222-222222222222',
      subscriptionId: '33333333-3333-4333-8333-333333333333',
    },
    payment_status: 'paid',
    status: 'complete',
    ...overrides,
  } as Stripe.Checkout.Session;
}

function createService(config = createConfig()) {
  const rpc = jest.fn().mockResolvedValue({
    data: { duplicate: false },
    error: null,
  });
  const admin = { rpc };
  const supabase = {
    getAdminClient: jest.fn().mockReturnValue(admin),
  };
  const service = new SubscriptionsService(supabase as never, config);

  return { service, rpc };
}

function attachStripe(
  service: SubscriptionsService,
  session: Stripe.Checkout.Session,
  event?: Stripe.Event,
  subscription?: Stripe.Subscription,
) {
  const retrieve = jest.fn().mockResolvedValue(session);
  const retrieveSubscription = jest.fn().mockResolvedValue(subscription);
  const constructEvent = jest.fn().mockReturnValue(event);
  Object.defineProperty(service, 'stripeClient', {
    configurable: true,
    value: {
      checkout: { sessions: { retrieve } },
      subscriptions: { retrieve: retrieveSubscription },
      webhooks: { constructEvent },
    },
  });
  return { retrieve, retrieveSubscription, constructEvent };
}

describe('SubscriptionsService Stripe checkout', () => {
  it('initializes the Stripe CommonJS client used by NestJS', () => {
    expect(() => new Stripe('sk_test_example')).not.toThrow();
  });

  it('rejects checkout status when Stripe is not configured', async () => {
    const { service } = createService(
      createConfig({ STRIPE_SECRET_KEY: undefined }),
    );

    await expect(
      service.checkoutStatus(user, 'cs_test_missing'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('creates a recurring Stripe Checkout session using the plan interval', async () => {
    const rpc = jest.fn().mockResolvedValue({
      data: {
        subscription_id: '33333333-3333-4333-8333-333333333333',
        payment_id: '22222222-2222-4222-8222-222222222222',
        plan_code: 'monthly',
        plan_name: 'NutriPlan 1 tháng',
        price_amount: 49000,
        currency: 'VND',
        access_days: 30,
        payment_status: 'pending',
        payment_metadata: {},
      },
      error: null,
    });
    const savePayment = jest.fn().mockResolvedValue({ error: null });
    const eqId = jest.fn().mockReturnValue({ eq: savePayment });
    const update = jest.fn().mockReturnValue({ eq: eqId });
    const from = jest.fn().mockReturnValue({ update });
    const service = new SubscriptionsService(
      {
        getAdminClient: jest.fn().mockReturnValue({ rpc, from }),
      } as never,
      createConfig(),
    );
    const createCheckoutSession = jest.fn().mockResolvedValue({
      id: 'cs_test_recurring',
      url: 'https://checkout.stripe.test/recurring',
      expires_at: 1_785_169_800,
    });
    Object.defineProperty(service, 'stripeClient', {
      configurable: true,
      value: { checkout: { sessions: { create: createCheckoutSession } } },
    });
    const internal = service as unknown as {
      getPlanBilling: () => Promise<{
        billing_interval: 'month';
        interval_count: number;
      }>;
      getOrCreateStripeCustomer: () => Promise<string>;
    };
    jest.spyOn(internal, 'getPlanBilling').mockResolvedValue({
      billing_interval: 'month',
      interval_count: 1,
    });
    jest
      .spyOn(internal, 'getOrCreateStripeCustomer')
      .mockResolvedValue('cus_test_owned');
    jest.spyOn(service, 'current').mockResolvedValue(null);

    await service.createCheckout(user, {
      planId: '66666666-6666-4666-8666-666666666666',
      idempotencyKey: 'checkout-recurring-test',
    });

    expect(createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'subscription',
        customer: 'cus_test_owned',
        subscription_data: {
          metadata: expect.objectContaining({
            userId: user.id,
            planCode: 'monthly',
          }),
        },
        line_items: [
          expect.objectContaining({
            price_data: expect.objectContaining({
              recurring: { interval: 'month', interval_count: 1 },
            }),
          }),
        ],
      }),
      expect.objectContaining({ idempotencyKey: expect.any(String) }),
    );
  });

  it('does not expose a Checkout Session owned by another user', async () => {
    const { service, rpc } = createService();
    attachStripe(
      service,
      checkoutSession({
        client_reference_id: '44444444-4444-4444-8444-444444444444',
      }),
    );

    await expect(
      service.checkoutStatus(user, 'cs_test_other_user'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('reconciles a paid session and returns the active subscription', async () => {
    const { service, rpc } = createService();
    const session = checkoutSession();
    attachStripe(service, session);
    const current = {
      id: session.metadata?.subscriptionId,
      status: 'active',
      current_period_end: '2026-08-28T00:00:00.000Z',
    };
    jest.spyOn(service, 'current').mockResolvedValue(current);

    await expect(
      service.checkoutStatus(user, session.id),
    ).resolves.toMatchObject({
      sessionId: session.id,
      paid: true,
      testMode: true,
      subscription: current,
    });
    expect(rpc).toHaveBeenCalledWith('complete_subscription_payment', {
      p_payment_id: session.metadata?.paymentId,
      p_provider_event_id: `checkout.reconcile.${session.id}`,
      p_provider_payment_id: session.id,
      p_paid_at: expect.any(String),
    });
  });

  it('stores the Stripe subscription id for recurring checkout', async () => {
    const { service, rpc } = createService();
    const stripeSubscription = {
      id: 'sub_test_recurring',
      object: 'subscription',
      status: 'active',
      cancel_at_period_end: false,
      canceled_at: null,
      items: {
        data: [
          {
            current_period_start: 1_785_168_000,
            current_period_end: 1_787_846_400,
          },
        ],
      },
    } as Stripe.Subscription;
    const session = checkoutSession({ subscription: stripeSubscription.id });
    attachStripe(service, session, undefined, stripeSubscription);
    const internal = service as unknown as {
      syncStripeSubscription: (
        subscription: Stripe.Subscription,
      ) => Promise<void>;
    };
    jest.spyOn(internal, 'syncStripeSubscription').mockResolvedValue();
    jest.spyOn(service, 'current').mockResolvedValue({
      id: session.metadata?.subscriptionId,
      status: 'active',
    });

    await service.checkoutStatus(user, session.id);

    expect(rpc).toHaveBeenCalledWith(
      'complete_subscription_payment',
      expect.objectContaining({
        p_provider_payment_id: stripeSubscription.id,
      }),
    );
    expect(internal.syncStripeSubscription).toHaveBeenCalledWith(
      stripeSubscription,
    );
  });

  it('rejects an unsigned webhook before processing it', async () => {
    const { service, rpc } = createService();

    await expect(
      service.handleStripeWebhook(Buffer.from('{}'), undefined),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('acknowledges an unpaid completion event without activating a plan', async () => {
    const { service, rpc } = createService();
    const session = checkoutSession({ payment_status: 'unpaid' });
    const event = {
      id: 'evt_test_pending',
      type: 'checkout.session.completed',
      created: 1_785_168_000,
      data: { object: session },
    } as Stripe.Event;
    const { constructEvent } = attachStripe(service, session, event);

    await expect(
      service.handleStripeWebhook(Buffer.from('{}'), 'signature'),
    ).resolves.toEqual({
      received: true,
      pending: true,
    });
    expect(constructEvent).toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it('creates an owned Stripe Customer Portal session', async () => {
    const { service } = createService();
    const createPortalSession = jest.fn().mockResolvedValue({
      id: 'bps_test_owned',
      url: 'https://billing.stripe.test/session',
    });
    Object.defineProperty(service, 'stripeClient', {
      configurable: true,
      value: {
        billingPortal: {
          sessions: { create: createPortalSession },
        },
      },
    });
    const internal = service as unknown as {
      getOrCreateStripeCustomer: (currentUser: AuthUser) => Promise<string>;
      getOrCreatePortalConfiguration: (
        stripe: Stripe,
        frontendUrl: string,
      ) => Promise<string>;
    };
    jest
      .spyOn(internal, 'getOrCreateStripeCustomer')
      .mockResolvedValue('cus_test_owned');
    jest
      .spyOn(internal, 'getOrCreatePortalConfiguration')
      .mockResolvedValue('bpc_test_settings');

    await expect(service.createBillingPortal(user)).resolves.toEqual({
      url: 'https://billing.stripe.test/session',
      testMode: true,
    });
    expect(createPortalSession).toHaveBeenCalledWith({
      customer: 'cus_test_owned',
      configuration: 'bpc_test_settings',
      return_url: 'http://localhost:3000/?settings=billing',
    });
  });
});

describe('SubscriptionsService free trial', () => {
  it('creates one server-backed seven-day trial without a payment', async () => {
    const insertedTrial = {
      id: '55555555-5555-4555-8555-555555555555',
      status: 'active',
      provider: 'internal_trial',
      current_period_end: '2026-08-12T00:00:00.000Z',
    };
    const previousTrialQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    };
    const insertSingle = jest.fn().mockResolvedValue({
      data: insertedTrial,
      error: null,
    });
    const insertSelect = jest.fn().mockReturnValue({ single: insertSingle });
    const insert = jest.fn().mockReturnValue({ select: insertSelect });
    const subscriptionsTable = { ...previousTrialQuery, insert };
    const planQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: { id: '66666666-6666-4666-8666-666666666666' },
        error: null,
      }),
    };
    const from = jest.fn((table: string) =>
      table === 'subscriptions' ? subscriptionsTable : planQuery,
    );
    const service = new SubscriptionsService(
      { getAdminClient: jest.fn().mockReturnValue({ from }) } as never,
      createConfig(),
    );
    jest.spyOn(service, 'current').mockResolvedValue(null);

    await expect(service.startTrial(user)).resolves.toEqual(insertedTrial);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: user.id,
        status: 'active',
        provider: 'internal_trial',
        provider_subscription_id: `trial:${user.id}`,
        current_period_start: expect.any(String),
        current_period_end: expect.any(String),
      }),
    );
  });

  it('does not allow the same account to start a second trial', async () => {
    const previousTrialQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: { id: '55555555-5555-4555-8555-555555555555', status: 'expired' },
        error: null,
      }),
    };
    const from = jest.fn().mockReturnValue(previousTrialQuery);
    const service = new SubscriptionsService(
      { getAdminClient: jest.fn().mockReturnValue({ from }) } as never,
      createConfig(),
    );
    jest.spyOn(service, 'current').mockResolvedValue(null);

    await expect(service.startTrial(user)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});

describe('SubscriptionsService cancellation', () => {
  it('schedules cancellation for the authenticated user and keeps the paid period', async () => {
    const current = {
      id: '77777777-7777-4777-8777-777777777777',
      user_id: user.id,
      status: 'active',
      current_period_end: '2099-08-28T00:00:00.000Z',
    };
    const cancelled = {
      ...current,
      status: 'cancel_at_period_end',
      cancel_at_period_end: true,
    };
    const maybeSingle = jest.fn().mockResolvedValue({
      data: cancelled,
      error: null,
    });
    const select = jest.fn().mockReturnValue({ maybeSingle });
    const eqStatus = jest.fn().mockReturnValue({ select });
    const eqUser = jest.fn().mockReturnValue({ eq: eqStatus });
    const eqId = jest.fn().mockReturnValue({ eq: eqUser });
    const update = jest.fn().mockReturnValue({ eq: eqId });
    const from = jest.fn().mockReturnValue({ update });
    const service = new SubscriptionsService(
      { getAdminClient: jest.fn().mockReturnValue({ from }) } as never,
      createConfig(),
    );
    jest.spyOn(service, 'current').mockResolvedValue(current);

    await expect(service.cancelAtPeriodEnd(user)).resolves.toEqual(cancelled);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'cancel_at_period_end',
        cancel_at_period_end: true,
        cancelled_at: expect.any(String),
      }),
    );
    expect(eqId).toHaveBeenCalledWith('id', current.id);
    expect(eqUser).toHaveBeenCalledWith('user_id', user.id);
    expect(eqStatus).toHaveBeenCalledWith('status', 'active');
  });

  it('is idempotent when cancellation was already scheduled', async () => {
    const current = {
      id: '77777777-7777-4777-8777-777777777777',
      status: 'cancel_at_period_end',
      current_period_end: '2099-08-28T00:00:00.000Z',
    };
    const { service } = createService();
    jest.spyOn(service, 'current').mockResolvedValue(current);

    await expect(service.cancelAtPeriodEnd(user)).resolves.toEqual(current);
  });

  it('turns off Stripe auto-renewal for a recurring subscription', async () => {
    const current = {
      id: '77777777-7777-4777-8777-777777777777',
      status: 'active',
      provider: 'stripe',
      provider_subscription_id: 'sub_test_recurring',
      current_period_end: '2099-08-28T00:00:00.000Z',
    };
    const scheduled = {
      ...current,
      status: 'cancel_at_period_end',
      cancel_at_period_end: true,
    };
    const stripeSubscription = {
      id: current.provider_subscription_id,
      object: 'subscription',
      cancel_at_period_end: true,
    } as Stripe.Subscription;
    const { service } = createService();
    const update = jest.fn().mockResolvedValue(stripeSubscription);
    Object.defineProperty(service, 'stripeClient', {
      configurable: true,
      value: { subscriptions: { update } },
    });
    const internal = service as unknown as {
      syncStripeSubscription: (
        subscription: Stripe.Subscription,
      ) => Promise<void>;
    };
    jest.spyOn(internal, 'syncStripeSubscription').mockResolvedValue();
    jest
      .spyOn(service, 'current')
      .mockResolvedValueOnce(current)
      .mockResolvedValueOnce(scheduled);

    await expect(service.cancelAtPeriodEnd(user)).resolves.toEqual(scheduled);
    expect(update).toHaveBeenCalledWith(current.provider_subscription_id, {
      cancel_at_period_end: true,
    });
    expect(internal.syncStripeSubscription).toHaveBeenCalledWith(
      stripeSubscription,
    );
  });

  it('can turn Stripe auto-renewal back on before period end', async () => {
    const current = {
      id: '77777777-7777-4777-8777-777777777777',
      status: 'cancel_at_period_end',
      provider: 'stripe',
      provider_subscription_id: 'sub_test_recurring',
      current_period_end: '2099-08-28T00:00:00.000Z',
    };
    const resumed = {
      ...current,
      status: 'active',
      cancel_at_period_end: false,
    };
    const stripeSubscription = {
      id: current.provider_subscription_id,
      object: 'subscription',
      cancel_at_period_end: false,
    } as Stripe.Subscription;
    const { service } = createService();
    const update = jest.fn().mockResolvedValue(stripeSubscription);
    Object.defineProperty(service, 'stripeClient', {
      configurable: true,
      value: { subscriptions: { update } },
    });
    const internal = service as unknown as {
      syncStripeSubscription: (
        subscription: Stripe.Subscription,
      ) => Promise<void>;
    };
    jest.spyOn(internal, 'syncStripeSubscription').mockResolvedValue();
    jest
      .spyOn(service, 'current')
      .mockResolvedValueOnce(current)
      .mockResolvedValueOnce(resumed);

    await expect(service.resumeAutoRenewal(user)).resolves.toEqual(resumed);
    expect(update).toHaveBeenCalledWith(current.provider_subscription_id, {
      cancel_at_period_end: false,
    });
  });
});
