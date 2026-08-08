import type { NutritionProfileRecord } from '../nutrition/nutrition-profile.interface';
import type { MarketplaceOffer } from './kitchen-recommendation.interface';
import { KitchenRecommendationService } from './kitchen-recommendation.service';

const profile: NutritionProfileRecord = {
  id: 'profile-1',
  user_id: 'user-1',
  version: 1,
  gender: 'male',
  birth_date: '1998-01-01',
  height_cm: 175,
  weight_kg: 80,
  activity_level: 'moderate',
  activity_days_per_week: 4,
  goal: 'gain_muscle',
  target_weight_kg: 85,
  goal_duration_weeks: 20,
  dietary_preferences: ['Giàu protein'],
  disliked_ingredients: [],
  food_allergies: [],
  food_intolerances: [],
  medical_notes: null,
  bmr_kcal: 1800,
  tdee_kcal: 2500,
  target_calories_kcal: 2700,
  target_protein_g: 160,
  target_carbs_g: 330,
  target_fat_g: 80,
  formula_code: 'mifflin_st_jeor',
  formula_version: 'test',
  is_current: true,
  calculated_at: '2026-08-07T00:00:00.000Z',
  created_at: '2026-08-07T00:00:00.000Z',
};

function offer(overrides: Partial<MarketplaceOffer> = {}): MarketplaceOffer {
  return {
    id: 'offer-1',
    kitchen: 'Test Kitchen',
    title: 'Gói test',
    description: 'Gói dinh dưỡng',
    image: '/test.jpg',
    rating: 4.8,
    reviews: 100,
    price: 100000,
    calories: 900,
    protein: 54,
    carbs: 110,
    fat: 27,
    delivery: '11:00',
    badge: 'Test',
    type: 'Gói 7 ngày',
    durationDays: 7,
    mealsPerDay: 1,
    location: 'Quận 3',
    distanceKm: 2,
    dietTypes: ['Giàu protein'],
    menuHighlights: [],
    included: [],
    comments: [],
    ingredientTexts: ['Ức gà, gạo lứt, bông cải'],
    allergenTexts: [],
    hasIngredientEvidence: true,
    ...overrides,
  };
}

describe('KitchenRecommendationService', () => {
  const service = new KitchenRecommendationService();

  it('xếp gói gần calorie và macro mục tiêu lên trước', () => {
    const result = service.recommend(
      [
        offer({ id: 'poor', calories: 400, protein: 15, dietTypes: ['Cân bằng'] }),
        offer({ id: 'fit' }),
      ],
      { profile, userDistrict: 'Quận 3' },
    );

    expect(result.offers[0].id).toBe('fit');
    expect(result.offers[0].matchScore).toBeGreaterThan(result.offers[1].matchScore);
    expect(result.offers[0].matchReasons).toHaveLength(3);
  });

  it('loại gói có nguyên liệu xung đột dị ứng', () => {
    const allergicProfile = { ...profile, food_allergies: ['Đậu phộng'] };
    const result = service.recommend(
      [
        offer({ id: 'unsafe', ingredientTexts: ['Gà, sốt đậu phộng'] }),
        offer({ id: 'safe' }),
      ],
      { profile: allergicProfile, userDistrict: null },
    );

    expect(result.excludedCount).toBe(1);
    expect(result.offers.map((item) => item.id)).toEqual(['safe']);
  });

  it('loại gói thiếu bằng chứng nguyên liệu khi người dùng có dị ứng', () => {
    const allergicProfile = { ...profile, food_allergies: ['Hải sản'] };
    const result = service.recommend(
      [offer({ id: 'unknown', ingredientTexts: [], hasIngredientEvidence: false })],
      { profile: allergicProfile, userDistrict: null },
    );

    expect(result.excludedCount).toBe(1);
    expect(result.offers).toHaveLength(0);
  });

  it('không loại món không thích nhưng giảm điểm', () => {
    const dislikeProfile = { ...profile, disliked_ingredients: ['bông cải'] };
    const clean = offer({ id: 'clean', ingredientTexts: ['Ức gà, gạo lứt'] });
    const disliked = offer({ id: 'disliked' });
    const result = service.recommend([disliked, clean], {
      profile: dislikeProfile,
      userDistrict: null,
    });

    expect(result.excludedCount).toBe(0);
    expect(result.offers[0].id).toBe('clean');
  });
});
