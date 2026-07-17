import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from '../../common/auth/auth-user.interface';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CatalogService } from './catalog.service';

@ApiTags('Dish catalogue')
@Controller('dishes')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Public()
  @Get('preview')
  @ApiOperation({ summary: 'Danh sách món preview, không trả công thức chi tiết' })
  preview() {
    return this.catalog.preview();
  }

  @Public()
  @Get('allergens')
  @ApiOperation({ summary: 'Danh mục chất gây dị ứng đang sử dụng' })
  allergens() {
    return this.catalog.allergens();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết dinh dưỡng và dị ứng của món; không trả công thức' })
  detail(@Param('id', ParseUUIDPipe) dishId: string) {
    return this.catalog.detail(dishId);
  }

  @ApiBearerAuth()
  @Get(':id/recipe')
  @ApiOperation({ summary: 'Recipe chi tiết dành cho subscriber' })
  recipe(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) dishId: string) {
    return this.catalog.recipe(user, dishId);
  }
}
