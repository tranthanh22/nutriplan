import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../common/auth/auth-user.interface';
import { SupabaseService } from '../../database/supabase.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

const PROFILE_FIELDS = 'id, role, full_name, phone, avatar_url, created_at, updated_at';

@Injectable()
export class ProfilesService {
  constructor(private readonly supabase: SupabaseService) {}

  async getMine(user: AuthUser) {
    const { data, error } = await this.supabase
      .createUserClient(user.accessToken)
      .from('profiles')
      .select(PROFILE_FIELDS)
      .eq('id', user.id)
      .maybeSingle();

    if (error) throw new InternalServerErrorException(error.message);
    if (!data) throw new NotFoundException('Không tìm thấy hồ sơ người dùng');
    return data;
  }

  async updateMine(user: AuthUser, dto: UpdateProfileDto) {
    const updates: Record<string, string> = {};
    if (dto.fullName !== undefined) updates.full_name = dto.fullName.trim();
    if (dto.phone !== undefined) updates.phone = dto.phone;
    if (dto.avatarUrl !== undefined) updates.avatar_url = dto.avatarUrl;

    if (Object.keys(updates).length === 0) return this.getMine(user);

    const { data, error } = await this.supabase
      .createUserClient(user.accessToken)
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select(PROFILE_FIELDS)
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }
}
