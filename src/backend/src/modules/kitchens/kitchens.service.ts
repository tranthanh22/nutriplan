import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import type { AuthUser } from '../../common/auth/auth-user.interface';
import { SupabaseService } from '../../database/supabase.service';
import type { NutritionProfileRecord } from '../nutrition/nutrition-profile.interface';
import type {
  MarketplaceOffer,
  RecommendedMarketplaceOffer,
} from './kitchen-recommendation.interface';
import { KitchenRecommendationService } from './kitchen-recommendation.service';

@Injectable()
export class KitchensService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly recommendation: KitchenRecommendationService,
  ) {}

  async list() {
    const { data, error } = await this.supabase
      .getPublicClient()
      .from('kitchens')
      .select('id, name, slug, description, logo_path, address_text, rating_average, rating_count')
      .eq('status', 'active');
    if (error) throw new InternalServerErrorException(error.message);
    return data;
  }

  async offers(kitchenId: string) {
    const client = this.supabase.getPublicClient();
    const { data: kitchen, error: kitchenError } = await client
      .from('kitchens')
      .select('id')
      .eq('id', kitchenId)
      .eq('status', 'active')
      .maybeSingle();
    if (kitchenError) throw new InternalServerErrorException(kitchenError.message);
    if (!kitchen) throw new NotFoundException('Bếp hiện không hoạt động');

    const { data, error } = await client
      .from('kitchen_offers')
      .select('*, kitchen_offer_items(*, dishes(id, name, slug, image_path, dish_nutrition(*)))')
      .eq('kitchen_id', kitchenId)
      .eq('status', 'active');
    if (error) throw new InternalServerErrorException(error.message);
    if (!data?.length) throw new NotFoundException('Bếp chưa có offer đang bán');
    return data;
  }

  async recommendations(user: AuthUser) {
    const userClient = this.supabase.createUserClient(user.accessToken);
    const publicClient = this.supabase.getPublicClient();
    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
    }).format(new Date());
    const [profileResult, addressResult, offersResult, activeOrdersResult] =
      await Promise.all([
      userClient
        .from('nutrition_profiles')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_current', true)
        .maybeSingle(),
      userClient
        .from('user_addresses')
        .select('district, is_default, updated_at')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      publicClient
        .from('kitchen_offers')
        .select(
          `id, code, type, name, description, image_path, price_amount,
          old_price_amount, delivery_fee, package_days, meals_per_day,
          calories_kcal, protein_g, carbs_g, fat_g, diet_types,
          menu_highlights, included_items, delivery_description, badge,
          distance_km, status,
          kitchens!inner(
            id, name, slug, logo_path, address_text, status,
            rating_average, rating_count,
            kitchen_service_areas(city, district, delivery_fee, is_active)
          ),
          kitchen_offer_reviews(
            id, author_name, rating, comment, verified_purchase,
            reviewed_on, is_visible
          ),
          kitchen_offer_items(
            day_offset, meal_type,
            dishes(
              id, name, slug, image_path, ingredient_summary,
              dish_allergens(allergens(code, name))
            )
          )`,
        )
        .eq('status', 'active')
        .eq('kitchens.status', 'active'),
      userClient
        .from('kitchen_orders')
        .select(
          `order_number, offer_id,
          kitchen_offers(code),
          daily_orders!inner(delivery_date, status)`,
        )
        .eq('user_id', user.id)
        .in('status', ['paid', 'confirmed'])
        .in('daily_orders.status', [
          'scheduled',
          'accepted',
          'preparing',
          'out_for_delivery',
        ])
        .gte('daily_orders.delivery_date', today),
      ]);

    if (profileResult.error) {
      throw new InternalServerErrorException(profileResult.error.message);
    }
    if (!profileResult.data) {
      throw new NotFoundException(
        'Hãy hoàn tất hồ sơ dinh dưỡng để nhận đề xuất gói bếp cá nhân hóa',
      );
    }
    if (addressResult.error) {
      throw new InternalServerErrorException(addressResult.error.message);
    }
    if (offersResult.error) {
      throw new InternalServerErrorException(offersResult.error.message);
    }
    if (activeOrdersResult.error) {
      throw new InternalServerErrorException(activeOrdersResult.error.message);
    }

    const activePackageByCode = new Map<
      string,
      { orderNumber: string; endsOn: string }
    >();
    for (const rawOrder of activeOrdersResult.data ?? []) {
      const order = rawOrder as unknown as Record<string, unknown>;
      const offer = this.first<Record<string, unknown>>(order.kitchen_offers);
      const offerCode = this.text(offer?.code);
      const activeDays = this.array<Record<string, unknown>>(order.daily_orders)
        .map((day) => this.text(day.delivery_date))
        .filter(Boolean)
        .sort();
      const endsOn = activeDays.at(-1);
      if (offerCode && endsOn) {
        activePackageByCode.set(offerCode, {
          orderNumber: this.text(order.order_number),
          endsOn,
        });
      }
    }

    const profile = profileResult.data as NutritionProfileRecord;
    const marketplaceOffers = (offersResult.data ?? []).map((record) =>
      this.toMarketplaceOffer(record as Record<string, unknown>),
    );
    const result = this.recommendation.recommend(marketplaceOffers, {
      profile,
      userDistrict: addressResult.data?.district ?? null,
    });

    return {
      personalized: true,
      excludedCount: result.excludedCount,
      profile: {
        goal: profile.goal,
        targetCaloriesKcal: Number(profile.target_calories_kcal),
        targetProteinG: Number(profile.target_protein_g),
        targetCarbsG: Number(profile.target_carbs_g),
        targetFatG: Number(profile.target_fat_g),
        dietaryPreferences: profile.dietary_preferences ?? [],
        district: addressResult.data?.district ?? null,
      },
      offers: result.offers.map((offer) => ({
        ...this.presentRecommendedOffer(offer),
        activePackage: activePackageByCode.get(offer.id) ?? null,
      })),
    };
  }

  private toMarketplaceOffer(record: Record<string, unknown>): MarketplaceOffer {
    const kitchen = this.first<Record<string, unknown>>(record.kitchens) ?? {};
    const serviceAreas = this.array<Record<string, unknown>>(
      kitchen.kitchen_service_areas,
    ).filter((area) => area.is_active !== false);
    const reviews = this.array<Record<string, unknown>>(
      record.kitchen_offer_reviews,
    )
      .filter((review) => review.is_visible !== false)
      .sort((a, b) => String(b.reviewed_on).localeCompare(String(a.reviewed_on)))
      .slice(0, 3);
    const items = this.array<Record<string, unknown>>(record.kitchen_offer_items);
    const dishes = items
      .map((item) => this.first<Record<string, unknown>>(item.dishes))
      .filter((dish): dish is Record<string, unknown> => Boolean(dish));
    const packageDays = this.durationDays(record.package_days);
    const location = this.text(
      serviceAreas[0]?.district ??
        this.text(kitchen.address_text, 'TP. Hồ Chí Minh').split(',')[0],
      'TP. Hồ Chí Minh',
    );
    const ingredientTexts = dishes
      .map((dish) => this.text(dish.ingredient_summary))
      .filter(Boolean);
    const allergenTexts = dishes.flatMap((dish) =>
      this.array<Record<string, unknown>>(dish.dish_allergens).flatMap((relation) => {
        const allergen = this.first<Record<string, unknown>>(relation.allergens);
        return allergen
          ? [this.text(allergen.code), this.text(allergen.name)]
          : [];
      }),
    );
    const databaseHighlights = this.stringArray(record.menu_highlights);
    const dishHighlights = [...new Set(dishes.map((dish) => this.text(dish.name)).filter(Boolean))];

    return {
      // Frontend dùng trường id làm offerCode khi tạo đơn bếp.
      id: String(record.code ?? record.id),
      kitchen: this.text(kitchen.name, 'Bếp đối tác'),
      title: this.text(record.name, 'Gói dinh dưỡng'),
      description: this.text(record.description),
      image: this.text(
        record.image_path ??
          dishes[0]?.image_path ??
          kitchen.logo_path ??
          '/images/figma/healthy-meal-spread.jpg',
        '/images/figma/healthy-meal-spread.jpg',
      ),
      rating: Number(kitchen.rating_average ?? 0),
      reviews: Number(kitchen.rating_count ?? reviews.length),
      price: Number(record.price_amount ?? 0),
      ...(record.old_price_amount !== null && record.old_price_amount !== undefined
        ? { oldPrice: Number(record.old_price_amount) }
        : {}),
      calories: Number(record.calories_kcal ?? 0),
      protein: Number(record.protein_g ?? 0),
      carbs: Number(record.carbs_g ?? 0),
      fat: Number(record.fat_g ?? 0),
      delivery: this.text(record.delivery_description, 'Liên hệ bếp để chọn giờ giao'),
      badge: this.text(record.badge, 'Đề xuất'),
      type: this.offerType(packageDays),
      durationDays: packageDays,
      mealsPerDay: Math.max(1, Number(record.meals_per_day ?? 1)),
      location,
      distanceKm: Number(record.distance_km ?? 0),
      dietTypes: this.stringArray(record.diet_types),
      menuHighlights: (databaseHighlights.length > 0
        ? databaseHighlights
        : dishHighlights
      ).slice(0, 5),
      included: this.stringArray(record.included_items),
      comments: reviews.map((review) => ({
        id: String(review.id),
        author: this.text(review.author_name, 'Khách hàng'),
        rating: Number(review.rating ?? 0),
        date: this.text(review.reviewed_on),
        comment: this.text(review.comment),
        verified: Boolean(review.verified_purchase),
      })),
      ingredientTexts: [
        ...ingredientTexts,
        this.text(record.description),
        ...databaseHighlights,
      ].filter(Boolean),
      allergenTexts,
      hasIngredientEvidence: dishes.length > 0 && ingredientTexts.length > 0,
    };
  }

  private durationDays(value: unknown): 1 | 7 | 30 | 120 {
    const duration = Number(value ?? 1);
    if (duration === 7 || duration === 30 || duration === 120) return duration;
    return 1;
  }

  private presentRecommendedOffer(offer: RecommendedMarketplaceOffer) {
    const {
      ingredientTexts: _ingredientTexts,
      allergenTexts: _allergenTexts,
      hasIngredientEvidence: _hasIngredientEvidence,
      ...presented
    } = offer;
    void _ingredientTexts;
    void _allergenTexts;
    void _hasIngredientEvidence;
    return presented;
  }

  private offerType(duration: 1 | 7 | 30 | 120): MarketplaceOffer['type'] {
    if (duration === 1) return 'Món lẻ';
    return `Gói ${duration} ngày` as MarketplaceOffer['type'];
  }

  private stringArray(value: unknown) {
    return Array.isArray(value) ? value.map((item) => this.text(item)).filter(Boolean) : [];
  }

  private text(value: unknown, fallback = '') {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return fallback;
  }

  private array<T>(value: unknown): T[] {
    if (Array.isArray(value)) return value as T[];
    return value ? [value as T] : [];
  }

  private first<T>(value: unknown): T | null {
    return this.array<T>(value)[0] ?? null;
  }
}
