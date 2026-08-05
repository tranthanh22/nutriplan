import { IsEnum, IsOptional } from 'class-validator';

export enum WeightHistoryRange {
  SevenDays = '7d',
  OneMonth = '1m',
  ThreeMonths = '3m',
  OneYear = '1y',
  All = 'all',
}

export class GetWeightHistoryQueryDto {
  @IsOptional()
  @IsEnum(WeightHistoryRange)
  range: WeightHistoryRange = WeightHistoryRange.OneMonth;
}
