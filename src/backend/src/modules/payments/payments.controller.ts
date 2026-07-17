import { Body, Controller, Post } from '@nestjs/common';
import { NotImplementedException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  @Roles('admin')
  @Post('manual-confirmation')
  @ApiOperation({ summary: 'Xác nhận chuyển khoản thủ công (khung chờ idempotent transaction)' })
  confirm(@Body() _dto: ConfirmPaymentDto) {
    throw new NotImplementedException(
      'Cần chốt quy trình đối soát và RPC idempotent trước khi bật endpoint này',
    );
  }
}
