import { Transform } from 'class-transformer';
import {
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateSettingsDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(2, { message: 'Tên trợ lý phải có ít nhất 2 ký tự' })
  @MaxLength(32, { message: 'Tên trợ lý không được quá 32 ký tự' })
  @Matches(/^[\p{L}\p{N} .'-]+$/u, {
    message:
      'Tên trợ lý chỉ được chứa chữ, số, khoảng trắng, dấu chấm, nháy đơn hoặc gạch nối',
  })
  assistantName: string;
}
