import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { KitchensService } from './kitchens.service';

@Public()
@ApiTags('Kitchens')
@Controller('kitchens')
export class KitchensController {
  constructor(private readonly kitchens: KitchensService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách bếp đối tác active' })
  list() {
    return this.kitchens.list();
  }

  @Get(':id/offers')
  @ApiOperation({ summary: 'Món/gói đang bán của một bếp' })
  offers(@Param('id', ParseUUIDPipe) kitchenId: string) {
    return this.kitchens.offers(kitchenId);
  }
}
