import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { SupabaseService } from '../../database/supabase.service';
import { SignUpDto, VerifyOtpDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly supabase: SupabaseService) {}

  async login(dto: LoginDto) {
    this.logger.log(`Attempting login for: ${dto.email}`);

    const { data, error } = await this.supabase
      .getPublicClient()
      .auth.signInWithPassword({
        email: dto.email,
        password: dto.password,
      });

    if (error) {
      this.logger.error(`Login failed for ${dto.email}: ${error.message}`);
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

  async signUp(dto: SignUpDto) {
    this.logger.log(`Initiating sign-up for: ${dto.email}`);

    // Pre-check: reject if email already exists in the system
    try {
      const adminClient = this.supabase.getAdminClient();
      const { data: existingUsers } = await adminClient.auth.admin.listUsers();
      const emailExists = existingUsers?.users?.some(
        (u) => u.email?.toLowerCase() === dto.email.toLowerCase(),
      );
      if (emailExists) {
        throw new BadRequestException('Email trùng với tài khoản đã đăng ký');
      }
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      this.logger.warn('Could not pre-check email existence via admin client, falling through');
    }

    // Use public client so Supabase sends a confirmation email
    const { data, error } = await this.supabase
      .getPublicClient()
      .auth.signUp({
        email: dto.email,
        password: dto.password,
      });

    if (error) {
      this.logger.error(`Sign-up failed for ${dto.email}: ${error.message}`);
      if (
        error.message.includes('User already registered') ||
        error.message.includes('already exists') ||
        error.message.includes('email_exists')
      ) {
        throw new BadRequestException('Email trùng với tài khoản đã đăng ký');
      }
      if (error.message.includes('rate limit')) {
        throw new BadRequestException('Vượt quá giới hạn đăng ký. Vui lòng thử lại sau.');
      }
      throw new BadRequestException(error.message);
    }

    // Return user info (no session yet – user must confirm email first)
    return {
      message: 'Đã gửi email xác nhận. Vui lòng kiểm tra hộp thư của bạn.',
      user: {
        id: data.user?.id,
        email: data.user?.email,
      },
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
