import { Injectable, InternalServerErrorException, NotImplementedException } from '@nestjs/common';
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

  create(_user: AuthUser, _dto: CreateKitchenOrderDto) {
    throw new NotImplementedException(
      'Khung API đã sẵn sàng; cần RPC transaction để khóa giá offer và tạo payment an toàn',
    );
  }

  updateStatus(_user: AuthUser, _orderId: string, _dto: UpdateOrderStatusDto) {
    throw new NotImplementedException(
      'Khung API đã sẵn sàng; cần state machine và audit trước khi cho bếp cập nhật trạng thái',
    );
  }
}
