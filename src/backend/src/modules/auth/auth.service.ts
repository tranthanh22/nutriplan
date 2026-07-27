import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import { SignUpDto, VerifyOtpDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly supabase: SupabaseService) {}

  async signUp(dto: SignUpDto) {
    this.logger.log(`Initiating sign-up and OTP dispatch for: ${dto.email}`);

    const { data, error } = await this.supabase
      .getPublicClient()
      .auth.signUp({
        email: dto.email,
        password: dto.password,
        options: {
          emailRedirectTo: 'http://localhost:3000',
        },
      });

    if (error) {
      this.logger.error(`Sign-up failed for ${dto.email}: ${error.message}`);
      throw new BadRequestException(error.message);
    }

    this.logger.log(`Sign-up OTP successfully triggered by Supabase Auth for: ${dto.email}`);

    return {
      message: 'Đăng ký thành công. Vui lòng kiểm tra OTP trong email.',
      user: data.user ? { id: data.user.id, email: data.user.email } : null,
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const { data, error } = await this.supabase
      .getPublicClient()
      .auth.verifyOtp({
        email: dto.email,
        token: dto.token,
        type: 'signup',
      });

    if (error) {
      throw new BadRequestException(error.message);
    }

    if (!data.session) {
      throw new InternalServerErrorException('Không tạo được phiên đăng nhập');
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      user: {
        id: data.user?.id,
        email: data.user?.email,
      },
    };
  }
}
