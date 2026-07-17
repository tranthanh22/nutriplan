import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NutritionModule } from '../nutrition/nutrition.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { AiInsightsController } from './ai-insights.controller';
import { AiInsightsService } from './ai-insights.service';
import { OpenAiHealthInsightProvider } from './openai-health-insight.provider';
import {
  HEALTH_INSIGHT_PROVIDER,
  type HealthInsightProvider,
} from './health-insight-provider.interface';
import { MockHealthInsightProvider } from './mock-health-insight.provider';

@Module({
  imports: [NutritionModule, SubscriptionsModule],
  controllers: [AiInsightsController],
  providers: [
    AiInsightsService,
    OpenAiHealthInsightProvider,
    MockHealthInsightProvider,
    {
      provide: HEALTH_INSIGHT_PROVIDER,
      inject: [ConfigService, OpenAiHealthInsightProvider, MockHealthInsightProvider],
      useFactory: (
        config: ConfigService,
        openai: OpenAiHealthInsightProvider,
        mock: MockHealthInsightProvider,
      ): HealthInsightProvider =>
        config.get<string>('AI_PROVIDER') === 'mock' ? mock : openai,
    },
  ],
})
export class AiInsightsModule {}
