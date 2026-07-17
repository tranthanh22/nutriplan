"use client";

import Image from "next/image";
import {
  ArrowRight,
  ChefHat,
  ChevronDown,
  Clock3,
  Flame,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Utensils
} from "lucide-react";
import { useState } from "react";
import type { KitchenOffer } from "@/lib/data";
import { kitchenOffers } from "@/lib/data";
import { formatCurrency } from "@/lib/nutrition";

export function KitchenPage({
  subscribed,
  onOrder
}: {
  subscribed: boolean;
  onOrder: (offer: KitchenOffer) => void;
}) {
  const [query, setQuery] = useState("");
  const offers = kitchenOffers.filter((offer) =>
    `${offer.title} ${offer.kitchen}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="page-content">
      <section className="page-title">
        <div>
          <p className="eyebrow">BẾP ĐỐI TÁC</p>
          <h1>Bữa ăn phù hợp, giao tận nơi</h1>
          <p>Mua món lẻ hoặc gói ăn mà không cần NutriPlan Subscription.</p>
        </div>
        <span className="independent-pill"><ShieldCheck size={17} /> Không yêu cầu Plus</span>
      </section>
      <div className="market-toolbar">
        <div className="search-box">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm món hoặc tên bếp..." />
        </div>
        <button className="filter-button"><MapPin size={17} /> Quận 3 <ChevronDown size={15} /></button>
        <button className="filter-button"><Utensils size={17} /> Tất cả món <ChevronDown size={15} /></button>
      </div>
      <div className="market-note">
        <div>
          <Sparkles size={19} />
          <span>{subscribed ? "Bạn đang dùng Plus: món được giao sẽ tự động ghi vào Meal Log." : "Bạn vẫn có thể mua bình thường. Đăng ký Plus chỉ cần khi muốn tự động theo dõi dinh dưỡng."}</span>
        </div>
      </div>
      <section className="offer-grid">
        {offers.map((offer) => (
          <article className="offer-card" key={offer.id}>
            <div className="offer-card__image">
              <Image src={offer.image} alt={offer.title} fill sizes="(max-width: 800px) 100vw, 33vw" />
              <span className="offer-badge">{offer.badge}</span>
              <span className="offer-type">{offer.type}</span>
            </div>
            <div className="offer-card__body">
              <div className="kitchen-name">
                <ChefHat size={15} /> {offer.kitchen}
                <span><Star size={14} fill="currentColor" /> {offer.rating} ({offer.reviews})</span>
              </div>
              <h3>{offer.title}</h3>
              <p>{offer.description}</p>
              <div className="offer-nutrition">
                <span><Flame size={15} /> {offer.calories} kcal</span>
                <span><Target size={15} /> {offer.protein}g protein</span>
              </div>
              <div className="offer-delivery"><Clock3 size={15} /> {offer.delivery}</div>
              <div className="offer-footer">
                <div><strong>{formatCurrency(offer.price)}</strong>{offer.oldPrice && <del>{formatCurrency(offer.oldPrice)}</del>}</div>
                <button className="button button--dark" onClick={() => onOrder(offer)}>Chọn món <ArrowRight size={16} /></button>
              </div>
            </div>
          </article>
        ))}
      </section>
      {offers.length === 0 && (
        <div className="empty-state"><Search size={30} /><h3>Không tìm thấy món phù hợp</h3><p>Thử từ khóa khác hoặc bỏ bớt bộ lọc.</p></div>
      )}
    </div>
  );
}

