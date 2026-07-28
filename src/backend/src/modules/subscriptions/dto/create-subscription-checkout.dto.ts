import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateSubscriptionCheckoutDto {
  @ApiProperty()
  @IsUUID()
  planId: string;

  @ApiProperty({ description: 'Khóa chống tạo giao dịch lặp từ client' })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  idempotencyKey: string;
}
