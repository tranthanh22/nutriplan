"use client";

import Image from "next/image";
import {
  AlertCircle,
  ArrowRight,
  LoaderCircle,
  Minus,
  PackageCheck,
  Plus,
  ShieldCheck,
  Sparkles,
  X
} from "lucide-react";
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
  const [recipientName, setRecipientName] = useState("Nguyễn Minh Anh");
  const [recipientPhone, setRecipientPhone] = useState("+84901234567");
  const [deliveryAddress, setDeliveryAddress] = useState(
    "227 Nguyễn Văn Cừ, Quận 5, TP.HCM"
  );
  const [deliveryNote, setDeliveryNote] = useState("Không có");
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submitOrder() {
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerCode: offer.id,
          recipientName,
          recipientPhone,
          deliveryAddress: { line1: deliveryAddress },
          deliveryNote,
          idempotencyKey,
          quantity
        })
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          payload &&
          typeof payload === "object" &&
          "message" in payload &&
          typeof payload.message === "string"
            ? payload.message
            : "Không thể tạo lịch món từ bếp.";
        throw new Error(message);
      }
      onComplete();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Không thể tạo lịch món từ bếp."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="modal-header">
        <div><span className="section-kicker">ĐẶT MÓN TỪ BẾP</span><h2>{step === 1 ? "Thông tin đơn hàng" : "Xác nhận thanh toán"}</h2></div>
        <button className="modal-close" onClick={onClose}><X size={19} /></button>
      </div>
      <div className="order-summary">
        <div className="order-summary__image"><Image src={offer.image} alt={offer.title} fill sizes="90px" /></div>
        <div><small>{offer.kitchen} · {offer.type}</small><h3>{offer.title}</h3><span>{offer.calories} kcal/ngày · {offer.protein}g protein · {offer.location}</span></div>
      </div>
      {step === 1 ? (
        <div className="form-stack">
          <label>Họ tên người nhận<input value={recipientName} onChange={(event) => setRecipientName(event.target.value)} /></label>
          <div className="form-grid">
            <label>Số điện thoại<input value={recipientPhone} onChange={(event) => setRecipientPhone(event.target.value)} /></label>
            <label>Khung giờ giao<select defaultValue="12:00 – 12:30"><option>11:30 – 12:00</option><option>12:00 – 12:30</option><option>12:30 – 13:00</option></select></label>
          </div>
          <label>Địa chỉ giao<input value={deliveryAddress} onChange={(event) => setDeliveryAddress(event.target.value)} /></label>
          <label>Dị ứng hoặc ghi chú<input value={deliveryNote} onChange={(event) => setDeliveryNote(event.target.value)} /></label>
          <div className="quantity-line">
            <span>{offer.durationDays === 1 ? "Số lượng phần" : "Số lượng gói"}</span>
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
      {error && <div className="login-error"><AlertCircle size={17} /><span>{error}</span></div>}
      <div className="modal-actions">
        <button className="button button--outline" disabled={submitting} onClick={() => step === 1 ? onClose() : setStep(1)}>{step === 1 ? "Hủy" : "Quay lại"}</button>
        <button
          className="button button--dark"
          disabled={
            submitting ||
            !recipientName.trim() ||
            !recipientPhone.trim() ||
            !deliveryAddress.trim()
          }
          onClick={() => step === 1 ? setStep(2) : void submitOrder()}
        >
          {submitting ? <LoaderCircle className="spin" size={17} /> : null}
          {step === 1 ? "Tiếp tục" : submitting ? "Đang tạo lịch…" : "Xác nhận đặt món"}
          {!submitting && <ArrowRight size={17} />}
        </button>
      </div>
    </Modal>
  );
}
