import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from '../../common/auth/auth-user.interface';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CheckoutSessionParamDto } from './dto/checkout-session-param.dto';
import { ChangeSubscriptionPlanDto } from './dto/change-subscription-plan.dto';
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
  @Post('trial')
  @ApiOperation({
    summary: 'Kích hoạt một lần dùng thử NutriPlan Plus trong 7 ngày',
  })
  trial(@CurrentUser() user: AuthUser) {
    return this.subscriptions.startTrial(user);
  }

  @ApiBearerAuth()
  @Post('checkout')
  @ApiOperation({ summary: 'Tạo Stripe Checkout Session cho subscription' })
  checkout(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateSubscriptionCheckoutDto,
  ) {
    return this.subscriptions.createCheckout(user, dto);
  }

  @ApiBearerAuth()
  @Post('billing-portal')
  @ApiOperation({
    summary: 'Mở Stripe Customer Portal để quản lý phương thức thanh toán',
  })
  billingPortal(@CurrentUser() user: AuthUser) {
    return this.subscriptions.createBillingPortal(user);
  }

  @ApiBearerAuth()
  @Post('change-plan')
  @ApiOperation({
    summary: 'Đổi gói Stripe hiện tại và tính phần chênh lệch an toàn',
  })
  changePlan(
    @CurrentUser() user: AuthUser,
    @Body() dto: ChangeSubscriptionPlanDto,
  ) {
    return this.subscriptions.changePlan(user, dto.planId);
  }

  @ApiBearerAuth()
  @Post('cancel')
  @ApiOperation({
    summary: 'Hủy gói vào cuối kỳ và giữ quyền truy cập đến ngày hết hạn',
  })
  cancel(@CurrentUser() user: AuthUser) {
    return this.subscriptions.cancelAtPeriodEnd(user);
  }

  @ApiBearerAuth()
  @Post('resume')
  @ApiOperation({ summary: 'Bật lại tự động gia hạn trước khi gói kết thúc' })
  resume(@CurrentUser() user: AuthUser) {
    return this.subscriptions.resumeAutoRenewal(user);
  }

  @ApiBearerAuth()
  @Get('checkout/:sessionId')
  @ApiOperation({
    summary: 'Đối soát Stripe Checkout Session và trả subscription mới nhất',
  })
  checkoutStatus(
    @CurrentUser() user: AuthUser,
    @Param() params: CheckoutSessionParamDto,
  ) {
    return this.subscriptions.checkoutStatus(user, params.sessionId);
  }

  @Public()
  @Post('webhooks/stripe')
  @ApiOperation({ summary: 'Stripe webhook có kiểm tra chữ ký' })
  stripeWebhook(
    @Req() request: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature?: string,
  ) {
    return this.subscriptions.handleStripeWebhook(request.rawBody, signature);
  }
}
