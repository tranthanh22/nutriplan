import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from '../../common/auth/auth-user.interface';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
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
}
