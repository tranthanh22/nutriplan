import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from '../../common/auth/auth-user.interface';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ConfirmMealEatenDto } from './dto/confirm-meal-eaten.dto';
import { GenerateMenuDayDto } from './dto/generate-menu-day.dto';
import { MenuRangeQueryDto } from './dto/menu-range-query.dto';
import { ReplaceMealDto } from './dto/replace-meal.dto';
import { RequestKitchenMealChangeDto } from './dto/request-kitchen-meal-change.dto';
import { MealPlansService } from './meal-plans.service';

@ApiTags('Meal plans')
@ApiBearerAuth()
@Controller('meal-plans')
export class MealPlansController {
  constructor(private readonly mealPlans: MealPlansService) {}

  @Get('current')
  @ApiOperation({ summary: 'Kế hoạch tuần hiện hành dành cho subscriber' })
  current(@CurrentUser() user: AuthUser) {
    return this.mealPlans.current(user);
  }

  @Get('mine')
  @ApiOperation({
    summary: 'Thực đơn cá nhân, thực đơn bếp đã đăng ký và Meal Log trong khoảng ngày',
  })
  mine(
    @CurrentUser() user: AuthUser,
    @Query() query: MenuRangeQueryDto,
  ) {
    return this.mealPlans.mine(user, query);
  }

  @Post('days')
  @ApiOperation({ summary: 'Tạo thực đơn cá nhân cho một ngày trống (Plus)' })
  generateDay(
    @CurrentUser() user: AuthUser,
    @Body() dto: GenerateMenuDayDto,
  ) {
    return this.mealPlans.generateDay(user, dto.plannedDate);
  }

  @Get('journal')
  @ApiOperation({ summary: 'Nhật ký dinh dưỡng của người dùng' })
  journal(
    @CurrentUser() user: AuthUser,
    @Query() query: MenuRangeQueryDto,
  ) {
    return this.mealPlans.journal(user, query);
  }

  @Get('items/:itemId/replacements')
  @ApiOperation({ summary: 'Các món thay thế vẫn giữ cân bằng dinh dưỡng ngày' })
  replacements(
    @CurrentUser() user: AuthUser,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return this.mealPlans.replacements(user, itemId);
  }

  @Patch('items/:itemId/replace')
  @ApiOperation({ summary: 'Thay món trong kế hoạch cá nhân bằng lựa chọn an toàn' })
  replace(
    @CurrentUser() user: AuthUser,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: ReplaceMealDto,
  ) {
    return this.mealPlans.replace(user, itemId, dto);
  }

  @Post('items/:itemId/confirm-eaten')
  @ApiOperation({ summary: 'Xác nhận đã ăn món cá nhân và ghi Meal Log' })
  confirmPersonalMeal(
    @CurrentUser() user: AuthUser,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: ConfirmMealEatenDto,
  ) {
    return this.mealPlans.confirmPersonalMeal(user, itemId, dto);
  }

  @Post('kitchen/:dailyOrderId/confirm-eaten')
  @ApiOperation({ summary: 'Xác nhận đã ăn suất bếp đã giao và ghi Meal Log' })
  confirmKitchenMeal(
    @CurrentUser() user: AuthUser,
    @Param('dailyOrderId', ParseUUIDPipe) dailyOrderId: string,
    @Body() dto: ConfirmMealEatenDto,
  ) {
    return this.mealPlans.confirmKitchenMeal(user, dailyOrderId, dto);
  }

  @Post('kitchen/items/:dailyOrderItemId/confirm-eaten')
  @ApiOperation({ summary: 'Xác nhận đã ăn từng món bếp và ghi Meal Log' })
  confirmKitchenMealItem(
    @CurrentUser() user: AuthUser,
    @Param('dailyOrderItemId', ParseUUIDPipe) dailyOrderItemId: string,
    @Body() dto: ConfirmMealEatenDto,
  ) {
    return this.mealPlans.confirmKitchenMealItem(
      user,
      dailyOrderItemId,
      dto,
    );
  }

  @Post('kitchen/items/:dailyOrderItemId/change-requests')
  @ApiOperation({ summary: 'Khách hàng yêu cầu bếp đổi món chưa chuẩn bị' })
  requestKitchenMealChange(
    @CurrentUser() user: AuthUser,
    @Param('dailyOrderItemId', ParseUUIDPipe) dailyOrderItemId: string,
    @Body() dto: RequestKitchenMealChangeDto,
  ) {
    return this.mealPlans.requestKitchenMealChange(
      user,
      dailyOrderItemId,
      dto,
    );
  }
}
