import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from '../../common/auth/auth-user.interface';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateKitchenOrderDto } from './dto/create-kitchen-order.dto';
import { UpdateDailyOrderItemDto } from './dto/update-daily-order-item.dto';
import { UpdateDailyOrderStatusDto } from './dto/update-daily-order-status.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@ApiTags('Kitchen orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get('mine')
  @ApiOperation({ summary: 'Đơn bếp của customer hiện hành' })
  mine(@CurrentUser() user: AuthUser) {
    return this.orders.mine(user);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo đơn demo và lịch món bếp theo gói đã chọn' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateKitchenOrderDto) {
    return this.orders.create(user, dto);
  }

  @Roles('kitchen_staff', 'admin')
  @Get('kitchen-dashboard')
  @ApiOperation({ summary: 'Tổng quan đơn hàng của các bếp được phân quyền' })
  kitchenDashboard(@CurrentUser() user: AuthUser) {
    return this.orders.kitchenDashboard(user);
  }

  @Roles('kitchen_staff', 'admin')
  @Patch(':id/status')
  @ApiOperation({ summary: 'Bếp cập nhật trạng thái đơn theo state machine' })
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) orderId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orders.updateStatus(user, orderId, dto);
  }

  @Roles('kitchen_staff', 'admin')
  @Patch(':orderId/daily-orders/:dailyOrderId/status')
  @ApiOperation({ summary: 'Bếp cập nhật tiến độ chuẩn bị và giao từng bữa trong gói' })
  updateDailyOrderStatus(
    @CurrentUser() user: AuthUser,
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Param('dailyOrderId', ParseUUIDPipe) dailyOrderId: string,
    @Body() dto: UpdateDailyOrderStatusDto,
  ) {
    return this.orders.updateDailyOrderStatus(user, orderId, dailyOrderId, dto);
  }

  @Roles('kitchen_staff', 'admin')
  @Patch(':orderId/daily-orders/:dailyOrderId/items/:itemId')
  @ApiOperation({ summary: 'Bếp thiết lập món và dinh dưỡng trước khi chuẩn bị' })
  updateDailyOrderItem(
    @CurrentUser() user: AuthUser,
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Param('dailyOrderId', ParseUUIDPipe) dailyOrderId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateDailyOrderItemDto,
  ) {
    return this.orders.updateDailyOrderItem(user, orderId, dailyOrderId, itemId, dto);
  }
}
