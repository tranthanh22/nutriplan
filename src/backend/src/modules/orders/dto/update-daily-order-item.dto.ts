import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateDailyOrderItemDto {
  @ApiProperty({ description: 'Tên món thực tế do nhà bếp chuẩn bị' })
  @IsString()
  @MaxLength(150)
  dishName: string;

  @ApiProperty({ type: [String], description: 'Nguyên liệu thực tế của món' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  ingredients: string[];

  @ApiProperty({ minimum: 0.25, maximum: 50 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.25)
  @Max(50)
  servings: number;

  @ApiProperty({ minimum: 0, maximum: 5000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(5000)
  caloriesKcal: number;

  @ApiProperty({ minimum: 0, maximum: 500 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(500)
  proteinG: number;

  @ApiProperty({ minimum: 0, maximum: 1000 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(1000)
  carbsG: number;

  @ApiProperty({ minimum: 0, maximum: 500 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(500)
  fatG: number;

  @ApiPropertyOptional({ type: [String], description: 'Các dị nguyên có trong món' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  allergens: string[] = [];
}
