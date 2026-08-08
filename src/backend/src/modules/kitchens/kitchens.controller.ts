import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from '../../common/auth/auth-user.interface';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { KitchensService } from './kitchens.service';

@ApiTags('Kitchens')
@Controller('kitchens')
export class KitchensController {
  constructor(private readonly kitchens: KitchensService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Danh sách bếp đối tác active' })
  list() {
    return this.kitchens.list();
  }

  @ApiBearerAuth()
  @Get('recommendations')
  @ApiOperation({
    summary: 'Gói bếp được chấm điểm theo hồ sơ dinh dưỡng hiện hành',
  })
  recommendations(@CurrentUser() user: AuthUser) {
    return this.kitchens.recommendations(user);
  }

  @Public()
  @Get(':id/offers')
  @ApiOperation({ summary: 'Món/gói đang bán của một bếp' })
  offers(@Param('id', ParseUUIDPipe) kitchenId: string) {
    return this.kitchens.offers(kitchenId);
  }
}
