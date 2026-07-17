import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';

@Injectable()
export class HealthService {
  constructor(private readonly supabase: SupabaseService) {}

  async check() {
    const startedAt = Date.now();
    const { error } = await this.supabase
      .getPublicClient()
      .from('subscription_plans')
      .select('id', { head: true, count: 'exact' })
      .limit(1);

    return {
      status: error ? 'degraded' : 'ok',
      api: 'ok',
      database: error ? 'unavailable' : 'ok',
      databaseMessage: error?.message,
      responseTimeMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
    };
  }
}
