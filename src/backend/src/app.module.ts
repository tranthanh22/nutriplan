import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { SupabaseAuthGuard } from './common/guards/supabase-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { validateEnvironment } from './config/env.validation';
import { SupabaseModule } from './database/supabase.module';
import { AiInsightsModule } from './modules/ai-insights/ai-insights.module';
import { AuthModule } from './modules/auth/auth.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { HealthModule } from './modules/health/health.module';
import { KitchensModule } from './modules/kitchens/kitchens.module';
import { MealPlansModule } from './modules/meal-plans/meal-plans.module';
import { NutritionModule } from './modules/nutrition/nutrition.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    SupabaseModule,
    HealthModule,
    AuthModule,
    ProfilesModule,
    NutritionModule,
    AiInsightsModule,
    SubscriptionsModule,
    CatalogModule,
    MealPlansModule,
    KitchensModule,
    OrdersModule,
    PaymentsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: SupabaseAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
