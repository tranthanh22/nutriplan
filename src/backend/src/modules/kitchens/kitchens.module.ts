import { Module } from '@nestjs/common';
import { KitchensController } from './kitchens.controller';
import { KitchenRecommendationService } from './kitchen-recommendation.service';
import { KitchensService } from './kitchens.service';

@Module({
  controllers: [KitchensController],
  providers: [KitchensService, KitchenRecommendationService],
})
export class KitchensModule {}
