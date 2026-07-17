import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from '../../common/auth/auth-user.interface';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CreateSubscriptionCheckoutDto } from './dto/create-subscription-checkout.dto';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptions: SubscriptionsService) {}

  @Public()
  @Get('plans')
  @ApiOperation({ summary: 'Danh sách gói 7 ngày, 1 tháng và 3 tháng' })
  plans() {
    return this.subscriptions.listPlans();
  }

  @ApiBearerAuth()
  @Get('current')
  @ApiOperation({ summary: 'Subscription hiện hành của user' })
  current(@CurrentUser() user: AuthUser) {
    return this.subscriptions.current(user);
  }

  @ApiBearerAuth()
  @Post('checkout')
  @ApiOperation({ summary: 'Tạo checkout subscription (khung chờ payment provider)' })
  checkout(@CurrentUser() user: AuthUser, @Body() dto: CreateSubscriptionCheckoutDto) {
    return this.subscriptions.createCheckout(user, dto);
  }
}
