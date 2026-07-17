import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export enum Gender {
  Male = 'male',
  Female = 'female',
}

export enum ActivityLevel {
  Sedentary = 'sedentary',
  Light = 'light',
  Moderate = 'moderate',
  Active = 'active',
  VeryActive = 'very_active',
}

export enum NutritionGoal {
  LoseWeight = 'lose_weight',
  Maintain = 'maintain',
  GainMuscle = 'gain_muscle',
}

export class CreateNutritionProfileDto {
  @ApiProperty({ enum: Gender })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ example: '2000-01-15' })
  @IsDateString({ strict: true })
  birthDate: string;

  @ApiProperty({ minimum: 80, maximum: 250 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(80)
  @Max(250)
  heightCm: number;

  @ApiProperty({ minimum: 20, maximum: 400 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(20)
  @Max(400)
  weightKg: number;

  @ApiProperty({ enum: ActivityLevel })
  @IsEnum(ActivityLevel)
  activityLevel: ActivityLevel;

  @ApiProperty({ enum: NutritionGoal })
  @IsEnum(NutritionGoal)
  goal: NutritionGoal;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dietaryPreferences: string[] = [];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dislikedIngredients: string[] = [];

  @ApiPropertyOptional({ description: 'Chỉ lưu ghi chú; MVP không dùng để chẩn đoán.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  medicalNotes?: string;
}
