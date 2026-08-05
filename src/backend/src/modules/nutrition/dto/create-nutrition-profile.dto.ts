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

  @ApiProperty({ minimum: 0, maximum: 7, description: 'Số ngày vận động mỗi tuần' })
  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(0)
  @Max(7)
  activityDaysPerWeek: number;

  @ApiProperty({ enum: NutritionGoal })
  @IsEnum(NutritionGoal)
  goal: NutritionGoal;

  @ApiProperty({ minimum: 20, maximum: 400, description: 'Cân nặng người dùng muốn đạt tới' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(20)
  @Max(400)
  targetWeightKg: number;

  @ApiProperty({ minimum: 2, maximum: 104, description: 'Số tuần dự kiến để đạt mục tiêu' })
  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(2)
  @Max(104)
  goalDurationWeeks: number;

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

  @ApiPropertyOptional({ type: [String], description: 'Dị ứng thực phẩm đã biết' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  foodAllergies: string[] = [];

  @ApiPropertyOptional({ type: [String], description: 'Thực phẩm không dung nạp/không ăn được' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  foodIntolerances: string[] = [];

  @ApiPropertyOptional({ description: 'Chỉ lưu ghi chú; MVP không dùng để chẩn đoán.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  medicalNotes?: string;
}
