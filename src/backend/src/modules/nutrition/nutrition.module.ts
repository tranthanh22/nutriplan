import { Module } from '@nestjs/common';
import { NutritionCalculatorService } from './nutrition-calculator.service';
import { NutritionController } from './nutrition.controller';
import { NutritionService } from './nutrition.service';

@Module({
  controllers: [NutritionController],
  providers: [NutritionService, NutritionCalculatorService],
  exports: [NutritionService],
})
export class NutritionModule {}
