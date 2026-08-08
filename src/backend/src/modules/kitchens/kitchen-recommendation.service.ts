import { Injectable } from '@nestjs/common';
import type {
  MarketplaceOffer,
  RecommendationContext,
  RecommendedMarketplaceOffer,
} from './kitchen-recommendation.interface';

const GOAL_LABELS: Record<string, string> = {
  lose_weight: 'giảm cân',
  maintain: 'duy trì cân nặng',
  gain_muscle: 'tăng cơ',
};

const TERM_ALIASES: Record<string, string[]> = {
  'đậu phộng': ['đậu phộng', 'peanut'],
  peanut: ['đậu phộng', 'peanut'],
  sữa: ['sữa tươi', 'sữa chua', 'milk', 'lactose', 'whey', 'phô mai'],
  lactose: ['sữa tươi', 'sữa chua', 'milk', 'lactose', 'whey', 'phô mai'],
  gluten: ['gluten', 'lúa mì', 'wheat', 'bánh mì', 'mì ý'],
  'đậu nành': ['đậu nành', 'soy', 'đậu hũ', 'tofu', 'tempeh'],
  soy: ['đậu nành', 'soy', 'đậu hũ', 'tofu', 'tempeh'],
  trứng: ['trứng', 'egg'],
  egg: ['trứng', 'egg'],
  cá: ['cá', 'fish'],
  fish: ['cá', 'fish'],
  'hải sản': ['tôm', 'cua', 'hải sản', 'shellfish'],
  shellfish: ['tôm', 'cua', 'hải sản', 'shellfish'],
  'hạt cây': ['hạnh nhân', 'hạt điều', 'óc chó', 'tree nut'],
};

const PREFERENCE_TAGS: Record<string, string[]> = {
  'ăn cân bằng': ['cân bằng', 'eat clean'],
  'ăn chay': ['chay', 'thuần chay', 'vegan'],
  'thuần chay': ['thuần chay', 'vegan'],
  'ít tinh bột': ['ít tinh bột', 'low-carb', 'keto'],
  'giàu protein': ['giàu protein', 'tăng cơ', 'thể thao'],
  'không gluten': ['không gluten', 'gluten-free'],
  'không sữa': ['không sữa', 'dairy-free'],
};

@Injectable()
export class KitchenRecommendationService {
  recommend(
    offers: MarketplaceOffer[],
    context: RecommendationContext,
  ): { offers: RecommendedMarketplaceOffer[]; excludedCount: number } {
    const eligible: RecommendedMarketplaceOffer[] = [];
    let excludedCount = 0;

    for (const offer of offers) {
      if (this.hasSafetyConflict(offer, context.profile)) {
        excludedCount += 1;
        continue;
      }
      eligible.push(this.score(offer, context));
    }

    eligible.sort((first, second) =>
      second.matchScore - first.matchScore ||
      second.rating - first.rating ||
      first.price - second.price,
    );
    return { offers: eligible, excludedCount };
  }

  private score(
    offer: MarketplaceOffer,
    { profile, userDistrict }: RecommendationContext,
  ): RecommendedMarketplaceOffer {
    const coverageRatio = this.coverageRatio(offer.mealsPerDay);
    const targetCalories = Number(profile.target_calories_kcal) * coverageRatio;
    const targetProtein = Number(profile.target_protein_g) * coverageRatio;
    const targetCarbs = Number(profile.target_carbs_g) * coverageRatio;
    const targetFat = Number(profile.target_fat_g) * coverageRatio;

    const calorieFit = this.similarity(offer.calories, targetCalories);
    const proteinFit = this.similarity(offer.protein, targetProtein);
    const carbsFit = this.similarity(offer.carbs, targetCarbs);
    const fatFit = this.similarity(offer.fat, targetFat);
    const macroFit = (proteinFit + carbsFit + fatFit) / 3;
    const goalFit = this.goalFit(
      offer,
      profile.goal,
      targetCalories,
      targetProtein,
    );
    const preferenceFit = this.preferenceFit(
      offer,
      profile.dietary_preferences ?? [],
    );
    const locationFit = this.locationFit(offer.location, userDistrict);
    const ratingFit = Math.min(100, Math.max(0, offer.rating * 20));
    const dislikePenalty = this.hasTermConflict(
      offer.ingredientTexts,
      profile.disliked_ingredients ?? [],
    )
      ? 12
      : 0;

    const matchScore = Math.round(
      Math.max(
        0,
        calorieFit * 0.3 +
          macroFit * 0.25 +
          goalFit * 0.15 +
          preferenceFit * 0.15 +
          locationFit * 0.05 +
          ratingFit * 0.1 -
          dislikePenalty,
      ),
    );
    const calorieCoveragePercent = this.coverage(offer.calories, targetCalories);
    const proteinCoveragePercent = this.coverage(offer.protein, targetProtein);
    const carbsCoveragePercent = this.coverage(offer.carbs, targetCarbs);
    const fatCoveragePercent = this.coverage(offer.fat, targetFat);

    const matchReasons = [
      `Năng lượng đạt ${calorieCoveragePercent}% nhu cầu cho ${offer.mealsPerDay} bữa/ngày`,
      `Protein đạt ${proteinCoveragePercent}% mục tiêu tương ứng`,
      `Phù hợp mục tiêu ${GOAL_LABELS[profile.goal] ?? 'dinh dưỡng hiện tại'}`,
    ];
    const matchedPreference = this.matchedPreference(
      offer,
      profile.dietary_preferences ?? [],
    );
    if (matchedPreference) {
      matchReasons[2] = `Phù hợp chế độ ${matchedPreference}`;
    } else if (userDistrict && this.normalize(offer.location) === this.normalize(userDistrict)) {
      matchReasons[2] = `Có giao hàng tại ${userDistrict}`;
    }

    return {
      ...offer,
      matchScore,
      matchReasons,
      nutritionMatch: {
        coverageRatio,
        targetCalories: Math.round(targetCalories),
        calorieCoveragePercent,
        proteinCoveragePercent,
        carbsCoveragePercent,
        fatCoveragePercent,
      },
    };
  }

  private hasSafetyConflict(offer: MarketplaceOffer, profile: RecommendationContext['profile']) {
    const declaredTerms = [
      ...(profile.food_allergies ?? []),
      ...(profile.food_intolerances ?? []),
    ];
    if (declaredTerms.length > 0 && !offer.hasIngredientEvidence) return true;
    const declaredConflict = this.hasTermConflict(
      [...offer.ingredientTexts, ...offer.allergenTexts],
      declaredTerms,
    );
    return declaredConflict || this.hasDietRestrictionConflict(offer, profile.dietary_preferences ?? []);
  }

  private hasDietRestrictionConflict(offer: MarketplaceOffer, preferences: string[]) {
    const normalized = preferences.map((preference) => this.normalize(preference));
    const ingredients = this.normalize(offer.ingredientTexts.join(' | '));
    const tags = this.normalize(offer.dietTypes.join(' | '));
    const contains = (terms: string[]) => terms.some((term) => ingredients.includes(term));

    if (normalized.includes('thuần chay')) {
      if (!/thuần chay|vegan/.test(tags)) return true;
      return contains(['gà', 'bò', 'heo', 'cá', 'tôm', 'trứng', 'sữa tươi', 'sữa chua', 'whey']);
    }
    if (normalized.includes('ăn chay')) {
      if (!/chay|vegan/.test(tags)) return true;
      return contains(['gà', 'bò', 'heo', 'cá', 'tôm']);
    }
    if (normalized.includes('không gluten')) {
      if (!/không gluten|gluten-free/.test(tags)) return true;
      return contains(['gluten', 'lúa mì', 'bánh mì', 'mì ý']);
    }
    if (normalized.includes('không sữa')) {
      if (!/không sữa|dairy-free/.test(tags)) return true;
      return contains(['sữa tươi', 'sữa chua', 'whey', 'phô mai']);
    }
    return false;
  }

  private hasTermConflict(sourceValues: string[], requestedTerms: string[]) {
    const source = this.normalize(sourceValues.join(' | '));
    return requestedTerms.some((term) =>
      this.expandTerm(term).some((candidate) => source.includes(candidate)),
    );
  }

  private expandTerm(value: string) {
    const normalized = this.normalize(value);
    return (TERM_ALIASES[normalized] ?? [normalized]).map((term) =>
      this.normalize(term),
    );
  }

  private preferenceFit(offer: MarketplaceOffer, preferences: string[]) {
    if (preferences.length === 0) return 80;
    const matched = preferences.filter((preference) =>
      this.offerMatchesPreference(offer, preference),
    ).length;
    return Math.round((matched / preferences.length) * 100);
  }

  private matchedPreference(offer: MarketplaceOffer, preferences: string[]) {
    return preferences.find((preference) =>
      this.offerMatchesPreference(offer, preference),
    );
  }

  private offerMatchesPreference(offer: MarketplaceOffer, preference: string) {
    const normalizedPreference = this.normalize(preference);
    const candidates = PREFERENCE_TAGS[normalizedPreference] ?? [normalizedPreference];
    const searchable = this.normalize(offer.dietTypes.join(' | '));
    return candidates.some((candidate) => searchable.includes(this.normalize(candidate)));
  }

  private goalFit(
    offer: MarketplaceOffer,
    goal: string,
    targetCalories: number,
    targetProtein: number,
  ) {
    const tags = this.normalize(offer.dietTypes.join(' | '));
    if (goal === 'gain_muscle') {
      const tagBonus = /tăng cơ|giàu protein|thể thao/.test(tags) ? 20 : 0;
      return Math.min(
        100,
        this.similarity(offer.calories, targetCalories) * 0.35 +
          this.similarity(offer.protein, targetProtein) * 0.45 +
          tagBonus,
      );
    }
    if (goal === 'lose_weight') {
      const tagBonus = /giảm mỡ|ít dầu|low-carb|eat clean/.test(tags) ? 20 : 0;
      const calorieControl = offer.calories <= targetCalories * 1.08 ? 80 : 35;
      return Math.min(100, calorieControl + tagBonus);
    }
    return /cân bằng|eat clean/.test(tags) ? 100 : 75;
  }

  private locationFit(offerDistrict: string, userDistrict: string | null) {
    if (!userDistrict) return 70;
    return this.normalize(offerDistrict) === this.normalize(userDistrict) ? 100 : 45;
  }

  private coverageRatio(mealsPerDay: number) {
    if (mealsPerDay >= 3) return 1;
    if (mealsPerDay === 2) return 0.67;
    return 0.34;
  }

  private similarity(actual: number, target: number) {
    if (!Number.isFinite(actual) || !Number.isFinite(target) || target <= 0) return 0;
    return Math.max(0, 100 * (1 - Math.abs(actual - target) / target));
  }

  private coverage(actual: number, target: number) {
    if (!Number.isFinite(actual) || !Number.isFinite(target) || target <= 0) return 0;
    return Math.round((actual / target) * 100);
  }

  private normalize(value: string) {
    return value.trim().toLocaleLowerCase('vi');
  }
}
