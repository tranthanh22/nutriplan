import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from '../../common/auth/auth-user.interface';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AssistantService } from './assistant.service';
import { SendAssistantMessageDto } from './dto/send-assistant-message.dto';

@ApiTags('Virtual assistant')
@ApiBearerAuth()
@Controller('assistant')
export class AssistantController {
  constructor(private readonly assistant: AssistantService) {}

  @Get('conversations')
  @ApiOperation({ summary: 'Danh sách cuộc trò chuyện của người dùng' })
  listConversations(@CurrentUser() user: AuthUser) {
    return this.assistant.listConversations(user);
  }

  @Get('conversations/:conversationId/messages')
  @ApiOperation({ summary: 'Tin nhắn trong một cuộc trò chuyện' })
  listMessages(
    @CurrentUser() user: AuthUser,
    @Param('conversationId', new ParseUUIDPipe()) conversationId: string,
  ) {
    return this.assistant.listMessages(user, conversationId);
  }

  @Post('messages')
  @ApiOperation({ summary: 'Gửi tin nhắn và nhận phản hồi từ Gemini' })
  send(
    @CurrentUser() user: AuthUser,
    @Body() body: SendAssistantMessageDto,
  ) {
    return this.assistant.send(user, body);
  }
}
