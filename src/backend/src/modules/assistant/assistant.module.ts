import { Module } from '@nestjs/common';
import { SupabaseModule } from '../../database/supabase.module';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';
import { GeminiAssistantProvider } from './gemini-assistant.provider';

@Module({
  imports: [SupabaseModule],
  controllers: [AssistantController],
  providers: [AssistantService, GeminiAssistantProvider],
})
export class AssistantModule {}
