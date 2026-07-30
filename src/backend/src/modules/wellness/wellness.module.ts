import { Module } from '@nestjs/common';
import { NutritionModule } from '../nutrition/nutrition.module';
import { WellnessController } from './wellness.controller';
import { WellnessService } from './wellness.service';

@Module({
  imports: [NutritionModule],
  controllers: [WellnessController],
  providers: [WellnessService],
  exports: [WellnessService],
})
export class WellnessModule {}
