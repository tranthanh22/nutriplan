import { Module } from '@nestjs/common';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';

@Module({
  imports: [SubscriptionsModule],
  controllers: [CatalogController],
  providers: [CatalogService],
})
export class CatalogModule {}
