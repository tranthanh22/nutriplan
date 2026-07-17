import {
  BadGatewayException,
  GatewayTimeoutException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI, { APIConnectionTimeoutError } from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { AiHealthInsightSchema } from './ai-insight.schema';
import type {
  HealthInsightGeneration,
  HealthInsightProvider,
} from './health-insight-provider.interface';

const SYSTEM_PROMPT = `Bạn là trợ lý giải thích dữ liệu dinh dưỡng của NutriPlan.
Chỉ sử dụng dữ liệu được cung cấp và dẫn chứng rõ con số liên quan.
Không chẩn đoán bệnh, dự đoán nguy cơ bệnh, kê thuốc, đề xuất điều trị hoặc khẳng định an toàn cho bệnh lý/dị ứng.
Không tự tính lại hay thay đổi BMR, TDEE, Calorie và Macro.
Khi thiếu dữ liệu hoặc có mục tiêu cực đoan, nói rõ giới hạn và khuyến nghị trao đổi với chuyên gia phù hợp.
Trả lời ngắn gọn bằng tiếng Việt theo schema đã cung cấp.`;

@Injectable()
export class OpenAiHealthInsightProvider implements HealthInsightProvider {
  readonly providerName = 'openai';
  private readonly client?: OpenAI;
  private readonly model: string;

  constructor(config: ConfigService) {
    const apiKey = config.get<string>('OPENAI_API_KEY');
    this.model = config.get<string>('OPENAI_MODEL') ?? 'gpt-5.6-luna';
    if (apiKey) {
      this.client = new OpenAI({
        apiKey,
        timeout: config.get<number>('OPENAI_TIMEOUT_MS') ?? 20_000,
        maxRetries: config.get<number>('OPENAI_MAX_RETRIES') ?? 2,
      });
    }
  }

  get modelName() {
    return this.model;
  }

  async generate(
    input: Record<string, unknown>,
    safetyIdentifier: string,
  ): Promise<HealthInsightGeneration> {
    if (!this.client) {
      throw new ServiceUnavailableException('OPENAI_API_KEY chưa được cấu hình');
    }

    try {
      const response = await this.client.responses.parse({
        model: this.model,
        reasoning: { effort: 'low' },
        safety_identifier: safetyIdentifier,
        input: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: JSON.stringify(input) },
        ],
        text: {
          format: zodTextFormat(AiHealthInsightSchema, 'nutriplan_health_insight'),
        },
      });

      const parsed = AiHealthInsightSchema.safeParse(response.output_parsed);
      if (!parsed.success) {
        throw new BadGatewayException('AI từ chối hoặc trả kết quả sai schema');
      }

      return {
        output: parsed.data,
        inputTokens: response.usage?.input_tokens ?? null,
        outputTokens: response.usage?.output_tokens ?? null,
        responseId: response.id,
      };
    } catch (error) {
      if (error instanceof APIConnectionTimeoutError) {
        throw new GatewayTimeoutException('OpenAI quá thời gian phản hồi');
      }
      throw error;
    }
  }
}
