import { ForbiddenException } from '@nestjs/common';
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
});
