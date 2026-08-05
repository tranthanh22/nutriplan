"use client";

import {
  CalendarDays,
  CheckCircle2,
  ChefHat,
  Clock3,
  LoaderCircle,
  PackageCheck,
  Truck,
  X
} from "lucide-react";
import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/modal";
import {
  updateManagedDailyOrderStatus,
  type DailyOrderStatus,
  type ManagedDailyOrder,
  type ManagedOrder
} from "./management-api";
import { KitchenMealEditor } from "./kitchen-meal-editor";

const mealLabels: Record<ManagedDailyOrder["meal_type"], string> = {
  breakfast: "Bữa sáng",
  lunch: "Bữa trưa",
  dinner: "Bữa tối",
  snack: "Bữa phụ"
};

const dailyStatusLabels: Record<DailyOrderStatus, string> = {
  scheduled: "Đã lên lịch",
  accepted: "Đã nhận bữa",
  preparing: "Đang chuẩn bị",
  out_for_delivery: "Đang giao",
  delivered: "Đã giao",
  failed: "Giao thất bại",
  cancelled: "Đã hủy"
};

const nextAction: Partial<Record<DailyOrderStatus, {
  status: Exclude<DailyOrderStatus, "scheduled">;
  label: string;
  icon: typeof ChefHat;
}>> = {
  scheduled: { status: "accepted", label: "Nhận bữa", icon: CheckCircle2 },
  accepted: { status: "preparing", label: "Bắt đầu chuẩn bị", icon: ChefHat },
  preparing: { status: "out_for_delivery", label: "Bàn giao giao hàng", icon: Truck },
  out_for_delivery: { status: "delivered", label: "Xác nhận đã giao", icon: PackageCheck }
};

function dateLabel(date: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(`${date}T00:00:00`));
}

function timeLabel(value: string | null) {
  return value ? value.slice(0, 5) : "--:--";
}

export function KitchenPackageManager({
  order,
  onClose,
  onUpdated
}: {
  order: ManagedOrder;
  onClose: () => void;
  onUpdated: () => Promise<void>;
}) {
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");
  const days = useMemo(() => {
    const grouped = new Map<string, ManagedDailyOrder[]>();
    for (const dailyOrder of order.daily_orders) {
      const meals = grouped.get(dailyOrder.delivery_date) ?? [];
      meals.push(dailyOrder);
      grouped.set(dailyOrder.delivery_date, meals);
    }
    return Array.from(grouped.entries());
  }, [order.daily_orders]);
  const progress = order.fulfillment.total_meals > 0
    ? Math.round((order.fulfillment.delivered_meals / order.fulfillment.total_meals) * 100)
    : 0;

  async function advance(dailyOrder: ManagedDailyOrder) {
    if (order.fulfillment.status !== "active") return;
    const action = nextAction[dailyOrder.status];
    if (!action) return;
    setUpdatingId(dailyOrder.id);
    setError("");
    try {
      await updateManagedDailyOrderStatus(order.id, dailyOrder.id, action.status);
      await onUpdated();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể cập nhật bữa ăn.");
    } finally {
      setUpdatingId("");
    }
  }

  return (
    <Modal extraWide onClose={onClose}>
      <div className="package-manager">
        <header className="package-manager__header">
          <div>
            <span className="section-kicker">GÓI ĐANG PHỤC VỤ</span>
            <h2>{order.kitchen_offers?.name ?? "Thực đơn nhà bếp"}</h2>
            <p>{order.recipient_name} · {order.order_number}</p>
          </div>
          <button className="icon-button" aria-label="Đóng quản lý gói" onClick={onClose}><X size={20} /></button>
        </header>

        <section className="package-progress">
          <div className="package-progress__summary">
            <span><CalendarDays size={18} /> {days.length} ngày</span>
            <span><ChefHat size={18} /> {order.fulfillment.total_meals} bữa</span>
            <strong>{order.fulfillment.delivered_meals}/{order.fulfillment.total_meals} bữa đã giao</strong>
          </div>
          <div className="package-progress__track" aria-label={`Tiến độ ${progress}%`}>
            <span style={{ width: `${progress}%` }} />
          </div>
        </section>

        {order.nutrition_requirements.food_allergies.length > 0 ? (
          <div className="package-allergy-alert">
            <strong>Lưu ý dị ứng:</strong> {order.nutrition_requirements.food_allergies.join(", ")}
          </div>
        ) : null}
        {error ? <div className="management-alert" role="alert">{error}</div> : null}

        <div className="package-days">
          {days.map(([date, meals], dayIndex) => (
            <section className="package-day" key={date}>
              <header>
                <div><span>Ngày {dayIndex + 1}</span><h3>{dateLabel(date)}</h3></div>
                <small>{meals.filter((meal) => meal.status === "delivered").length}/{meals.length} bữa đã giao</small>
              </header>
              <div className="package-day__meals">
                {meals.map((meal) => {
                  const action = order.fulfillment.status === "active"
                    ? nextAction[meal.status]
                    : undefined;
                  const ActionIcon = action?.icon;
                  return (
                    <article className="package-meal" key={meal.id}>
                      <div className="package-meal__heading">
                        <div>
                          <strong>{mealLabels[meal.meal_type]}</strong>
                          <span><Clock3 size={14} /> {timeLabel(meal.delivery_window_start)}–{timeLabel(meal.delivery_window_end)}</span>
                        </div>
                        <span className={`daily-status daily-status--${meal.status}`}>{dailyStatusLabels[meal.status]}</span>
                      </div>
                      {meal.daily_order_items.map((item) => (
                        <KitchenMealEditor
                          key={item.id}
                          orderId={order.id}
                          dailyOrderId={meal.id}
                          item={item}
                          locked={order.fulfillment.status !== "active" || !["scheduled", "accepted"].includes(meal.status)}
                          onUpdated={onUpdated}
                        />
                      ))}
                      {action && ActionIcon ? (
                        <button
                          className="button button--primary button--small package-meal__action"
                          disabled={updatingId.length > 0}
                          onClick={() => void advance(meal)}
                        >
                          {updatingId === meal.id ? <LoaderCircle className="spin" size={16} /> : <ActionIcon size={16} />}
                          {action.label}
                        </button>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </Modal>
  );
}
