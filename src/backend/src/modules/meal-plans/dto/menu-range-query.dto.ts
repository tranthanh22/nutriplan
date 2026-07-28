import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class MenuRangeQueryDto {
  @ApiPropertyOptional({ example: '2026-07-28' })
  @IsOptional()
  @IsDateString({ strict: true })
  from?: string;

  @ApiPropertyOptional({ example: '2026-08-03' })
  @IsOptional()
  @IsDateString({ strict: true })
  to?: string;
}
