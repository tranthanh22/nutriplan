import type { NutritionProfileRecord } from '../nutrition/nutrition-profile.interface';

export interface MarketplaceReview {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
}

export interface MarketplaceOffer {
  id: string;
  kitchen: string;
  title: string;
  description: string;
  image: string;
  rating: number;
  reviews: number;
  price: number;
  oldPrice?: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  delivery: string;
  badge: string;
  type: 'Món lẻ' | 'Gói 7 ngày' | 'Gói 30 ngày' | 'Gói 120 ngày';
  durationDays: 1 | 7 | 30 | 120;
  mealsPerDay: number;
  location: string;
  distanceKm: number;
  dietTypes: string[];
  menuHighlights: string[];
  included: string[];
  comments: MarketplaceReview[];
  ingredientTexts: string[];
  allergenTexts: string[];
  hasIngredientEvidence: boolean;
}

export interface RecommendedMarketplaceOffer extends MarketplaceOffer {
  matchScore: number;
  matchReasons: string[];
  nutritionMatch: {
    coverageRatio: number;
    targetCalories: number;
    calorieCoveragePercent: number;
    proteinCoveragePercent: number;
    carbsCoveragePercent: number;
    fatCoveragePercent: number;
  };
}

export interface RecommendationContext {
  profile: NutritionProfileRecord;
  userDistrict: string | null;
}
