import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class GenerateMenuDayDto {
  @ApiProperty({ example: '2026-08-12' })
  @IsDateString({ strict: true })
  plannedDate!: string;
}
