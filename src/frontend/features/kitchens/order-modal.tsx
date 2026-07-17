"use client";

import Image from "next/image";
import { ArrowRight, Minus, PackageCheck, Plus, ShieldCheck, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import type { KitchenOffer } from "@/lib/data";
import { formatCurrency } from "@/lib/nutrition";

export function OrderModal({
  offer,
  subscribed,
  onClose,
  onComplete
}: {
  offer: KitchenOffer;
  subscribed: boolean;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const [step, setStep] = useState<1 | 2>(1);

  return (
    <Modal onClose={onClose}>
      <div className="modal-header">
        <div><span className="section-kicker">ĐẶT MÓN TỪ BẾP</span><h2>{step === 1 ? "Thông tin đơn hàng" : "Xác nhận thanh toán"}</h2></div>
        <button className="modal-close" onClick={onClose}><X size={19} /></button>
      </div>
      <div className="order-summary">
        <div className="order-summary__image"><Image src={offer.image} alt={offer.title} fill sizes="90px" /></div>
        <div><small>{offer.kitchen} · {offer.type}</small><h3>{offer.title}</h3><span>{offer.calories} kcal · {offer.protein}g protein</span></div>
      </div>
      {step === 1 ? (
        <div className="form-stack">
          <label>Họ tên người nhận<input defaultValue="Nguyễn Minh Anh" /></label>
          <div className="form-grid">
            <label>Số điện thoại<input defaultValue="090 123 4567" /></label>
            <label>Khung giờ giao<select defaultValue="12:00 – 12:30"><option>11:30 – 12:00</option><option>12:00 – 12:30</option><option>12:30 – 13:00</option></select></label>
          </div>
          <label>Địa chỉ giao<input defaultValue="227 Nguyễn Văn Cừ, Quận 5, TP.HCM" /></label>
          <label>Dị ứng hoặc ghi chú<input defaultValue="Không có" /></label>
          <div className="quantity-line">
            <span>Số lượng</span>
            <div>
              <button onClick={() => setQuantity((value) => Math.max(1, value - 1))}><Minus size={16} /></button>
              <strong>{quantity}</strong>
              <button onClick={() => setQuantity((value) => value + 1)}><Plus size={16} /></button>
            </div>
          </div>
          <div className="independent-note"><ShieldCheck size={18} /><span>Đơn bếp độc lập với NutriPlan Subscription. Bạn không bị đăng ký thêm dịch vụ.</span></div>
        </div>
      ) : (
        <div className="payment-demo">
          <div className="payment-demo__icon"><PackageCheck /></div>
          <h3>Thanh toán mô phỏng</h3>
          <p>MVP sử dụng luồng thanh toán demo. Không có khoản tiền thật nào được thu.</p>
          <div className="price-breakdown">
            <span>Tạm tính <strong>{formatCurrency(offer.price * quantity)}</strong></span>
            <span>Phí giao <strong>{formatCurrency(0)}</strong></span>
            <span className="price-breakdown__total">Tổng cộng <strong>{formatCurrency(offer.price * quantity)}</strong></span>
          </div>
          {subscribed && <div className="plus-note"><Sparkles size={17} /> Khi giao thành công, món sẽ tự động vào Meal Log.</div>}
        </div>
      )}
      <div className="modal-actions">
        <button className="button button--outline" onClick={() => step === 1 ? onClose() : setStep(1)}>{step === 1 ? "Hủy" : "Quay lại"}</button>
        <button className="button button--dark" onClick={() => step === 1 ? setStep(2) : onComplete()}>{step === 1 ? "Tiếp tục" : "Xác nhận đặt món"} <ArrowRight size={17} /></button>
      </div>
    </Modal>
  );
}

