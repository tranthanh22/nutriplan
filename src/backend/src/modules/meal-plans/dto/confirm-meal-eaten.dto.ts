import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class ConfirmMealEatenDto {
  @ApiPropertyOptional({
    description: 'Thời điểm người dùng xác nhận đã ăn; mặc định là hiện tại',
  })
  @IsOptional()
  @IsDateString()
  consumedAt?: string;
}
