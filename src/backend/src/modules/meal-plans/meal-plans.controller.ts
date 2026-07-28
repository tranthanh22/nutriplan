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
import { MenuRangeQueryDto } from './dto/menu-range-query.dto';
import { ReplaceMealDto } from './dto/replace-meal.dto';
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
}
