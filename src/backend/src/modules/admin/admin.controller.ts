import { Body, Controller, Get, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { UpdateKitchenStatusDto } from './dto/update-kitchen-status.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Thống kê tổng quan toàn hệ thống dành cho admin' })
  dashboard() {
    return this.admin.dashboard();
  }

  @Get('kitchens')
  @ApiOperation({ summary: 'Danh sách tài khoản bếp, doanh thu và các gói đang bán' })
  kitchens() {
    return this.admin.kitchens();
  }

  @Get('subscriptions')
  @ApiOperation({ summary: 'Doanh thu và tỷ lệ chuyển đổi subscription theo từng gói' })
  subscriptions() {
    return this.admin.subscriptionAnalytics();
  }

  @Patch('kitchens/:kitchenId/status')
  @ApiOperation({ summary: 'Tạm ngưng hoặc cho phép một tài khoản bếp hoạt động' })
  updateKitchenStatus(
    @Param('kitchenId', ParseUUIDPipe) kitchenId: string,
    @Body() dto: UpdateKitchenStatusDto,
  ) {
    return this.admin.updateKitchenStatus(kitchenId, dto.status);
  }
}
