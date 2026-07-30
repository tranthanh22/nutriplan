import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NutritionModule } from '../nutrition/nutrition.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { WellnessModule } from '../wellness/wellness.module';
import { AiInsightsController } from './ai-insights.controller';
import { AiInsightsService } from './ai-insights.service';
import { GeminiHealthInsightProvider } from './gemini-health-insight.provider';
import {
  HEALTH_INSIGHT_PROVIDER,
  type HealthInsightProvider,
} from './health-insight-provider.interface';
import { MockHealthInsightProvider } from './mock-health-insight.provider';

@Module({
  imports: [NutritionModule, SubscriptionsModule, WellnessModule],
  controllers: [AiInsightsController],
  providers: [
    AiInsightsService,
    GeminiHealthInsightProvider,
    MockHealthInsightProvider,
    {
      provide: HEALTH_INSIGHT_PROVIDER,
      inject: [ConfigService, GeminiHealthInsightProvider, MockHealthInsightProvider],
      useFactory: (
        config: ConfigService,
        gemini: GeminiHealthInsightProvider,
        mock: MockHealthInsightProvider,
      ): HealthInsightProvider =>
        config.get<string>('AI_PROVIDER') === 'mock' ? mock : gemini,
    },
  ],
})
export class AiInsightsModule {}
