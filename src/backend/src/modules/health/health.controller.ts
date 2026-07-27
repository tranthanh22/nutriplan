import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller()
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Kiểm tra API root' })
  root() {
    return this.health.check();
  }

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Kiểm tra API và kết nối Supabase' })
  check() {
    return this.health.check();
  }
}
