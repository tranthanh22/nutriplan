import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly url: string;
  private readonly publishableKey: string;
  private readonly publicClient: SupabaseClient;
  private readonly adminClient?: SupabaseClient;

  constructor(config: ConfigService) {
    this.url = config.getOrThrow<string>('SUPABASE_URL');
    this.publishableKey = config.getOrThrow<string>('SUPABASE_PUBLISHABLE_KEY');
    const secretKey = config.get<string>('SUPABASE_SECRET_KEY');

    this.publicClient = this.createClient(this.publishableKey);
    if (secretKey) this.adminClient = this.createClient(secretKey);
  }

  getPublicClient() {
    return this.publicClient;
  }

  getAdminClient() {
    if (!this.adminClient) {
      throw new ServiceUnavailableException(
        'SUPABASE_SECRET_KEY chưa được cấu hình cho thao tác server',
      );
    }
    return this.adminClient;
  }

  createUserClient(accessToken: string) {
    return createClient(this.url, this.publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
  }

  async verifyAccessToken(accessToken: string): Promise<User> {
    const { data, error } = await this.publicClient.auth.getUser(accessToken);
    if (error || !data.user) throw new UnauthorizedException('Access token không hợp lệ');
    return data.user;
  }

  private createClient(key: string) {
    return createClient(this.url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
}
