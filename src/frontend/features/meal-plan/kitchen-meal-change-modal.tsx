"use client";

import { AlertCircle, LoaderCircle, MessageSquarePlus, X } from "lucide-react";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { requestKitchenMealChange } from "./meal-plan-api";
import type { KitchenMeal } from "./meal-plan-types";

type KitchenItem = KitchenMeal["daily_order_items"][number];

export function KitchenMealChangeModal({
  item,
  kitchenName,
  onClose,
  onRequested
}: {
  item: KitchenItem;
  kitchenName: string;
  onClose: () => void;
  onRequested: () => void;
}) {
  const [reason, setReason] = useState("dislike");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setSaving(true);
    setError("");
    try {
      await requestKitchenMealChange(item.id, {
        reason,
        ...(note.trim() ? { note: note.trim() } : {})
      });
      onRequested();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Không thể gửi yêu cầu đổi món."
      );
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="modal-header">
        <div>
          <span className="section-kicker">YÊU CẦU TỚI {kitchenName.toUpperCase()}</span>
          <h2>Đổi “{item.dish_name}”</h2>
        </div>
        <button className="modal-close" onClick={onClose} aria-label="Đóng">
          <X size={19} />
        </button>
      </div>
      <div className="modal-body kitchen-change-form">
        <p>
          Bếp sẽ xem xét yêu cầu trước khi bắt đầu chuẩn bị. Yêu cầu không đảm
          bảo được chấp nhận nếu đã sát giờ giao.
        </p>
        <label>
          Lý do muốn đổi
          <select value={reason} onChange={(event) => setReason(event.target.value)}>
            <option value="dislike">Không thích món này</option>
            <option value="allergy_concern">Lo ngại dị ứng hoặc nguyên liệu</option>
            <option value="diet_preference">Không phù hợp chế độ ăn</option>
            <option value="other">Lý do khác</option>
          </select>
        </label>
        <label>
          Ghi chú cho bếp <small>{note.length}/500</small>
          <textarea
            value={note}
            maxLength={500}
            rows={4}
            placeholder="Ví dụ: Tôi muốn đổi sang món không có đậu phộng…"
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
        {error ? (
          <div className="login-error"><AlertCircle size={17} /><span>{error}</span></div>
        ) : null}
      </div>
      <div className="modal-actions modal-actions--padded">
        <button className="button button--outline" onClick={onClose}>Hủy</button>
        <button className="button button--dark" disabled={saving} onClick={() => void submit()}>
          {saving ? <LoaderCircle className="spin" size={17} /> : <MessageSquarePlus size={17} />}
          {saving ? "Đang gửi…" : "Gửi yêu cầu đổi"}
        </button>
      </div>
    </Modal>
  );
}
