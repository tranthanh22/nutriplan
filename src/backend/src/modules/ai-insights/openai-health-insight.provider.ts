import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { AiHealthInsightSchema } from './ai-insight.schema';

const SYSTEM_PROMPT = `Bạn là trợ lý giải thích dữ liệu dinh dưỡng của NutriPlan.
Chỉ sử dụng dữ liệu được cung cấp và dẫn chứng rõ con số liên quan.
Không chẩn đoán bệnh, dự đoán nguy cơ bệnh, kê thuốc, đề xuất điều trị hoặc khẳng định an toàn cho bệnh lý/dị ứng.
Không tự tính lại hay thay đổi BMR, TDEE, Calorie và Macro.
Khi thiếu dữ liệu hoặc có mục tiêu cực đoan, nói rõ giới hạn và khuyến nghị trao đổi với chuyên gia phù hợp.
Trả lời ngắn gọn bằng tiếng Việt theo schema đã cung cấp.`;

@Injectable()
export class OpenAiHealthInsightProvider {
  private readonly client?: OpenAI;
  private readonly model: string;

  constructor(config: ConfigService) {
    const apiKey = config.get<string>('OPENAI_API_KEY');
    this.model = config.get<string>('OPENAI_MODEL') ?? 'gpt-5.6-luna';
    if (apiKey) this.client = new OpenAI({ apiKey });
  }

  get modelName() {
    return this.model;
  }

  async generate(input: Record<string, unknown>, safetyIdentifier: string) {
    if (!this.client) {
      throw new ServiceUnavailableException('OPENAI_API_KEY chưa được cấu hình');
    }

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

    if (!response.output_parsed) {
      throw new ServiceUnavailableException('AI từ chối hoặc không trả kết quả hợp lệ');
    }

    return {
      output: response.output_parsed,
      inputTokens: response.usage?.input_tokens ?? null,
      outputTokens: response.usage?.output_tokens ?? null,
      responseId: response.id,
    };
  }
}
