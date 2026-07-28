import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class SendAssistantMessageDto {
  @ApiPropertyOptional({
    description: 'Bỏ trống để bắt đầu một cuộc trò chuyện mới',
  })
  @IsOptional()
  @IsUUID()
  conversationId?: string;

  @ApiProperty({
    example: 'Gợi ý cho tôi một bữa tối giàu đạm nhưng ít dầu mỡ.',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(1500)
  message!: string;
}
