import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ReplaceMealDto {
  @ApiProperty()
  @IsUUID()
  dishId: string;
}
