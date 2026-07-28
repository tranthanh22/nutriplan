import { Injectable, InternalServerErrorException } from '@nestjs/common';
import type { AuthUser } from '../../common/auth/auth-user.interface';
import { SupabaseService } from '../../database/supabase.service';
import type { UpdateSettingsDto } from './dto/update-settings.dto';

const DEFAULT_ASSISTANT_NAME = 'Nutri';

@Injectable()
export class SettingsService {
  constructor(private readonly supabase: SupabaseService) {}

  async get(user: AuthUser) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('user_settings')
      .select('assistant_name, updated_at')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) throw new InternalServerErrorException(error.message);

    return {
      assistantName: data?.assistant_name ?? DEFAULT_ASSISTANT_NAME,
      updatedAt: data?.updated_at ?? null,
    };
  }

  async update(user: AuthUser, dto: UpdateSettingsDto) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('user_settings')
      .upsert(
        {
          user_id: user.id,
          assistant_name: dto.assistantName,
        },
        { onConflict: 'user_id' },
      )
      .select('assistant_name, updated_at')
      .single();
    if (error) throw new InternalServerErrorException(error.message);

    return {
      assistantName: data.assistant_name as string,
      updatedAt: data.updated_at as string,
    };
  }
}
