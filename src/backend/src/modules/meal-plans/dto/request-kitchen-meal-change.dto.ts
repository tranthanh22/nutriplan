import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const KITCHEN_MEAL_CHANGE_REASONS = [
  'allergy_concern',
  'dislike',
  'diet_preference',
  'other',
] as const;

export class RequestKitchenMealChangeDto {
  @ApiProperty({ enum: KITCHEN_MEAL_CHANGE_REASONS })
  @IsIn(KITCHEN_MEAL_CHANGE_REASONS)
  reason: (typeof KITCHEN_MEAL_CHANGE_REASONS)[number];

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
