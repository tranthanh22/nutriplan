import type { AuthUser } from '../../common/auth/auth-user.interface';
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
    const service = new OrdersService({
      getAdminClient: jest.fn().mockReturnValue({ rpc }),
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
  });
});
