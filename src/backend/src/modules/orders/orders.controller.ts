import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from '../../common/auth/auth-user.interface';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateKitchenOrderDto } from './dto/create-kitchen-order.dto';
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
  @ApiOperation({ summary: 'Tạo Kitchen Order (khung chờ RPC transaction)' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateKitchenOrderDto) {
    return this.orders.create(user, dto);
  }

  @Roles('kitchen_staff', 'admin')
  @Patch(':id/status')
  @ApiOperation({ summary: 'Bếp cập nhật trạng thái đơn (khung chờ state machine)' })
  updateStatus(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) orderId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orders.updateStatus(user, orderId, dto);
  }
}
