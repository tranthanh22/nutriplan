import { Injectable } from '@nestjs/common';
import type {
  HealthInsightGeneration,
  HealthInsightProvider,
} from './health-insight-provider.interface';

@Injectable()
export class MockHealthInsightProvider implements HealthInsightProvider {
  readonly providerName = 'mock';
  readonly modelName = 'nutriplan-local-mock-v1';

  async generate(input: Record<string, unknown>): Promise<HealthInsightGeneration> {
    const targetCalories = Number(input.target_calories_kcal);
    const targetProtein = Number(input.target_protein_g);
    return Promise.resolve({
      output: {
        summary: `Mục tiêu hiện tại là khoảng ${targetCalories} kcal và ${targetProtein} g protein mỗi ngày.`,
        observations: [
          {
            title: 'Mức năng lượng mục tiêu',
            evidence: `Kế hoạch đang sử dụng TDEE ${String(input.tdee_kcal)} kcal và mục tiêu ${targetCalories} kcal.`,
            confidence: 'high',
          },
        ],
        actionable_suggestions: [
          'Theo dõi khẩu phần và mức độ tuân thủ trong ít nhất 7 ngày trước khi đánh giá lại.',
          'Ưu tiên thực phẩm đa dạng và ghi nhận thay đổi cân nặng theo cùng một thời điểm trong ngày.',
        ],
        questions_for_user: ['Bạn có gặp khó khăn khi tuân theo mức calorie hiện tại không?'],
        limitations: [
          'Đây là dữ liệu mô phỏng để phát triển, không phải kết quả từ mô hình OpenAI.',
          'Kết quả không thay thế đánh giá của bác sĩ hoặc chuyên gia dinh dưỡng.',
        ],
        safety_flags: [],
        recommend_professional_review: false,
      },
      inputTokens: null,
      outputTokens: null,
      responseId: 'mock-local',
    });
  }
}
