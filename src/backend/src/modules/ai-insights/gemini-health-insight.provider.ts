import {
  BadGatewayException,
  GatewayTimeoutException,
  HttpException,
  HttpStatus,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiHealthInsightSchema } from './ai-insight.schema';
import type {
  HealthInsightGeneration,
  HealthInsightProvider,
} from './health-insight-provider.interface';

const SYSTEM_PROMPT = `Bạn là trợ lý giải thích dữ liệu dinh dưỡng và trạng thái hằng ngày của NutriPlan.
Chỉ sử dụng dữ liệu được cung cấp và dẫn chứng rõ con số liên quan.
Không chẩn đoán bệnh, dự đoán nguy cơ bệnh, kê thuốc, đề xuất điều trị hoặc khẳng định an toàn cho bệnh lý/dị ứng.
Không tự tính lại hay thay đổi BMR, TDEE, Calorie và Macro.
Nếu có daily_context, liên hệ mức vận động, giấc ngủ, năng lượng, mệt mỏi, căng thẳng và triệu chứng với kế hoạch ăn trong ngày bằng ngôn ngữ thận trọng.
Nếu daily_context là null, nói rõ chưa có check-in hôm nay và đặt câu hỏi để người dùng bổ sung.
Không khuyến khích tập luyện khi người dùng báo chóng mặt, đau, buồn nôn hoặc mệt mỏi cao; hãy khuyến nghị nghỉ ngơi và tìm hỗ trợ chuyên môn khi phù hợp.
Khi thiếu dữ liệu hoặc có mục tiêu cực đoan, nói rõ giới hạn và khuyến nghị trao đổi với chuyên gia phù hợp.
Trả lời ngắn gọn bằng tiếng Việt theo đúng JSON schema được yêu cầu.`;

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    summary: {
      type: 'string',
      description: 'Tóm tắt insight dinh dưỡng bằng tiếng Việt.',
    },
    observations: {
      type: 'array',
      maxItems: 6,
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          evidence: { type: 'string' },
          confidence: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
          },
        },
        required: ['title', 'evidence', 'confidence'],
      },
    },
    actionable_suggestions: {
      type: 'array',
      maxItems: 6,
      items: { type: 'string' },
    },
    questions_for_user: {
      type: 'array',
      maxItems: 5,
      items: { type: 'string' },
    },
    limitations: {
      type: 'array',
      maxItems: 6,
      items: { type: 'string' },
    },
    safety_flags: {
      type: 'array',
      maxItems: 6,
      items: { type: 'string' },
    },
    recommend_professional_review: { type: 'boolean' },
  },
  required: [
    'summary',
    'observations',
    'actionable_suggestions',
    'questions_for_user',
    'limitations',
    'safety_flags',
    'recommend_professional_review',
  ],
};

interface GeminiInsightResponse {
  responseId?: string;
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
  };
  promptFeedback?: {
    blockReason?: string;
  };
  error?: {
    message?: string;
  };
}

@Injectable()
export class GeminiHealthInsightProvider implements HealthInsightProvider {
  readonly providerName = 'google-gemini';
  private readonly apiKey: string;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(config: ConfigService) {
    this.apiKey = config.get<string>('GEMINI_API_KEY')?.trim() ?? '';
    this.model =
      config.get<string>('GEMINI_MODEL')?.trim() || 'gemini-3.1-flash-lite';
    this.timeoutMs = config.get<number>('GEMINI_TIMEOUT_MS') ?? 30000;
  }

  get modelName() {
    return this.model;
  }

  async generate(
    input: Record<string, unknown>,
    _safetyIdentifier: string,
  ): Promise<HealthInsightGeneration> {
    if (!this.apiKey) {
      throw new ServiceUnavailableException(
        'GEMINI_API_KEY chưa được cấu hình ở backend',
      );
    }

    let response: Response;
    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': this.apiKey,
          },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: SYSTEM_PROMPT }],
            },
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: `Hãy phân tích dữ liệu dinh dưỡng sau:\n${JSON.stringify(input)}`,
                  },
                ],
              },
            ],
            generationConfig: {
              maxOutputTokens: 1800,
              responseMimeType: 'application/json',
              responseJsonSchema: RESPONSE_SCHEMA,
            },
          }),
          signal: AbortSignal.timeout(this.timeoutMs),
        },
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === 'TimeoutError') {
        throw new GatewayTimeoutException('Gemini quá thời gian phản hồi');
      }
      throw new ServiceUnavailableException('Không thể kết nối tới Gemini');
    }

    const payload = (await response.json().catch(() => ({}))) as GeminiInsightResponse;
    if (!response.ok) {
      if (response.status === 429) {
        throw new HttpException(
          'Gemini free tier đã đạt giới hạn tạm thời. Vui lòng thử lại sau.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      if ([400, 403, 404].includes(response.status)) {
        throw new ServiceUnavailableException(
          payload.error?.message ?? 'Gemini key hoặc model không hợp lệ',
        );
      }
      throw new BadGatewayException('Gemini không hoàn tất yêu cầu');
    }

    const text = payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? '')
      .join('')
      .trim();
    if (!text) {
      const reason = payload.promptFeedback?.blockReason;
      throw new BadGatewayException(
        reason
          ? `Gemini từ chối yêu cầu: ${reason}`
          : 'Gemini không trả về nội dung',
      );
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(text);
    } catch {
      throw new BadGatewayException('Gemini trả kết quả không phải JSON');
    }
    const parsed = AiHealthInsightSchema.safeParse(parsedJson);
    if (!parsed.success) {
      throw new BadGatewayException('Gemini trả kết quả sai schema AI Insight');
    }

    return {
      output: parsed.data,
      inputTokens: payload.usageMetadata?.promptTokenCount ?? null,
      outputTokens: payload.usageMetadata?.candidatesTokenCount ?? null,
      responseId: payload.responseId ?? `gemini-${Date.now()}`,
    };
  }
}
