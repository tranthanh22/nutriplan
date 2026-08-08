import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsObject,
  IsInt,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateKitchenOrderDto {
  @ApiProperty()
  @IsString()
  @MaxLength(100)
  offerCode: string;

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

  @ApiProperty({
    description: 'Giờ bắt đầu khung giao hàng theo định dạng 24 giờ HH:mm',
    example: '17:30',
  })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  deliveryWindowStart: string;

  @ApiProperty({
    description: 'Giờ kết thúc khung giao hàng theo định dạng 24 giờ HH:mm',
    example: '18:30',
  })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/)
  deliveryWindowEnd: string;

  @ApiProperty({ description: 'Khóa chống tạo đơn lặp' })
  @IsString()
  @MaxLength(100)
  idempotencyKey: string;

  @ApiProperty({ minimum: 1, maximum: 20, default: 1 })
  @IsInt()
  @Min(1)
  @Max(20)
  quantity: number;
}
