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
) {
  const retrieve = jest.fn().mockResolvedValue(session);
  const constructEvent = jest.fn().mockReturnValue(event);
  Object.defineProperty(service, 'stripeClient', {
    configurable: true,
    value: {
      checkout: { sessions: { retrieve } },
      webhooks: { constructEvent },
    },
  });
  return { retrieve, constructEvent };
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
    ).resolves.toEqual({ received: true, pending: true });
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
