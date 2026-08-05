import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum DailyOrderStatus {
  Accepted = 'accepted',
  Preparing = 'preparing',
  OutForDelivery = 'out_for_delivery',
  Delivered = 'delivered',
  Failed = 'failed',
  Cancelled = 'cancelled',
}

export class UpdateDailyOrderStatusDto {
  @IsEnum(DailyOrderStatus)
  status: DailyOrderStatus;

  @ApiPropertyOptional({ description: 'Ghi chú vận hành, không chứa chẩn đoán y tế' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
