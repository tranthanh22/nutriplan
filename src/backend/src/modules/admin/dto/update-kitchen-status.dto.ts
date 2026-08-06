import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum AdminKitchenStatus {
  Active = 'active',
  Suspended = 'suspended',
}

export class UpdateKitchenStatusDto {
  @ApiProperty({ enum: AdminKitchenStatus })
  @IsEnum(AdminKitchenStatus)
  status: AdminKitchenStatus;
}
