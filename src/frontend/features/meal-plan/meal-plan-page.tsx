"use client";

import Image from "next/image";
import {
  AlertCircle,
  ArrowRight,
  CalendarPlus,
  CalendarDays,
  Check,
  ChefHat,
  LoaderCircle,
  LockKeyhole,
  MessageSquarePlus,
  RefreshCw,
  Repeat2,
  Sparkles
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Meal } from "@/lib/data";
import type { JournalEntry } from "@/types/app";
import {
  backendLogToJournal,
  confirmKitchenMealItem,
  confirmPersonalMeal,
  generatePersonalMenuDay,
  getMyMenus,
  personalMealItemToMeal
} from "./meal-plan-api";
import type {
  KitchenMeal,
  MyMenusResponse,
  PersonalMealItem
} from "./meal-plan-types";
import { MenuCalendar, type MenuCalendarDay } from "./menu-calendar";
import { KitchenMealChangeModal } from "./kitchen-meal-change-modal";
import { ReplacementModal } from "./replacement-modal";
import { TodayNutritionCard } from "./today-nutrition-card";
import { resolveFigmaMealImage } from "@/lib/figma-assets";

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

function personalMealLabel(item: PersonalMealItem) {
  if (item.dishes.dish_kind === "drink") return "Đồ uống";
  if (item.dishes.dish_kind === "snack") return "Bữa nhẹ";
  return mealLabels[item.meal_type];
}

function personalMealTime(item: PersonalMealItem) {
  if (item.dishes.dish_kind === "drink") return "16:30";
  return mealTimes[item.meal_type];
}

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

function kitchenDishStatus(status: KitchenMeal["status"]) {
  if (status === "scheduled" || status === "accepted") return "Đã lên lịch";
  if (status === "preparing") return "Đang chuẩn bị";
  if (status === "out_for_delivery") return "Đang giao";
  return "Đã được giao";
}

function relativeDeviation(value: number, target: number) {
  if (target <= 0) return value === 0 ? 0 : 1;
  return Math.abs(value - target) / target;
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthStart(value: string) {
  return `${value.slice(0, 7)}-01`;
}

function monthRange(month: string) {
  const start = new Date(`${month}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);
  end.setUTCDate(0);
  return { from: month, to: end.toISOString().slice(0, 10) };
}

export function MealPlanPage({
  subscribed,
  onSubscribe,
  onEditProfile,
  onMeal,
  onLogCreated,
  onOpenJournal,
  nutritionTargets
}: {
  subscribed: boolean;
  onSubscribe: () => void;
  onEditProfile: () => void;
  onMeal: (meal: Meal) => void;
  onLogCreated: (entry: JournalEntry) => void;
  onOpenJournal: () => void;
  nutritionTargets: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}) {
  const [menus, setMenus] = useState<MyMenusResponse | null>(null);
  const [source, setSource] = useState<"personal" | "kitchen">("personal");
  const [calendarMonth, setCalendarMonth] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [replacementItem, setReplacementItem] =
    useState<PersonalMealItem | null>(null);
  const [kitchenChangeItem, setKitchenChangeItem] = useState<{
    item: KitchenMeal["daily_order_items"][number];
    kitchenName: string;
  } | null>(null);
  const [confirmingId, setConfirmingId] = useState("");
  const [generatingDate, setGeneratingDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const dayDetailRef = useRef<HTMLElement | null>(null);

  const loadMenus = useCallback(async () => {
    if (!calendarMonth) return;
    setLoading(true);
    setError("");
    try {
      setMenus(await getMyMenus(monthRange(calendarMonth)));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Không thể tải thực đơn."
      );
    } finally {
      setLoading(false);
    }
  }, [calendarMonth]);

  useEffect(() => {
    setCalendarMonth(monthStart(localDateKey()));
  }, []);

  useEffect(() => {
    void loadMenus();
  }, [loadMenus, subscribed]);

  const plan = menus?.personalPlan ?? null;
  const hasActiveSubscription = menus?.subscriptionActive ?? subscribed;
  const personalCalendarDays = useMemo<MenuCalendarDay[]>(() => {
    const grouped = new Map<string, PersonalMealItem[]>();
    for (const item of plan?.meal_plan_items ?? []) {
      const items = grouped.get(item.planned_date) ?? [];
      items.push(item);
      grouped.set(item.planned_date, items);
    }
    return Array.from(grouped.entries()).map(([date, items]) => ({
      date,
      itemCount: items.length,
      completedCount: items.filter((item) => item.consumption_status === "eaten").length
    }));
  }, [plan]);
  const kitchenCalendarDays = useMemo<MenuCalendarDay[]>(() => {
    const grouped = new Map<string, KitchenMeal[]>();
    for (const meal of menus?.kitchenMeals ?? []) {
      const meals = grouped.get(meal.delivery_date) ?? [];
      meals.push(meal);
      grouped.set(meal.delivery_date, meals);
    }
    return Array.from(grouped.entries()).map(([date, meals]) => ({
      date,
      itemCount: meals.length,
      completedCount: meals.filter(
        (meal) =>
          meal.daily_order_items.length > 0 &&
          meal.daily_order_items.every((item) =>
            meal.meal_log_entries.some(
              (entry) => entry.daily_order_item_id === item.id
            )
          )
      ).length,
      kitchenCount: new Set(meals.map((meal) => meal.kitchens.id)).size
    }));
  }, [menus]);
  const calendarDays = source === "personal" ? personalCalendarDays : kitchenCalendarDays;

  useEffect(() => {
    if (!calendarMonth) return;
    const availableDates = calendarDays
      .map((day) => day.date)
      .filter((date) => date.startsWith(calendarMonth.slice(0, 7)))
      .sort();
    setSelectedDate((current) => {
      if (availableDates.includes(current)) return current;
      const today = localDateKey();
      return availableDates.includes(today) ? today : (availableDates[0] ?? "");
    });
  }, [calendarDays, calendarMonth]);

  const dayMeals = useMemo(
    () =>
      (plan?.meal_plan_items ?? [])
        .filter((item) => item.planned_date === selectedDate)
        .sort((a, b) => a.sequence_no - b.sequence_no),
    [plan, selectedDate]
  );
  const selectedKitchenMeals = useMemo(
    () => (menus?.kitchenMeals ?? []).filter((meal) => meal.delivery_date === selectedDate),
    [menus, selectedDate]
  );
  const kitchenNutritionItems = useMemo(
    () => selectedKitchenMeals.flatMap((meal) => meal.daily_order_items),
    [selectedKitchenMeals]
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

  function changeMonth(offset: number) {
    if (offset === 0) {
      setCalendarMonth(monthStart(localDateKey()));
      return;
    }
    const next = new Date(`${calendarMonth}T00:00:00.000Z`);
    next.setUTCMonth(next.getUTCMonth() + offset);
    setCalendarMonth(next.toISOString().slice(0, 10));
  }

  function selectCalendarDate(date: string) {
    setSelectedDate(date);
    window.requestAnimationFrame(() => {
      dayDetailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

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

  async function generateDay(date: string) {
    setGeneratingDate(date);
    setError("");
    try {
      await generatePersonalMenuDay(date);
      await loadMenus();
    } catch (generateError) {
      setError(
        generateError instanceof Error
          ? generateError.message
          : "Không thể tạo thực đơn cho ngày này."
      );
    } finally {
      setGeneratingDate("");
    }
  }

  async function confirmKitchenItem(itemId: string) {
    setConfirmingId(itemId);
    setError("");
    try {
      const log = await confirmKitchenMealItem(itemId);
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
          <MenuCalendar
            month={calendarMonth}
            source="personal"
            days={personalCalendarDays}
            selectedDate={selectedDate}
            onMonthChange={changeMonth}
            onSelectDate={selectCalendarDate}
          />

          {selectedDate && dayMeals.length > 0 ? <section className="plan-layout menu-day-detail" ref={dayDetailRef}>
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
                      <span>{personalMealLabel(item)}</span>
                      <small>{personalMealTime(item)}</small>
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
              <TodayNutritionCard
                meals={dayMeals}
                targets={{
                  calories: Number(plan.target_calories_kcal),
                  protein: Number(plan.target_protein_g),
                  carbs: Number(plan.target_carbs_g),
                  fat: Number(plan.target_fat_g)
                }}
                onOpenJournal={onOpenJournal}
              />
            </aside>
          </section> : selectedDate ? (
            <section className="menu-calendar-empty menu-day-detail" ref={dayDetailRef}>
              <CalendarDays size={29} />
              <h3>{formatDate(selectedDate, { weekday: "long", day: "numeric", month: "long" })}</h3>
              <p>
                Tạo đề xuất cân bằng gồm ba bữa chính, một bữa nhẹ và một đồ uống.
              </p>
              {hasActiveSubscription ? (
                <button
                  className="button button--primary"
                  disabled={Boolean(generatingDate)}
                  onClick={() => void generateDay(selectedDate)}
                >
                  {generatingDate === selectedDate ? (
                    <LoaderCircle className="spin" size={17} />
                  ) : (
                    <CalendarPlus size={17} />
                  )}
                  Tạo thực đơn ngày này
                </button>
              ) : (
                <button className="button button--primary" onClick={onSubscribe}>
                  Đăng ký Plus để tạo
                </button>
              )}
            </section>
          ) : (
            <div className="menu-calendar-empty">
              <CalendarDays size={29} />
              <h3>Chưa có thực đơn cá nhân trong tháng này</h3>
              <p>Chọn một ngày trên lịch để xem hoặc điều chỉnh thực đơn.</p>
            </div>
          )}
        </>
      )}

      {source === "kitchen" && menus && (
        <>
          <MenuCalendar
            month={calendarMonth}
            source="kitchen"
            days={kitchenCalendarDays}
            selectedDate={selectedDate}
            onMonthChange={changeMonth}
            onSelectDate={selectCalendarDate}
          />
          <section className="kitchen-menu-section menu-day-detail" ref={dayDetailRef}>
            <div className="section-heading">
              <div>
                <span className="section-kicker">GÓI BẾP ĐANG THEO</span>
                <h2>
                  {selectedDate
                    ? `Lịch ăn ${formatDate(selectedDate, { day: "numeric", month: "long" })}`
                    : "Lịch món từ bếp đối tác"}
                </h2>
              </div>
            </div>
            {selectedKitchenMeals.length === 0 ? (
              <div className="kitchen-menu-empty">
                <ChefHat size={30} />
                <h3>
                  {selectedDate
                    ? `${formatDate(selectedDate, { weekday: "long", day: "numeric", month: "long" })} chưa có lịch ăn`
                    : "Chưa có lịch ăn từ bếp trong tháng này"}
                </h3>
                <p>
                  Sau khi mua gói và bếp tạo lịch phục vụ, các ngày có suất ăn
                  sẽ được đánh dấu trực tiếp trên lịch.
                </p>
              </div>
            ) : (
              <div className="kitchen-menu-layout">
                <div className="kitchen-menu-list">
                  {selectedKitchenMeals.map((meal) => {
                  const totals = meal.daily_order_items.reduce(
                    (sum, item) => ({
                      calories: sum.calories + Number(item.calories_kcal),
                      protein: sum.protein + Number(item.protein_g)
                    }),
                    { calories: 0, protein: 0 }
                  );
                  return (
                    <article className="kitchen-menu-item" key={meal.id}>
                      <header className="kitchen-menu-item__header">
                        <div className="kitchen-menu-item__date">
                          <strong>{formatDate(meal.delivery_date, { day: "2-digit" })}</strong>
                          <span>{formatDate(meal.delivery_date, { month: "short" })}</span>
                        </div>
                        <div>
                          <span className="section-kicker">
                            {meal.kitchens.name} · {mealLabels[meal.meal_type]}
                          </span>
                          <h3>{kitchenStatus(meal.status)}</h3>
                          <p>{Math.round(totals.calories)} kcal · {Math.round(totals.protein)}g protein</p>
                        </div>
                        <span className={`kitchen-meal-status kitchen-meal-status--${meal.status}`}>
                          {kitchenDishStatus(meal.status)}
                        </span>
                      </header>
                      <div className="kitchen-menu-item__dishes">
                        {meal.daily_order_items.map((item) => {
                          const latestRequest = [...(item.kitchen_meal_change_requests ?? [])]
                            .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
                          const pending = latestRequest?.status === "pending";
                          const approved = latestRequest?.status === "approved";
                          const canRequest = ["scheduled", "accepted"].includes(meal.status);
                          const eaten = meal.meal_log_entries.some(
                            (entry) => entry.daily_order_item_id === item.id
                          );
                          return (
                            <div className="kitchen-dish-card" key={item.id}>
                              <div className="kitchen-dish-card__image">
                                <Image
                                  src={resolveFigmaMealImage(item.dish_name, item.image_path)}
                                  alt={item.dish_name}
                                  fill
                                  sizes="180px"
                                />
                              </div>
                              <div className="kitchen-dish-card__body">
                                <div>
                                  <h4>{item.dish_name}</h4>
                                  <span>{Number(item.servings).toFixed(1)} khẩu phần</span>
                                </div>
                                <div className="kitchen-dish-card__macros">
                                  <span><strong>{Math.round(Number(item.calories_kcal))}</strong> kcal</span>
                                  <span><strong>{Math.round(Number(item.protein_g))}g</strong> Protein</span>
                                  <span><strong>{Math.round(Number(item.carbs_g))}g</strong> Carb</span>
                                  <span><strong>{Math.round(Number(item.fat_g))}g</strong> Chất béo</span>
                                </div>
                                <div className="kitchen-dish-card__ingredients">
                                  <strong>Nguyên liệu sử dụng</strong>
                                  <div>
                                    {(item.ingredient_snapshot ?? []).map((ingredient) => (
                                      <span key={ingredient}>{ingredient}</span>
                                    ))}
                                  </div>
                                </div>
                                <div className="kitchen-dish-card__status-row">
                                  <span className={`kitchen-meal-status kitchen-meal-status--${meal.status}`}>
                                    {kitchenDishStatus(meal.status)}
                                  </span>
                                  {eaten ? <span className="eaten-tag"><Check size={13} /> Đã ăn</span> : null}
                                </div>
                                {latestRequest ? (
                                  <p className={`change-request-status change-request-status--${latestRequest.status}`}>
                                    {latestRequest.status === "pending"
                                      ? "Bếp đang xem yêu cầu đổi món"
                                      : latestRequest.status === "approved"
                                        ? "Bếp đã chấp nhận yêu cầu đổi món"
                                        : latestRequest.status === "rejected"
                                          ? `Bếp chưa thể đổi món${latestRequest.response_note ? `: ${latestRequest.response_note}` : ""}`
                                          : "Yêu cầu đổi đã hủy"}
                                  </p>
                                ) : null}
                                <div className="kitchen-dish-card__actions">
                                  <button
                                    className="button button--dark button--small"
                                    disabled={eaten || meal.status !== "delivered" || !hasActiveSubscription || Boolean(confirmingId)}
                                    title={
                                      eaten
                                        ? "Món đã có trong nhật ký dinh dưỡng"
                                        : !hasActiveSubscription
                                          ? "Cần gói Plus để ghi vào nhật ký"
                                          : meal.status !== "delivered"
                                            ? "Chỉ xác nhận đã ăn sau khi bếp giao món"
                                            : "Xác nhận đã ăn và thêm vào nhật ký dinh dưỡng"
                                    }
                                    onClick={() => void confirmKitchenItem(item.id)}
                                  >
                                    {confirmingId === item.id
                                      ? <LoaderCircle className="spin" size={16} />
                                      : <Check size={16} />}
                                    {eaten
                                      ? "Đã ghi nhật ký"
                                      : !hasActiveSubscription
                                        ? "Cần Plus để ghi"
                                        : meal.status !== "delivered"
                                          ? "Chờ bếp giao"
                                          : "Đã ăn"}
                                  </button>
                                  <button
                                    className="button button--outline button--small"
                                    disabled={!canRequest || pending || approved}
                                    onClick={() => setKitchenChangeItem({ item, kitchenName: meal.kitchens.name })}
                                  >
                                    <MessageSquarePlus size={15} />
                                    {pending
                                      ? "Đã gửi yêu cầu"
                                      : approved
                                        ? "Bếp đã đồng ý đổi"
                                        : canRequest
                                          ? "Yêu cầu đổi món"
                                          : "Đã quá giờ đổi"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </article>
                  );
                  })}
                </div>
                <aside className="plan-aside kitchen-nutrition-aside">
                  <TodayNutritionCard
                    meals={kitchenNutritionItems}
                    targets={nutritionTargets}
                    sourceLabel="lịch ăn của bếp đối tác"
                    micronutrientsAvailable={false}
                    onOpenJournal={onOpenJournal}
                  />
                </aside>
              </div>
            )}
          </section>
        </>
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
      {kitchenChangeItem && (
        <KitchenMealChangeModal
          item={kitchenChangeItem.item}
          kitchenName={kitchenChangeItem.kitchenName}
          onClose={() => setKitchenChangeItem(null)}
          onRequested={() => {
            setKitchenChangeItem(null);
            void loadMenus();
          }}
        />
      )}
    </div>
  );
}
