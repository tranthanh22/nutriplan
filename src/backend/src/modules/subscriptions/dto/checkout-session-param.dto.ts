import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength } from 'class-validator';

export class CheckoutSessionParamDto {
  @ApiProperty({ example: 'cs_test_...' })
  @IsString()
  @MaxLength(255)
  @Matches(/^cs_(test|live)_[A-Za-z0-9_]+$/, {
    message: 'sessionId không đúng định dạng Stripe Checkout Session',
  })
  sessionId: string;
}
