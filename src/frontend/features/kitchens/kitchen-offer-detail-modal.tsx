"use client";

import Image from "next/image";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChefHat,
  Clock3,
  Flame,
  MapPin,
  MessageCircle,
  PackageCheck,
  ShieldCheck,
  Star,
  Utensils,
  X
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import type { KitchenOffer } from "@/lib/data";
import { formatCurrency } from "@/lib/nutrition";

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return <span className="detail-stars" aria-label={`${value} trên 5 sao`}>
    {[1, 2, 3, 4, 5].map((star) => <Star key={star} size={size} fill={star <= Math.round(value) ? "currentColor" : "none"} />)}
  </span>;
}

export function KitchenOfferDetailModal({
  offer,
  onClose,
  onOrder
}: {
  offer: KitchenOffer;
  onClose: () => void;
  onOrder: (offer: KitchenOffer) => void;
}) {
  const mealCount = Math.max(1, offer.durationDays * offer.mealsPerDay);

  return (
    <Modal onClose={onClose} wide>
      <article className="offer-detail">
        <header className="offer-detail__hero">
          <Image src={offer.image} alt={offer.title} fill sizes="760px" priority />
          <div className="offer-detail__shade" />
          <button className="modal-close modal-close--image" aria-label="Đóng chi tiết gói" onClick={onClose}><X size={19} /></button>
          <div className="offer-detail__hero-copy">
            <div className="offer-detail__kitchen"><ChefHat size={16} /> {offer.kitchen}<span><ShieldCheck size={14} /> Đã xác minh</span></div>
            <h2>{offer.title}</h2>
            <div className="offer-detail__rating"><Stars value={offer.rating} /><strong>{offer.rating}</strong><span>{offer.reviews} đánh giá</span><span><MapPin size={14} /> {offer.location} · {offer.distanceKm} km</span></div>
          </div>
        </header>

        <div className="offer-detail__content">
          <section className="offer-detail__intro">
            <div><span className="offer-type-static">{offer.type}</span>{offer.dietTypes.map((diet) => <span className="detail-diet-tag" key={diet}>{diet}</span>)}</div>
            <p>{offer.description}</p>
          </section>

          <section>
            <div className="detail-section-title"><div><Flame size={18} /><h3>Dinh dưỡng trung bình mỗi ngày</h3></div><small>Số liệu do bếp cung cấp, có thể chênh lệch ±10%</small></div>
            <div className="detail-nutrition-grid">
              <div><span>Năng lượng</span><strong>{offer.calories}</strong><small>kcal</small></div>
              <div><span>Protein</span><strong>{offer.protein}</strong><small>g</small></div>
              <div><span>Carbs</span><strong>{offer.carbs}</strong><small>g</small></div>
              <div><span>Chất béo</span><strong>{offer.fat}</strong><small>g</small></div>
            </div>
          </section>

          <section className="detail-two-columns">
            <div className="detail-info-card">
              <div className="detail-section-title"><div><CalendarDays size={18} /><h3>Lịch và khẩu phần</h3></div></div>
              <ul>
                <li><Utensils size={16} /><span><strong>{offer.mealsPerDay} bữa/ngày</strong><small>Tổng khoảng {mealCount} khẩu phần</small></span></li>
                <li><Clock3 size={16} /><span><strong>Khung giao dự kiến</strong><small>{offer.delivery}</small></span></li>
                <li><PackageCheck size={16} /><span><strong>Đóng gói riêng từng bữa</strong><small>Có nhãn ngày dùng và dinh dưỡng</small></span></li>
              </ul>
            </div>
            <div className="detail-info-card">
              <div className="detail-section-title"><div><ChefHat size={18} /><h3>Món tiêu biểu</h3></div></div>
              <ul>{offer.menuHighlights.map((item) => <li key={item}><Check size={16} /><span><strong>{item}</strong><small>Luân phiên theo thực đơn của bếp</small></span></li>)}</ul>
            </div>
          </section>

          <section className="detail-included">
            <h3>Gói này bao gồm</h3>
            <div>{offer.included.map((item) => <span key={item}><Check size={15} /> {item}</span>)}</div>
          </section>

          <section className="detail-reviews">
            <div className="detail-section-title"><div><MessageCircle size={18} /><h3>Đánh giá gần đây</h3></div><strong>{offer.rating}/5</strong></div>
            <div className="detail-review-list">
              {offer.comments.map((review) => (
                <article key={review.id}>
                  <div className="review-avatar">{review.author.split(" ").map((part) => part[0]).slice(-2).join("")}</div>
                  <div>
                    <div className="review-head"><strong>{review.author}</strong><Stars value={review.rating} size={12} /><time>{review.date}</time></div>
                    <p>{review.comment}</p>
                    {review.verified && <small><ShieldCheck size={12} /> Đã mua gói</small>}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <footer className="offer-detail__footer">
          <div><span>Tổng giá gói</span><strong>{formatCurrency(offer.price)}</strong>{offer.oldPrice && <del>{formatCurrency(offer.oldPrice)}</del>}<small>≈ {formatCurrency(Math.round(offer.price / mealCount))}/bữa</small></div>
          <button className="button button--dark" onClick={() => onOrder(offer)}>Chọn gói này <ArrowRight size={17} /></button>
        </footer>
      </article>
    </Modal>
  );
}
