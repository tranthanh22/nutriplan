import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotImplementedException,
} from '@nestjs/common';
import type { AuthUser } from '../../common/auth/auth-user.interface';
import { SupabaseService } from '../../database/supabase.service';
import type { CreateKitchenOrderDto } from './dto/create-kitchen-order.dto';
import type { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly supabase: SupabaseService) {}

  async mine(user: AuthUser) {
    const { data, error } = await this.supabase
      .createUserClient(user.accessToken)
      .from('kitchen_orders')
      .select('*, kitchens(id, name, slug), kitchen_order_items(*)')
      .order('created_at', { ascending: false });
    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async create(user: AuthUser, dto: CreateKitchenOrderDto) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .rpc('create_mock_kitchen_order_schedule', {
        p_user_id: user.id,
        p_offer_code: dto.offerCode,
        p_recipient_name: dto.recipientName,
        p_recipient_phone: dto.recipientPhone,
        p_delivery_address: dto.deliveryAddress,
        p_delivery_note: dto.deliveryNote ?? null,
        p_idempotency_key: dto.idempotencyKey,
        p_quantity: dto.quantity,
      });
    if (error) {
      if (error.message.includes('kitchen_offer_not_available')) {
        throw new BadRequestException('Gói bếp không còn khả dụng');
      }
      if (error.message.includes('invalid_kitchen_order_input')) {
        throw new BadRequestException('Thông tin nhận món chưa hợp lệ');
      }
      throw new InternalServerErrorException(error.message);
    }
    return data;
  }

  updateStatus(_user: AuthUser, _orderId: string, _dto: UpdateOrderStatusDto) {
    throw new NotImplementedException(
      'Khung API đã sẵn sàng; cần state machine và audit trước khi cho bếp cập nhật trạng thái',
    );
  }
}
