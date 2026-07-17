import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from '../../common/auth/auth-user.interface';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfilesService } from './profiles.service';

@ApiTags('Profiles')
@ApiBearerAuth()
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profiles: ProfilesService) {}

  @Get('me')
  @ApiOperation({ summary: 'Lấy hồ sơ của người dùng đang đăng nhập' })
  getMine(@CurrentUser() user: AuthUser) {
    return this.profiles.getMine(user);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Cập nhật hồ sơ của người dùng đang đăng nhập' })
  updateMine(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.profiles.updateMine(user, dto);
  }
}
