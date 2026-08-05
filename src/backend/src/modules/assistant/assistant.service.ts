import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import type { AuthUser } from '../../common/auth/auth-user.interface';
import { SupabaseService } from '../../database/supabase.service';
import { SendAssistantMessageDto } from './dto/send-assistant-message.dto';
import {
  GeminiAssistantProvider,
  type AssistantHistoryMessage,
} from './gemini-assistant.provider';

interface ConversationRecord {
  id: string;
  user_id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface MessageRecord {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  provider: string | null;
  model: string | null;
  created_at: string;
}

@Injectable()
export class AssistantService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly provider: GeminiAssistantProvider,
  ) {}

  async listConversations(user: AuthUser) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('assistant_conversations')
      .select('id, title, status, created_at, updated_at')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(30);
    if (error) throw new InternalServerErrorException(error.message);
    return { conversations: (data ?? []).map(this.presentConversation) };
  }

  async listMessages(user: AuthUser, conversationId: string) {
    const conversation = await this.findOwnedConversation(user.id, conversationId);
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('assistant_messages')
      .select('id, conversation_id, role, content, provider, model, created_at')
      .eq('user_id', user.id)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(100);
    if (error) throw new InternalServerErrorException(error.message);
    return {
      conversation: this.presentConversation(conversation),
      messages: ((data ?? []) as MessageRecord[]).map(this.presentMessage),
    };
  }

  async send(user: AuthUser, body: SendAssistantMessageDto) {
    const message = body.message.trim();
    let conversation = body.conversationId
      ? await this.findOwnedConversation(user.id, body.conversationId)
      : null;

    const [history, context] = await Promise.all([
      conversation
        ? this.loadRecentHistory(user.id, conversation.id)
        : Promise.resolve([]),
      this.loadNutritionContext(user.id),
    ]);
    const generated = await this.provider.generate(history, message, context);
    conversation ??= await this.createConversation(
      user.id,
      this.titleFrom(message),
    );
    const admin = this.supabase.getAdminClient();
    const now = new Date().toISOString();

    const { data: inserted, error: insertError } = await admin
      .from('assistant_messages')
      .insert([
        {
          conversation_id: conversation.id,
          user_id: user.id,
          role: 'user',
          content: message,
        },
        {
          conversation_id: conversation.id,
          user_id: user.id,
          role: 'assistant',
          content: generated.content,
          provider: this.provider.providerName,
          model: this.provider.modelName,
          input_tokens: generated.inputTokens,
          output_tokens: generated.outputTokens,
        },
      ])
      .select('id, conversation_id, role, content, provider, model, created_at')
      .order('created_at', { ascending: true });
    if (insertError) throw new InternalServerErrorException(insertError.message);

    const { data: updated, error: updateError } = await admin
      .from('assistant_conversations')
      .update({ updated_at: now })
      .eq('id', conversation.id)
      .eq('user_id', user.id)
      .select('*')
      .single();
    if (updateError) throw new InternalServerErrorException(updateError.message);
    conversation = updated as ConversationRecord;

    const messages = (inserted ?? []) as MessageRecord[];
    const userMessage = messages.find((item) => item.role === 'user');
    const assistantMessage = messages.find((item) => item.role === 'assistant');
    if (!userMessage || !assistantMessage) {
      throw new InternalServerErrorException('Không thể lưu đầy đủ hội thoại');
    }
    return {
      conversation: this.presentConversation(conversation),
      userMessage: this.presentMessage(userMessage),
      assistantMessage: this.presentMessage(assistantMessage),
    };
  }

  private async createConversation(userId: string, title: string) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('assistant_conversations')
      .insert({ user_id: userId, title })
      .select('*')
      .single();
    if (error) throw new InternalServerErrorException(error.message);
    return data as ConversationRecord;
  }

  private async findOwnedConversation(userId: string, conversationId: string) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('assistant_conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();
    if (error) throw new InternalServerErrorException(error.message);
    if (!data) throw new NotFoundException('Không tìm thấy cuộc trò chuyện');
    return data as ConversationRecord;
  }

  private async loadRecentHistory(userId: string, conversationId: string) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('assistant_messages')
      .select('role, content')
      .eq('user_id', userId)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(16);
    if (error) throw new InternalServerErrorException(error.message);
    return ((data ?? []) as AssistantHistoryMessage[]).reverse();
  }

  private async loadNutritionContext(userId: string) {
    const admin = this.supabase.getAdminClient();
    const [
      { data: profile, error: profileError },
      { data: settings, error: settingsError },
    ] = await Promise.all([
      admin
        .from('nutrition_profiles')
        .select(
          'id, gender, birth_date, height_cm, weight_kg, activity_level, goal, target_weight_kg, goal_duration_weeks, dietary_preferences, disliked_ingredients, target_calories_kcal, target_protein_g, target_carbs_g, target_fat_g',
        )
        .eq('user_id', userId)
        .eq('is_current', true)
        .maybeSingle(),
      admin
        .from('user_settings')
        .select('assistant_name')
        .eq('user_id', userId)
        .maybeSingle(),
    ]);
    if (profileError) throw new InternalServerErrorException(profileError.message);
    if (settingsError) {
      throw new InternalServerErrorException(settingsError.message);
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const { data: mealLogs, error: logsError } = await admin
      .from('meal_log_entries')
      .select('calories_kcal, protein_g, carbs_g, fat_g')
      .eq('user_id', userId)
      .gte('consumed_at', startOfToday.toISOString());
    if (logsError) throw new InternalServerErrorException(logsError.message);

    const consumedToday = (mealLogs ?? []).reduce(
      (total, item) => ({
        caloriesKcal: total.caloriesKcal + Number(item.calories_kcal),
        proteinG: total.proteinG + Number(item.protein_g),
        carbsG: total.carbsG + Number(item.carbs_g),
        fatG: total.fatG + Number(item.fat_g),
      }),
      { caloriesKcal: 0, proteinG: 0, carbsG: 0, fatG: 0 },
    );

    let latestInsight: unknown = null;
    if (profile?.id) {
      const { data, error } = await admin
        .from('ai_health_insights')
        .select('preview_summary')
        .eq('nutrition_profile_id', profile.id)
        .eq('status', 'completed')
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw new InternalServerErrorException(error.message);
      latestInsight = data
        ? {
            summary: data.preview_summary,
          }
        : null;
    }

    return {
      assistantName: settings?.assistant_name ?? 'Nutri',
      hasNutritionProfile: Boolean(profile),
      nutritionProfile: profile
        ? {
            gender: profile.gender,
            birthDate: profile.birth_date,
            heightCm: Number(profile.height_cm),
            weightKg: Number(profile.weight_kg),
            activityLevel: profile.activity_level,
            goal: profile.goal,
            targetWeightKg: Number(profile.target_weight_kg),
            goalDurationWeeks: Number(profile.goal_duration_weeks),
            dietaryPreferences: profile.dietary_preferences,
            dislikedIngredients: profile.disliked_ingredients,
            dailyTargets: {
              caloriesKcal: Number(profile.target_calories_kcal),
              proteinG: Number(profile.target_protein_g),
              carbsG: Number(profile.target_carbs_g),
              fatG: Number(profile.target_fat_g),
            },
          }
        : null,
      consumedToday,
      latestHealthInsight: latestInsight,
    };
  }

  private titleFrom(message: string) {
    const compact = message.replace(/\s+/g, ' ').trim();
    return compact.length > 56 ? `${compact.slice(0, 55)}…` : compact;
  }

  private readonly presentConversation = (row: Partial<ConversationRecord>) => ({
    id: row.id,
    title: row.title,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });

  private readonly presentMessage = (row: MessageRecord | undefined) => ({
    id: row?.id,
    conversationId: row?.conversation_id,
    role: row?.role,
    content: row?.content,
    provider: row?.provider,
    model: row?.model,
    createdAt: row?.created_at,
  });
}
