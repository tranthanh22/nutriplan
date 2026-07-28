import Image from "next/image";
import { ArrowRight, ChefHat, Clock3, Flame, MapPin, Star, Target } from "lucide-react";
import type { KitchenOffer } from "@/lib/data";
import { formatCurrency } from "@/lib/nutrition";

export function KitchenOfferCard({
  offer,
  onView
}: {
  offer: KitchenOffer;
  onView: (offer: KitchenOffer) => void;
}) {
  const mealCount = Math.max(1, offer.durationDays * offer.mealsPerDay);

  return (
    <article className="offer-card">
      <button className="offer-card__image offer-card__image-button" aria-label={`Xem chi tiết ${offer.title}`} onClick={() => onView(offer)}>
        <Image src={offer.image} alt={offer.title} fill sizes="(max-width: 820px) 100vw, (max-width: 1200px) 50vw, 33vw" />
        <span className="offer-badge">{offer.badge}</span>
        <span className="offer-type">{offer.type}</span>
      </button>
      <div className="offer-card__body">
        <div className="kitchen-name">
          <ChefHat size={15} /> {offer.kitchen}
          <span><Star size={14} fill="currentColor" /> {offer.rating} ({offer.reviews})</span>
        </div>
        <button className="offer-card__title" onClick={() => onView(offer)}>{offer.title}</button>
        <p>{offer.description}</p>
        <div className="offer-diet-tags">{offer.dietTypes.slice(0, 2).map((diet) => <span key={diet}>{diet}</span>)}</div>
        <div className="offer-nutrition">
          <span><Flame size={15} /> {offer.calories} kcal/ngày</span>
          <span><Target size={15} /> {offer.protein}g protein</span>
        </div>
        <div className="offer-meta-line"><span><MapPin size={14} /> {offer.location} · {offer.distanceKm} km</span><span><Clock3 size={14} /> {offer.delivery}</span></div>
        <div className="offer-footer">
          <div><strong>{formatCurrency(offer.price)}</strong>{offer.oldPrice && <del>{formatCurrency(offer.oldPrice)}</del>}<small>{mealCount > 1 ? `≈ ${formatCurrency(Math.round(offer.price / mealCount))}/bữa` : "Giá một phần"}</small></div>
          <button className="button button--dark" onClick={() => onView(offer)}>Chi tiết <ArrowRight size={16} /></button>
        </div>
      </div>
    </article>
  );
}
