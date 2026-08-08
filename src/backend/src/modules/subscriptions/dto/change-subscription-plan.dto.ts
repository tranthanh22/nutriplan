import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ChangeSubscriptionPlanDto {
  @ApiProperty({ description: 'ID gói Plus mới' })
  @IsUUID()
  planId: string;
}

