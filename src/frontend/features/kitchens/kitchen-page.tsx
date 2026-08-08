"use client";

import { AlertCircle, LoaderCircle, MapPin, Search, ShieldCheck, SlidersHorizontal, Sparkles, Utensils, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { KitchenOffer } from "@/lib/data";
import { KitchenOfferCard } from "./kitchen-offer-card";
import { KitchenOfferDetailModal } from "./kitchen-offer-detail-modal";

type DurationFilter = "all" | "1" | "7" | "30" | "120";

type RecommendationResponse = {
  personalized: boolean;
  excludedCount: number;
  profile: {
    goal: "lose_weight" | "maintain" | "gain_muscle";
    targetCaloriesKcal: number;
    targetProteinG: number;
    targetCarbsG: number;
    targetFatG: number;
    dietaryPreferences: string[];
    district: string | null;
  };
  offers: KitchenOffer[];
};

const goalLabels = {
  lose_weight: "giảm cân",
  maintain: "duy trì cân nặng",
  gain_muscle: "tăng cơ"
};

export function KitchenPage({
  subscribed,
  onOrder
}: {
  subscribed: boolean;
  onOrder: (offer: KitchenOffer) => void;
}) {
  const [query, setQuery] = useState("");
  const [duration, setDuration] = useState<DurationFilter>("all");
  const [location, setLocation] = useState("all");
  const [dietType, setDietType] = useState("all");
  const [sort, setSort] = useState("recommended");
  const [selectedOffer, setSelectedOffer] = useState<KitchenOffer | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    void fetch("/api/kitchens/recommendations", {
      cache: "no-store",
      signal: controller.signal
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.message ?? "Không thể tải đề xuất gói bếp.");
        }
        return payload as RecommendationResponse;
      })
      .then((payload) => setRecommendations(payload))
      .catch((requestError) => {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        setError(requestError instanceof Error ? requestError.message : "Không thể tải đề xuất gói bếp.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [retryKey]);

  const kitchenOffers = recommendations?.offers ?? [];
  const kitchenLocations = useMemo(
    () => Array.from(new Set(kitchenOffers.map((offer) => offer.location))).sort(),
    [kitchenOffers]
  );
  const kitchenDietTypes = useMemo(
    () => Array.from(new Set(kitchenOffers.flatMap((offer) => offer.dietTypes))).sort(),
    [kitchenOffers]
  );

  const offers = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("vi");
    const filtered = kitchenOffers.filter((offer) => {
      const searchable = `${offer.title} ${offer.kitchen} ${offer.description} ${offer.dietTypes.join(" ")}`.toLocaleLowerCase("vi");
      return (
        (!normalizedQuery || searchable.includes(normalizedQuery)) &&
        (duration === "all" || offer.durationDays === Number(duration)) &&
        (location === "all" || offer.location === location) &&
        (dietType === "all" || offer.dietTypes.includes(dietType))
      );
    });

    return [...filtered].sort((first, second) => {
      if (sort === "price-low") return first.price - second.price;
      if (sort === "rating") return second.rating - first.rating;
      if (sort === "distance") return first.distanceKm - second.distanceKm;
      return (second.matchScore ?? 0) - (first.matchScore ?? 0) || second.rating - first.rating;
    });
  }, [dietType, duration, kitchenOffers, location, query, sort]);

  const hasFilters = Boolean(query || duration !== "all" || location !== "all" || dietType !== "all");
  const clearFilters = () => {
    setQuery("");
    setDuration("all");
    setLocation("all");
    setDietType("all");
  };

  return (
    <div className="page-content">
      <section className="page-title kitchen-title">
        <div>
          <p className="eyebrow">ĐỀ XUẤT BẾP ĐƯỢC CÁ NHÂN HÓA</p>
          <h1>Bữa ăn phù hợp với mục tiêu của bạn</h1>
          <p>NutriPlan so khớp calorie, macro, chế độ ăn và dị ứng trước khi xếp hạng gói.</p>
        </div>
        <span className="independent-pill"><ShieldCheck size={17} /> Không yêu cầu Plus</span>
      </section>

      {loading && (
        <div className="kitchen-loading" role="status" aria-live="polite">
          <LoaderCircle size={28} className="spin" />
          <div><strong>Đang phân tích các gói phù hợp...</strong><span>So sánh với calorie, macro và mục tiêu hiện tại của bạn.</span></div>
        </div>
      )}

      {!loading && error && (
        <div className="empty-state kitchen-error" role="alert">
          <AlertCircle size={30} />
          <h3>Chưa thể tạo đề xuất</h3>
          <p>{error}</p>
          <button className="button button--dark" onClick={() => setRetryKey((value) => value + 1)}>Thử lại</button>
        </div>
      )}

      {!loading && !error && recommendations && <>

      <section className="kitchen-filter-panel" aria-label="Bộ lọc bếp và gói ăn">
        <div className="search-box kitchen-search">
          <Search size={18} />
          <input
            aria-label="Tìm tên bếp, gói hoặc chế độ ăn"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm tên bếp, gói hoặc chế độ ăn..."
          />
          {query && <button className="kitchen-search__clear" aria-label="Xóa từ khóa" onClick={() => setQuery("")}><X size={15} /></button>}
        </div>
        <label className="select-filter"><Utensils size={16} />
          <select aria-label="Lọc theo thời hạn gói" value={duration} onChange={(event) => setDuration(event.target.value as DurationFilter)}>
            <option value="all">Tất cả gói</option>
            <option value="1">Món lẻ</option>
            <option value="7">Gói 7 ngày</option>
            <option value="30">Gói 30 ngày</option>
            <option value="120">Gói 120 ngày</option>
          </select>
        </label>
        <label className="select-filter"><MapPin size={16} />
          <select aria-label="Lọc theo vị trí" value={location} onChange={(event) => setLocation(event.target.value)}>
            <option value="all">Tất cả khu vực</option>
            {kitchenLocations.map((item) => <option value={item} key={item}>{item}</option>)}
          </select>
        </label>
        <label className="select-filter"><SlidersHorizontal size={16} />
          <select aria-label="Lọc theo chế độ ăn" value={dietType} onChange={(event) => setDietType(event.target.value)}>
            <option value="all">Tất cả chế độ</option>
            {kitchenDietTypes.map((item) => <option value={item} key={item}>{item}</option>)}
          </select>
        </label>
      </section>

      <div className="market-note">
        <div>
          <Sparkles size={19} />
          <span>
            Mục tiêu <strong>{recommendations.profile.targetCaloriesKcal.toLocaleString("vi-VN")} kcal/ngày</strong>
            {` · ${goalLabels[recommendations.profile.goal]}`}
            {recommendations.profile.dietaryPreferences.length > 0 ? ` · ${recommendations.profile.dietaryPreferences.join(", ")}` : ""}.
            {recommendations.excludedCount > 0 ? ` Đã loại ${recommendations.excludedCount} gói xung đột dị ứng hoặc không dung nạp.` : ""}
          </span>
        </div>
        <small>{subscribed ? "Plus đang hoạt động: món đã ăn sẽ được phân tích trong Meal Log." : "Bạn có thể mua gói bếp mà không cần Plus."}</small>
      </div>

      <div className="kitchen-results-bar">
        <p><strong>{offers.length}</strong> gói phù hợp</p>
        <div>
          {hasFilters && <button className="clear-filter" onClick={clearFilters}><X size={14} /> Xóa bộ lọc</button>}
          <label>Sắp xếp
            <select aria-label="Sắp xếp kết quả" value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="recommended">Đề xuất</option>
              <option value="rating">Đánh giá cao</option>
              <option value="price-low">Giá thấp trước</option>
              <option value="distance">Gần nhất</option>
            </select>
          </label>
        </div>
      </div>

      <section className="offer-grid">
        {offers.map((offer) => (
          <KitchenOfferCard key={offer.id} offer={offer} onView={setSelectedOffer} />
        ))}
      </section>

      {offers.length === 0 && (
        <div className="empty-state"><Search size={30} /><h3>Không tìm thấy gói phù hợp</h3><p>Thử khu vực khác hoặc xóa bớt bộ lọc.</p><button className="button button--dark" onClick={clearFilters}>Xóa tất cả bộ lọc</button></div>
      )}

      {selectedOffer && (
        <KitchenOfferDetailModal
          offer={selectedOffer}
          onClose={() => setSelectedOffer(null)}
          onOrder={(offer) => {
            setSelectedOffer(null);
            onOrder(offer);
          }}
        />
      )}
      </>}
    </div>
  );
}
