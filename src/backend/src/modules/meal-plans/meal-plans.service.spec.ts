import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../common/auth/auth-user.interface';
import { MealPlansService } from './meal-plans.service';

const user: AuthUser = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'customer@example.com',
  role: 'customer',
  accessToken: 'access-token',
};

function createService(active = true) {
  const rpc = jest.fn().mockResolvedValue({ data: [], error: null });
  const admin = { rpc };
  const supabase = {
    getAdminClient: jest.fn().mockReturnValue(admin),
  };
  const subscriptions = {
    hasActive: jest.fn().mockResolvedValue(active),
  };
  const service = new MealPlansService(
    supabase as never,
    subscriptions as never,
  );

  return { service, rpc, subscriptions };
}

describe('MealPlansService ownership and subscription checks', () => {
  it('requests replacement candidates for the authenticated owner only', async () => {
    const { service, rpc } = createService();
    const itemId = '22222222-2222-4222-8222-222222222222';

    await service.replacements(user, itemId);

    expect(rpc).toHaveBeenCalledWith(
      'get_personal_meal_replacement_candidates',
      {
        p_user_id: user.id,
        p_meal_plan_item_id: itemId,
      },
    );
  });

  it('rejects replacement requests without an active subscription', async () => {
    const { service, rpc } = createService(false);

    await expect(
      service.replacements(
        user,
        '22222222-2222-4222-8222-222222222222',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('confirms a personal meal using the authenticated user id', async () => {
    const { service, rpc } = createService();
    const itemId = '22222222-2222-4222-8222-222222222222';

    await service.confirmPersonalMeal(user, itemId, {
      consumedAt: '2026-07-28T12:00:00.000Z',
    });

    expect(rpc).toHaveBeenCalledWith('confirm_personal_meal_eaten', {
      p_user_id: user.id,
      p_meal_plan_item_id: itemId,
      p_consumed_at: '2026-07-28T12:00:00.000Z',
    });
  });

  it('confirms one kitchen item and records only that item', async () => {
    const { service, rpc } = createService();
    const itemId = '88888888-8888-4888-8888-888888888888';

    await service.confirmKitchenMealItem(user, itemId, {
      consumedAt: '2026-08-05T05:00:00.000Z',
    });

    expect(rpc).toHaveBeenCalledWith('confirm_kitchen_meal_item_eaten', {
      p_user_id: user.id,
      p_daily_order_item_id: itemId,
      p_consumed_at: '2026-08-05T05:00:00.000Z',
    });
  });

  it('generates an empty menu day for an active subscriber', async () => {
    const { service, rpc } = createService();

    await service.generateDay(user, '2026-08-12');

    expect(rpc).toHaveBeenCalledWith('ensure_personal_meal_plan_day', {
      p_user_id: user.id,
      p_planned_date: '2026-08-12',
    });
  });

  it('rejects menu day generation without an active subscription', async () => {
    const { service, rpc } = createService(false);

    await expect(service.generateDay(user, '2026-08-12')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(rpc).not.toHaveBeenCalled();
  });

  it('creates a kitchen meal change request for the order owner', async () => {
    const itemQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: {
          id: '33333333-3333-4333-8333-333333333333',
          daily_order_id: '44444444-4444-4444-8444-444444444444',
          dish_name: 'Cá hồi cơm Nhật',
          daily_orders: {
            user_id: user.id,
            kitchen_id: '55555555-5555-4555-8555-555555555555',
            status: 'accepted',
          },
        },
        error: null,
      }),
    };
    const single = jest.fn().mockResolvedValue({
      data: { id: '66666666-6666-4666-8666-666666666666', status: 'pending' },
      error: null,
    });
    const insertSelect = jest.fn().mockReturnValue({ single });
    const insert = jest.fn().mockReturnValue({ select: insertSelect });
    const admin = {
      from: jest.fn((table: string) =>
        table === 'daily_order_items' ? itemQuery : { insert },
      ),
    };
    const service = new MealPlansService(
      { getAdminClient: jest.fn().mockReturnValue(admin) } as never,
      { hasActive: jest.fn() } as never,
    );

    await service.requestKitchenMealChange(
      user,
      '33333333-3333-4333-8333-333333333333',
      { reason: 'diet_preference', note: ' Xin đổi món ít dầu. ' },
    );

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: user.id,
        current_dish_name: 'Cá hồi cơm Nhật',
        reason: 'diet_preference',
        note: 'Xin đổi món ít dầu.',
      }),
    );
  });

  it('hides a kitchen meal item that belongs to another customer', async () => {
    const itemQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: {
          id: '33333333-3333-4333-8333-333333333333',
          daily_order_id: '44444444-4444-4444-8444-444444444444',
          dish_name: 'Cá hồi cơm Nhật',
          daily_orders: {
            user_id: '77777777-7777-4777-8777-777777777777',
            kitchen_id: '55555555-5555-4555-8555-555555555555',
            status: 'accepted',
          },
        },
        error: null,
      }),
    };
    const service = new MealPlansService(
      {
        getAdminClient: jest.fn().mockReturnValue({
          from: jest.fn().mockReturnValue(itemQuery),
        }),
      } as never,
      { hasActive: jest.fn() } as never,
    );

    await expect(
      service.requestKitchenMealChange(
        user,
        '33333333-3333-4333-8333-333333333333',
        { reason: 'other' },
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
