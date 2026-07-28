"use client";

import Image from "next/image";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChefHat,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  Repeat2,
  Sparkles
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MacroRow } from "@/components/ui/nutrition-widgets";
import type { Meal } from "@/lib/data";
import type { JournalEntry } from "@/types/app";
import {
  backendLogToJournal,
  confirmKitchenMeal,
  confirmPersonalMeal,
  getMyMenus,
  personalMealItemToMeal
} from "./meal-plan-api";
import type {
  KitchenMeal,
  MyMenusResponse,
  PersonalMealItem
} from "./meal-plan-types";
import { ReplacementModal } from "./replacement-modal";

const mealLabels = {
  breakfast: "Sáng",
  lunch: "Trưa",
  dinner: "Tối",
  snack: "Bữa phụ"
} as const;

const mealTimes = {
  breakfast: "07:30",
  lunch: "12:00",
  dinner: "18:30",
  snack: "15:30"
} as const;

function formatDate(date: string, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "UTC",
    ...options
  }).format(new Date(`${date}T00:00:00.000Z`));
}

function kitchenStatus(status: KitchenMeal["status"]) {
  const labels: Record<KitchenMeal["status"], string> = {
    scheduled: "Đã lên lịch",
    accepted: "Bếp đã nhận",
    preparing: "Đang chuẩn bị",
    out_for_delivery: "Đang giao",
    delivered: "Đã giao"
  };
  return labels[status];
}

function relativeDeviation(value: number, target: number) {
  if (target <= 0) return value === 0 ? 0 : 1;
  return Math.abs(value - target) / target;
}

export function MealPlanPage({
  subscribed,
  onSubscribe,
  onEditProfile,
  onMeal,
  onLogCreated
}: {
  subscribed: boolean;
  onSubscribe: () => void;
  onEditProfile: () => void;
  onMeal: (meal: Meal) => void;
  onLogCreated: (entry: JournalEntry) => void;
}) {
  const [menus, setMenus] = useState<MyMenusResponse | null>(null);
  const [source, setSource] = useState<"personal" | "kitchen">("personal");
  const [dayIndex, setDayIndex] = useState(0);
  const [replacementItem, setReplacementItem] =
    useState<PersonalMealItem | null>(null);
  const [confirmingId, setConfirmingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMenus = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setMenus(await getMyMenus());
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Không thể tải thực đơn."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMenus();
  }, [loadMenus, subscribed]);

  const plan = menus?.personalPlan ?? null;
  const hasActiveSubscription = menus?.subscriptionActive ?? subscribed;
  const dates = useMemo(() => {
    if (!plan) return [];
    const result: string[] = [];
    const cursor = new Date(`${plan.start_date}T00:00:00.000Z`);
    const end = new Date(`${plan.end_date}T00:00:00.000Z`);
    while (cursor <= end) {
      result.push(cursor.toISOString().slice(0, 10));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return result;
  }, [plan]);
  const selectedDate = dates[dayIndex] ?? dates[0] ?? "";
  const dayMeals = useMemo(
    () =>
      (plan?.meal_plan_items ?? [])
        .filter((item) => item.planned_date === selectedDate)
        .sort((a, b) => a.sequence_no - b.sequence_no),
    [plan, selectedDate]
  );
  const totals = useMemo(
    () =>
      dayMeals.reduce(
        (sum, item) => ({
          calories: sum.calories + Number(item.calories_kcal),
          protein: sum.protein + Number(item.protein_g),
          carbs: sum.carbs + Number(item.carbs_g),
          fat: sum.fat + Number(item.fat_g)
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      ),
    [dayMeals]
  );
  const balance = plan
    ? Math.max(
        0,
        Math.round(
          100 -
            relativeDeviation(
              totals.calories,
              Number(plan.target_calories_kcal)
            ) *
              25 -
            relativeDeviation(
              totals.protein,
              Number(plan.target_protein_g)
            ) *
              25 -
            relativeDeviation(totals.carbs, Number(plan.target_carbs_g)) * 25 -
            relativeDeviation(totals.fat, Number(plan.target_fat_g)) * 25
        )
      )
    : 0;

  async function confirmPersonal(item: PersonalMealItem) {
    setConfirmingId(item.id);
    setError("");
    try {
      const log = await confirmPersonalMeal(item.id);
      onLogCreated(backendLogToJournal(log));
      await loadMenus();
    } catch (confirmError) {
      setError(
        confirmError instanceof Error
          ? confirmError.message
          : "Không thể xác nhận bữa ăn."
      );
    } finally {
      setConfirmingId("");
    }
  }

  async function confirmKitchen(meal: KitchenMeal) {
    setConfirmingId(meal.id);
    setError("");
    try {
      const log = await confirmKitchenMeal(meal.id);
      onLogCreated(backendLogToJournal(log));
      await loadMenus();
    } catch (confirmError) {
      setError(
        confirmError instanceof Error
          ? confirmError.message
          : "Không thể xác nhận suất bếp."
      );
    } finally {
      setConfirmingId("");
    }
  }

  return (
    <div className="page-content">
      <section className="page-title">
        <div>
          <p className="eyebrow">THỰC ĐƠN CỦA TÔI</p>
          <h1>Cá nhân hóa và bếp đã đăng ký</h1>
          <p>
            Đổi món trong miền dinh dưỡng an toàn và ghi bữa đã ăn trực tiếp
            vào nhật ký.
          </p>
        </div>
        <div className="menu-source-switcher">
          <button
            className={source === "personal" ? "active" : ""}
            onClick={() => setSource("personal")}
          >
            <Sparkles size={16} /> Cá nhân
          </button>
          <button
            className={source === "kitchen" ? "active" : ""}
            onClick={() => setSource("kitchen")}
          >
            <ChefHat size={16} /> Bếp đã đăng ký
            {menus?.kitchenMeals.length ? (
              <span>{menus.kitchenMeals.length}</span>
            ) : null}
          </button>
        </div>
      </section>

      {error && (
        <div className="plan-api-error">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => void loadMenus()}>
            <RefreshCw size={15} /> Thử lại
          </button>
        </div>
      )}

      {loading && !menus && (
        <div className="plan-loading">
          <LoaderCircle className="spin" />
          <span>Đang đồng bộ thực đơn và nhật ký…</span>
        </div>
      )}

      {!loading && source === "personal" && !plan && (
        <section className="paywall-banner">
          <div className="paywall-banner__icon"><LockKeyhole /></div>
          <div>
            <span className="section-kicker">
              {hasActiveSubscription
                ? "HOÀN THÀNH HỒ SƠ DINH DƯỠNG"
                : "THỰC ĐƠN CÁ NHÂN PLUS"}
            </span>
            <h2>
              {hasActiveSubscription
                ? "Bổ sung chỉ số để hệ thống tạo thực đơn"
                : "Mở kế hoạch dựa trên hồ sơ dinh dưỡng của bạn"}
            </h2>
            <p>
              {menus?.personalPlanUnavailableReason ??
                "Hệ thống tự tính khẩu phần, cho phép đổi món an toàn và lưu bữa ăn vào Meal Log."}
            </p>
          </div>
          <button
            className="button button--cream"
            onClick={hasActiveSubscription ? onEditProfile : onSubscribe}
          >
            {hasActiveSubscription ? "Cập nhật hồ sơ" : "Đăng ký Plus"}
            <ArrowRight size={17} />
          </button>
        </section>
      )}

      {source === "personal" && plan && (
        <>
          <div className="day-tabs">
            {dates.map((date, index) => (
              <button
                key={date}
                className={index === dayIndex ? "active" : ""}
                onClick={() => setDayIndex(index)}
              >
                <span>
                  {formatDate(date, { weekday: "short" }).replace("Th ", "T")}
                </span>
                <strong>{formatDate(date, { day: "2-digit" })}</strong>
              </button>
            ))}
          </div>

          <section className="plan-layout">
            <div className="plan-list">
              <div className="section-heading">
                <div>
                  <span className="section-kicker">
                    {formatDate(selectedDate, {
                      weekday: "long",
                      day: "numeric",
                      month: "long"
                    }).toUpperCase()}
                  </span>
                  <h2>Thực đơn cá nhân</h2>
                </div>
                <span className="status-pill">
                  <span /> Cân bằng {balance}%
                </span>
              </div>

              {dayMeals.map((item) => {
                const eaten = item.consumption_status === "eaten";
                return (
                  <article
                    className={`plan-item ${eaten ? "plan-item--eaten" : ""}`}
                    key={item.id}
                  >
                    <div className="plan-item__time">
                      <span>{mealLabels[item.meal_type]}</span>
                      <small>{mealTimes[item.meal_type]}</small>
                    </div>
                    <div className="plan-item__image">
                      {item.dishes.image_path ? (
                        <Image
                          src={item.dishes.image_path}
                          alt={item.dishes.name}
                          fill
                          sizes="140px"
                        />
                      ) : null}
                    </div>
                    <div className="plan-item__body">
                      <div className="plan-item__title">
                        <h3>{item.dishes.name}</h3>
                        {item.is_replacement && <small>Đã thay món</small>}
                        {eaten && <small className="eaten-tag"><Check size={12} /> Đã ăn</small>}
                      </div>
                      <p>{item.dishes.short_description}</p>
                      <div className="meal-card__meta">
                        <span>{Math.round(Number(item.calories_kcal))} kcal</span>
                        <span>{Math.round(Number(item.protein_g))}g protein</span>
                        <span>{Number(item.servings).toFixed(1)} khẩu phần</span>
                      </div>
                    </div>
                    <div className="plan-item__actions">
                      <button
                        className="icon-button"
                        title={eaten ? "Đã ghi vào nhật ký" : "Xác nhận đã ăn"}
                        disabled={eaten || Boolean(confirmingId)}
                        onClick={() => void confirmPersonal(item)}
                      >
                        {confirmingId === item.id ? (
                          <LoaderCircle className="spin" size={18} />
                        ) : (
                          <Check size={18} />
                        )}
                      </button>
                      <button
                        className="button button--outline button--small"
                        disabled={eaten}
                        onClick={() => setReplacementItem(item)}
                      >
                        <Repeat2 size={15} /> Đổi món
                      </button>
                      <button
                        className="button button--outline button--small"
                        onClick={() => onMeal(personalMealItemToMeal(item))}
                      >
                        Xem món
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            <aside className="plan-aside">
              <div className="aside-card">
                <span className="section-kicker">TỔNG DINH DƯỠNG NGÀY</span>
                <h3>{formatDate(selectedDate, { weekday: "long" })}</h3>
                <MacroRow
                  label="Protein"
                  value={Math.round(totals.protein)}
                  target={Math.round(Number(plan.target_protein_g))}
                  color="var(--coral)"
                />
                <MacroRow
                  label="Carbs"
                  value={Math.round(totals.carbs)}
                  target={Math.round(Number(plan.target_carbs_g))}
                  color="var(--amber)"
                />
                <MacroRow
                  label="Chất béo"
                  value={Math.round(totals.fat)}
                  target={Math.round(Number(plan.target_fat_g))}
                  color="var(--mint-dark)"
                />
                <div className="aside-total">
                  <span>Tổng năng lượng</span>
                  <strong>
                    {Math.round(totals.calories)} /{" "}
                    {Math.round(Number(plan.target_calories_kcal))} kcal
                  </strong>
                </div>
              </div>
            </aside>
          </section>
        </>
      )}

      {source === "kitchen" && menus && (
        <section className="kitchen-menu-section">
          <div className="section-heading">
            <div>
              <span className="section-kicker">GÓI BẾP ĐANG THEO</span>
              <h2>Lịch món từ bếp đối tác</h2>
            </div>
          </div>
          {menus.kitchenMeals.length === 0 ? (
            <div className="kitchen-menu-empty">
              <ChefHat size={30} />
              <h3>Bạn chưa có thực đơn bếp trong tuần này</h3>
              <p>
                Sau khi mua gói bếp và lịch giao được tạo, từng suất ăn sẽ xuất
                hiện tại đây.
              </p>
            </div>
          ) : (
            <div className="kitchen-menu-list">
              {menus.kitchenMeals.map((meal) => {
                const eaten = meal.meal_log_entries.length > 0;
                const totals = meal.daily_order_items.reduce(
                  (sum, item) => ({
                    calories: sum.calories + Number(item.calories_kcal),
                    protein: sum.protein + Number(item.protein_g)
                  }),
                  { calories: 0, protein: 0 }
                );
                return (
                  <article className="kitchen-menu-item" key={meal.id}>
                    <div className="kitchen-menu-item__date">
                      <strong>{formatDate(meal.delivery_date, { day: "2-digit" })}</strong>
                      <span>{formatDate(meal.delivery_date, { month: "short" })}</span>
                    </div>
                    <div>
                      <span className="section-kicker">
                        {meal.kitchens.name} · {mealLabels[meal.meal_type]}
                      </span>
                      <h3>
                        {meal.daily_order_items
                          .map((item) => item.dish_name)
                          .join(", ")}
                      </h3>
                      <p>
                        {Math.round(totals.calories)} kcal ·{" "}
                        {Math.round(totals.protein)}g protein ·{" "}
                        {kitchenStatus(meal.status)}
                      </p>
                    </div>
                    {eaten ? (
                      <span className="eaten-tag"><Check size={13} /> Đã ăn</span>
                    ) : (
                      <button
                        className="button button--dark button--small"
                        disabled={
                          meal.status !== "delivered" ||
                          !hasActiveSubscription ||
                          Boolean(confirmingId)
                        }
                        onClick={() => void confirmKitchen(meal)}
                      >
                        {confirmingId === meal.id ? (
                          <LoaderCircle className="spin" size={16} />
                        ) : (
                          <Check size={16} />
                        )}
                        {meal.status === "delivered"
                          ? hasActiveSubscription
                            ? "Xác nhận đã ăn"
                            : "Cần Plus để ghi"
                          : kitchenStatus(meal.status)}
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {replacementItem && (
        <ReplacementModal
          item={replacementItem}
          onClose={() => setReplacementItem(null)}
          onReplaced={() => {
            setReplacementItem(null);
            void loadMenus();
          }}
        />
      )}
    </div>
  );
}
