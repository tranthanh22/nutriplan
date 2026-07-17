import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateSubscriptionCheckoutDto {
  @ApiProperty()
  @IsUUID()
  planId: string;

  @ApiProperty({ description: 'Khóa chống tạo giao dịch lặp từ client' })
  @IsString()
  @MaxLength(100)
  idempotencyKey: string;
}
