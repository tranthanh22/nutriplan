import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsPhoneNumber, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateKitchenOrderDto {
  @ApiProperty()
  @IsUUID()
  offerId: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  recipientName: string;

  @ApiProperty()
  @IsPhoneNumber('VN')
  recipientPhone: string;

  @ApiProperty({ example: { line1: '12 Nguyễn Huệ', ward: 'Bến Nghé', district: 'Quận 1', city: 'TP.HCM' } })
  @IsObject()
  deliveryAddress: Record<string, string>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  deliveryNote?: string;

  @ApiProperty({ description: 'Khóa chống tạo đơn lặp' })
  @IsString()
  @MaxLength(100)
  idempotencyKey: string;
}
