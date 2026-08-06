import type { AuthUser } from '../../common/auth/auth-user.interface';
import { DailyOrderStatus } from './dto/update-daily-order-status.dto';
import { OrdersService } from './orders.service';

const user: AuthUser = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'customer@example.com',
  role: 'customer',
  accessToken: 'access-token',
};

describe('OrdersService kitchen schedule creation', () => {
  it('creates the order through the transaction RPC for the authenticated user', async () => {
    const result = {
      id: '22222222-2222-4222-8222-222222222222',
      scheduledMeals: 7,
    };
    const rpc = jest.fn().mockResolvedValue({ data: result, error: null });
    const offerAvailabilityQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: { id: '55555555-5555-4555-8555-555555555555' },
        error: null,
      }),
    };
    const nutritionQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: {
          dietary_preferences: ['high_protein'],
          disliked_ingredients: ['cilantro'],
          food_allergies: ['peanut'],
          food_intolerances: ['lactose'],
        },
        error: null,
      }),
    };
    const orderUpdateEq = jest.fn().mockResolvedValue({ error: null });
    const orderQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { policy_snapshot: { cancellation: 'demo' } },
        error: null,
      }),
      update: jest.fn().mockReturnValue({ eq: orderUpdateEq }),
    };
    const from = jest.fn((table: string) => {
      if (table === 'kitchen_offers') return offerAvailabilityQuery;
      if (table === 'nutrition_profiles') return nutritionQuery;
      return orderQuery;
    });
    const service = new OrdersService({
      getAdminClient: jest.fn().mockReturnValue({ rpc, from }),
    } as never);

    await expect(
      service.create(user, {
        offerCode: 'fitbox-balance-7',
        recipientName: 'Nguyễn Minh Anh',
        recipientPhone: '+84901234567',
        deliveryAddress: { line1: '227 Nguyễn Văn Cừ' },
        deliveryNote: 'Ít cay',
        idempotencyKey: 'checkout-one',
        quantity: 1,
      }),
    ).resolves.toEqual(result);

    expect(rpc).toHaveBeenCalledWith('create_mock_kitchen_order_schedule', {
      p_user_id: user.id,
      p_offer_code: 'fitbox-balance-7',
      p_recipient_name: 'Nguyễn Minh Anh',
      p_recipient_phone: '+84901234567',
      p_delivery_address: { line1: '227 Nguyễn Văn Cừ' },
      p_delivery_note: 'Ít cay',
      p_idempotency_key: 'checkout-one',
      p_quantity: 1,
    });
    expect(orderQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({
        allergen_snapshot: ['peanut'],
        policy_snapshot: expect.objectContaining({
          cancellation: 'demo',
          customer_nutrition: expect.objectContaining({
            dietary_preferences: ['high_protein'],
            food_allergies: ['peanut'],
            food_intolerances: ['lactose'],
            disliked_ingredients: ['cilantro'],
          }),
        }),
      }),
    );
    expect(orderUpdateEq).toHaveBeenCalledWith('id', result.id);
  });

  it('blocks a new order when the kitchen account is not active', async () => {
    const offerAvailabilityQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    };
    const rpc = jest.fn();
    const service = new OrdersService({
      getAdminClient: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue(offerAvailabilityQuery),
        rpc,
      }),
    } as never);

    await expect(
      service.create(user, {
        offerCode: 'suspended-kitchen-offer',
        recipientName: 'Khách hàng',
        recipientPhone: '+84901234567',
        deliveryAddress: { line1: '227 Nguyễn Văn Cừ' },
        idempotencyKey: 'checkout-suspended',
        quantity: 1,
      }),
    ).rejects.toThrow('Gói bếp không còn khả dụng');

    expect(rpc).not.toHaveBeenCalled();
  });
});

describe('OrdersService package fulfillment', () => {
  const kitchenUser: AuthUser = {
    ...user,
    role: 'kitchen_staff',
  };

  it('lets an assigned kitchen member receive a scheduled meal and records history', async () => {
    const dailyOrderId = '33333333-3333-4333-8333-333333333333';
    const orderId = '22222222-2222-4222-8222-222222222222';
    const kitchenId = '44444444-4444-4444-8444-444444444444';
    const currentDailyOrder = {
      id: dailyOrderId,
      kitchen_order_id: orderId,
      kitchen_id: kitchenId,
      status: 'scheduled',
    };
    const updatedDailyOrder = { ...currentDailyOrder, status: 'accepted' };

    const dailySelectQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: currentDailyOrder, error: null }),
    };
    const dailyUpdateQuery = {
      eq: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: updatedDailyOrder, error: null }),
    };
    const dailyTable = {
      select: dailySelectQuery.select,
      update: jest.fn().mockReturnValue(dailyUpdateQuery),
    };
    Object.assign(dailyTable, { eq: dailySelectQuery.eq, maybeSingle: dailySelectQuery.maybeSingle });

    const membershipResult = Promise.resolve({
      data: [{ kitchen_id: kitchenId }],
      error: null,
    });
    const membershipQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn()
        .mockReturnValueOnce({ eq: jest.fn().mockReturnValue(membershipResult) }),
    };
    const insertHistory = jest.fn().mockResolvedValue({ error: null });
    const from = jest.fn((table: string) => {
      if (table === 'daily_orders') return dailyTable;
      if (table === 'kitchen_members') return membershipQuery;
      if (table === 'order_status_history') return { insert: insertHistory };
      throw new Error(`Unexpected table ${table}`);
    });
    const service = new OrdersService({
      getAdminClient: jest.fn().mockReturnValue({ from }),
    } as never);

    await expect(
      service.updateDailyOrderStatus(kitchenUser, orderId, dailyOrderId, {
        status: DailyOrderStatus.Accepted,
      }),
    ).resolves.toEqual(updatedDailyOrder);

    expect(dailyTable.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'accepted', accepted_at: expect.any(String) }),
    );
    expect(insertHistory).toHaveBeenCalledWith({
      daily_order_id: dailyOrderId,
      from_status: 'scheduled',
      to_status: 'accepted',
      changed_by: kitchenUser.id,
      note: null,
    });
  });

  it('rejects a kitchen dish containing an allergen declared by the customer', async () => {
    const dailyOrderId = '33333333-3333-4333-8333-333333333333';
    const orderId = '22222222-2222-4222-8222-222222222222';
    const dailyOrderQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: {
          id: dailyOrderId,
          kitchen_order_id: orderId,
          kitchen_id: '44444444-4444-4444-8444-444444444444',
          status: 'scheduled',
        },
        error: null,
      }),
    };
    const orderQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({
        data: { id: orderId, allergen_snapshot: ['đậu phộng'] },
        error: null,
      }),
    };
    const from = jest.fn((table: string) => {
      if (table === 'daily_orders') return dailyOrderQuery;
      if (table === 'kitchen_orders') return orderQuery;
      throw new Error(`Unexpected table ${table}`);
    });
    const service = new OrdersService({
      getAdminClient: jest.fn().mockReturnValue({ from }),
    } as never);

    await expect(
      service.updateDailyOrderItem(
        { ...kitchenUser, role: 'admin' },
        orderId,
        dailyOrderId,
        '55555555-5555-4555-8555-555555555555',
        {
          dishName: 'Gỏi gà sốt đậu phộng',
          ingredients: ['Gà', 'Đậu phộng'],
          servings: 1,
          caloriesKcal: 520,
          proteinG: 42,
          carbsG: 38,
          fatG: 21,
          allergens: ['Đậu phộng'],
        },
      ),
    ).rejects.toThrow('Món có dị nguyên khách đã khai báo: Đậu phộng');

    expect(from).not.toHaveBeenCalledWith('daily_order_items');
  });
});
