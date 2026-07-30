import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from '../../common/auth/auth-user.interface';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpsertDailyWellnessDto } from './dto/upsert-daily-wellness.dto';
import { WellnessService } from './wellness.service';

@ApiTags('Daily wellness')
@ApiBearerAuth()
@Controller('wellness-checkins')
export class WellnessController {
  constructor(private readonly wellness: WellnessService) {}

  @Get('today')
  @ApiOperation({ summary: 'Lấy check-in sức khỏe của ngày hôm nay' })
  today(@CurrentUser() user: AuthUser) {
    return this.wellness.getToday(user);
  }

  @Put('today')
  @ApiOperation({ summary: 'Tạo hoặc cập nhật check-in sức khỏe hôm nay' })
  upsertToday(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpsertDailyWellnessDto,
  ) {
    return this.wellness.upsertToday(user, dto);
  }
}
