"use client";

import { ArrowRight, CheckCircle2, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";

const subscriptionOptions = [
  { code: "weekly", name: "7 ngày", price: "19.000đ", note: "Dùng thử ngắn hạn", featured: false },
  { code: "monthly", name: "1 tháng", price: "49.000đ", note: "Phổ biến nhất", featured: true },
  { code: "quarterly", name: "3 tháng", price: "129.000đ", note: "Tiết kiệm 18.000đ", featured: false }
] as const;

export function SubscriptionModal({
  onClose,
  onActivate
}: {
  onClose: () => void;
  onActivate: (planCode: string, planName: string) => void;
}) {
  const [selectedCode, setSelectedCode] = useState<string>("monthly");
  const selectedPlan = subscriptionOptions.find((plan) => plan.code === selectedCode) ?? subscriptionOptions[1];

  return (
    <Modal onClose={onClose}>
      <div className="subscription-modal">
        <button className="modal-close subscription-modal__close" onClick={onClose}><X size={19} /></button>
        <div className="subscription-modal__mark"><Sparkles /></div>
        <span className="section-kicker">NUTRIPLAN PLUS</span>
        <h2>Ăn đúng kế hoạch,<br />nhẹ đầu mỗi ngày.</h2>
        <p>Mở khóa bộ công cụ giúp bạn biến mục tiêu thành thói quen thực tế.</p>
        <div className="benefit-list">
          <div><CheckCircle2 /><span><strong>Thực đơn 7 ngày</strong><small>Recipe, định lượng và dinh dưỡng chi tiết</small></span></div>
          <div><CheckCircle2 /><span><strong>Recipe đầy đủ</strong><small>Nguyên liệu, định lượng và các bước chế biến</small></span></div>
          <div><CheckCircle2 /><span><strong>Làm mới mỗi tuần</strong><small>Nhận kế hoạch 7 ngày mới khi gói còn hiệu lực</small></span></div>
        </div>
        <div className="subscription-options" aria-label="Chọn thời hạn subscription">
          {subscriptionOptions.map((plan) => (
            <button
              type="button"
              key={plan.code}
              className={`subscription-option ${selectedCode === plan.code ? "subscription-option--active" : ""}`}
              onClick={() => setSelectedCode(plan.code)}
            >
              {plan.featured && <span className="subscription-option__badge">Phổ biến</span>}
              <strong>{plan.name}</strong>
              <b>{plan.price}</b>
              <small>{plan.note}</small>
            </button>
          ))}
        </div>
        <div className="subscription-price">
          <div><strong>{selectedPlan.price}</strong><span> / {selectedPlan.name}</span></div>
          <small>Kế hoạch làm mới mỗi 7 ngày · Không bao gồm tiền món bếp</small>
        </div>
        <button className="button button--cream button--full" onClick={() => onActivate(selectedPlan.code, selectedPlan.name)}>
          Chọn gói {selectedPlan.name} <ArrowRight size={18} />
        </button>
        <small className="demo-caption">Bản MVP mô phỏng — không phát sinh thanh toán thật.</small>
      </div>
    </Modal>
  );
}
