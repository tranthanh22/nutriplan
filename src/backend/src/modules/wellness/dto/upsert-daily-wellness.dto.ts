import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export enum DailyActivityType {
  Rest = 'rest',
  Walking = 'walking',
  Cardio = 'cardio',
  Strength = 'strength',
  Sport = 'sport',
  Mixed = 'mixed',
}

export enum DailyActivityIntensity {
  Rest = 'rest',
  Light = 'light',
  Moderate = 'moderate',
  High = 'high',
}

export enum DailyMood {
  VeryLow = 'very_low',
  Low = 'low',
  Neutral = 'neutral',
  Good = 'good',
  VeryGood = 'very_good',
}

export class UpsertDailyWellnessDto {
  @ApiProperty({ enum: DailyActivityType })
  @IsEnum(DailyActivityType)
  activityType: DailyActivityType;

  @ApiProperty({ minimum: 0, maximum: 600 })
  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(0)
  @Max(600)
  activityMinutes: number;

  @ApiProperty({ enum: DailyActivityIntensity })
  @IsEnum(DailyActivityIntensity)
  activityIntensity: DailyActivityIntensity;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(1)
  @Max(5)
  fatigueLevel: number;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(1)
  @Max(5)
  energyLevel: number;

  @ApiProperty({ minimum: 0, maximum: 24 })
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(24)
  sleepHours: number;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(1)
  @Max(5)
  sleepQuality: number;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(1)
  @Max(5)
  stressLevel: number;

  @ApiProperty({ enum: DailyMood })
  @IsEnum(DailyMood)
  mood: DailyMood;

  @ApiPropertyOptional({ minimum: 0, maximum: 10 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(10)
  waterLiters?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  symptoms: string[] = [];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
