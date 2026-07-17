import { IsString, IsUUID, MaxLength } from 'class-validator';

export class ConfirmPaymentDto {
  @IsUUID()
  paymentId: string;

  @IsString()
  @MaxLength(200)
  providerTransactionId: string;
}
