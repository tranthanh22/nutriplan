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
    const daily = input.daily_context as
      | {
          activity_minutes?: number;
          fatigue_level?: number;
          sleep_hours?: number;
          energy_level?: number;
        }
      | null;
    return Promise.resolve({
      output: {
        summary: daily
          ? `Mục tiêu hiện tại là khoảng ${targetCalories} kcal; hôm nay bạn vận động ${String(daily.activity_minutes ?? 0)} phút, ngủ ${String(daily.sleep_hours ?? 0)} giờ và báo mức mệt ${String(daily.fatigue_level ?? 0)}/5.`
          : `Mục tiêu hiện tại là khoảng ${targetCalories} kcal và ${targetProtein} g protein mỗi ngày.`,
        observations: [
          {
            title: 'Mức năng lượng mục tiêu',
            evidence: `Kế hoạch đang sử dụng TDEE ${String(input.tdee_kcal)} kcal và mục tiêu ${targetCalories} kcal.`,
            confidence: 'high',
          },
        ],
        actionable_suggestions: [
          'Theo dõi khẩu phần và mức độ tuân thủ trong ít nhất 7 ngày trước khi đánh giá lại.',
          daily && Number(daily.fatigue_level) >= 4
            ? 'Ưu tiên nghỉ ngơi, ăn đủ bữa và theo dõi cảm giác mệt trước khi tăng cường độ vận động.'
            : 'Ưu tiên thực phẩm đa dạng và ghi nhận thay đổi cân nặng theo cùng một thời điểm trong ngày.',
        ],
        questions_for_user: daily
          ? ['Sau bữa ăn gần nhất, mức năng lượng của bạn có cải thiện không?']
          : ['Hôm nay bạn vận động thế nào và có cảm thấy mệt mỏi không?'],
        limitations: [
          'Đây là dữ liệu mô phỏng để phát triển, không phải kết quả từ mô hình Gemini.',
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
