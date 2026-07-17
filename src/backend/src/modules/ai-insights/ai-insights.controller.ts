import { Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from '../../common/auth/auth-user.interface';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AiInsightsService } from './ai-insights.service';

@ApiTags('AI health insights')
@ApiBearerAuth()
@Controller('ai-health-insights')
export class AiInsightsController {
  constructor(private readonly insights: AiInsightsService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo hoặc trả AI Insight đã cache cho hồ sơ hiện hành' })
  generate(@CurrentUser() user: AuthUser) {
    return this.insights.generate(user);
  }

  @Get('latest')
  @ApiOperation({ summary: 'Tóm tắt miễn phí hoặc insight đầy đủ theo subscription' })
  latest(@CurrentUser() user: AuthUser) {
    return this.insights.latest(user);
  }
}
