import { Module } from '@nestjs/common';
import { NutritionModule } from '../nutrition/nutrition.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { AiInsightsController } from './ai-insights.controller';
import { AiInsightsService } from './ai-insights.service';
import { OpenAiHealthInsightProvider } from './openai-health-insight.provider';

@Module({
  imports: [NutritionModule, SubscriptionsModule],
  controllers: [AiInsightsController],
  providers: [AiInsightsService, OpenAiHealthInsightProvider],
})
export class AiInsightsModule {}
