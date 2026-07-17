import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from '../../common/auth/auth-user.interface';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateNutritionProfileDto } from './dto/create-nutrition-profile.dto';
import { NutritionService } from './nutrition.service';

@ApiTags('Nutrition profiles')
@ApiBearerAuth()
@Controller('nutrition-profiles')
export class NutritionController {
  constructor(private readonly nutrition: NutritionService) {}

  @Post('calculate')
  @ApiOperation({ summary: 'Tính thử BMR/TDEE/Calorie/Macro, chưa lưu' })
  calculate(@Body() dto: CreateNutritionProfileDto) {
    return this.nutrition.calculate(dto);
  }

  @Post()
  @ApiOperation({ summary: 'Tính và lưu phiên bản hồ sơ dinh dưỡng mới' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateNutritionProfileDto) {
    return this.nutrition.create(user, dto);
  }

  @Get('current')
  @ApiOperation({ summary: 'Lấy hồ sơ dinh dưỡng hiện hành' })
  current(@CurrentUser() user: AuthUser) {
    return this.nutrition.getCurrent(user);
  }
}
