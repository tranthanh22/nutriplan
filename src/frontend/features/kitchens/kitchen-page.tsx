"use client";

import { MapPin, Search, ShieldCheck, SlidersHorizontal, Sparkles, Utensils, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { KitchenOffer } from "@/lib/data";
import { KitchenOfferCard } from "./kitchen-offer-card";
import { KitchenOfferDetailModal } from "./kitchen-offer-detail-modal";
import { kitchenDietTypes, kitchenLocations, kitchenOffers } from "./kitchen-mock-data";

type DurationFilter = "all" | "1" | "7" | "30" | "120";

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
      return (second.rating * Math.log10(second.reviews + 10)) - (first.rating * Math.log10(first.reviews + 10));
    });
  }, [dietType, duration, location, query, sort]);

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
          <p className="eyebrow">20 BẾP ĐỐI TÁC ĐÃ XÁC MINH</p>
          <h1>Bữa ăn phù hợp, giao tận nơi</h1>
          <p>Chọn món lẻ hoặc gói 7, 30, 120 ngày mà không cần NutriPlan Subscription.</p>
        </div>
        <span className="independent-pill"><ShieldCheck size={17} /> Không yêu cầu Plus</span>
      </section>

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
          <span>{subscribed ? "Bạn đang dùng Plus: món được giao sẽ tự động ghi vào Meal Log." : "Bạn vẫn có thể mua bình thường. Plus chỉ cần khi muốn tự động theo dõi và phân tích dinh dưỡng."}</span>
        </div>
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
    </div>
  );
}
