"use client";

import Image from "next/image";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  ChefHat,
  Flame,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  Target,
  TrendingDown
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MealCard } from "@/components/shared/meal-card";
import { AiInsightDashboardCard } from "@/features/ai-insights/ai-insights-page";
import {
  getMyMenus,
  personalMealItemToMeal
} from "@/features/meal-plan/meal-plan-api";
import {
  getWeightHistory,
  type WeightHistoryEntry,
  type WeightRange
} from "./weight-history-api";
import type { MyMenusResponse } from "@/features/meal-plan/meal-plan-types";
import type { PersonalMealItem } from "@/features/meal-plan/meal-plan-types";
import type { Meal } from "@/lib/data";
import type {
  ConsumedNutrition,
  NutritionSummary,
  Profile,
  View
} from "@/types/app";

const mealLabels = {
  breakfast: "Sáng",
  lunch: "Trưa",
  dinner: "Tối",
  snack: "Bữa phụ"
} as const;

function dashboardMealLabel(item: PersonalMealItem) {
  if (item.dishes.dish_kind === "drink") return "Đồ uống";
  if (item.dishes.dish_kind === "snack") return "Bữa nhẹ";
  return mealLabels[item.meal_type];
}

const mealOrder: Record<PersonalMealItem["meal_type"], number> = {
  breakfast: 0,
  lunch: 1,
  snack: 2,
  dinner: 3
};

const weightRangeOptions: { value: WeightRange; label: string }[] = [
  { value: "7d", label: "7 ngày" },
  { value: "1m", label: "1 tháng" },
  { value: "3m", label: "3 tháng" },
  { value: "1y", label: "1 năm" },
  { value: "all", label: "Tất cả" }
];

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function DashboardPage({
  profile,
  nutrition,
  consumed,
  subscribed,
  menuRevision,
  onEdit,
  onGo,
  onMeal,
  onSubscribe
}: {
  profile: Profile;
  nutrition: NutritionSummary;
  consumed: ConsumedNutrition;
  subscribed: boolean;
  menuRevision: number;
  onEdit: () => void;
  onGo: (view: View) => void;
  onMeal: (meal: Meal) => void;
  onSubscribe: () => void;
}) {
  const [menus, setMenus] = useState<MyMenusResponse | null>(null);
  const [loadingMenus, setLoadingMenus] = useState(true);
  const [menuError, setMenuError] = useState("");
  const [weightRange, setWeightRange] = useState<WeightRange>("1m");
  const [weightHistory, setWeightHistory] = useState<WeightHistoryEntry[]>([]);
  const [loadingWeight, setLoadingWeight] = useState(true);
  const [weightError, setWeightError] = useState("");
  const today = localDateKey();
  const calorieProgress = Math.min(
    100,
    Math.round((consumed.calories / nutrition.target) * 100)
  );
  const effectiveSubscribed = menus?.subscriptionActive ?? subscribed;
  const loadMenus = useCallback(async () => {
    setLoadingMenus(true);
    setMenuError("");
    try {
      setMenus(await getMyMenus());
    } catch (requestError) {
      setMenuError(
        requestError instanceof Error
          ? requestError.message
          : "Không thể tải thực đơn hôm nay."
      );
    } finally {
      setLoadingMenus(false);
    }
  }, []);

  useEffect(() => {
    void loadMenus();
  }, [loadMenus, menuRevision, subscribed]);

  useEffect(() => {
    let active = true;
    setLoadingWeight(true);
    setWeightError("");
    void getWeightHistory(weightRange)
      .then((response) => {
        if (active) setWeightHistory(response.entries);
      })
      .catch((requestError) => {
        if (!active) return;
        setWeightHistory([]);
        setWeightError(
          requestError instanceof Error
            ? requestError.message
            : "Không thể tải lịch sử cân nặng."
        );
      })
      .finally(() => {
        if (active) setLoadingWeight(false);
      });
    return () => {
      active = false;
    };
  }, [profile.weight, weightRange]);

  const todayMeals = useMemo(
    () =>
      (menus?.personalPlan?.meal_plan_items ?? [])
        .filter((item) => item.planned_date === today)
        .sort(
          (first, second) =>
            mealOrder[first.meal_type] - mealOrder[second.meal_type] ||
            first.sequence_no - second.sequence_no
        ),
    [menus, today]
  );
  const nextItem =
    todayMeals.find((item) => item.consumption_status !== "eaten") ??
    todayMeals[0];
  const nextMeal = nextItem ? personalMealItemToMeal(nextItem) : null;

  return (
    <div className="page-content dashboard-page">
      <section className="dashboard-summary-grid">
        <article className="figma-card dashboard-metrics">
          <div className="figma-card__heading">
            <h2>
              <Activity size={20} /> Chỉ số của bạn
            </h2>
            <button className="link-button" onClick={onEdit}>
              Chỉnh hồ sơ &amp; số đo <ArrowRight size={15} />
            </button>
          </div>
          <div className="dashboard-metric-grid">
            <div>
              <span>Cân nặng</span>
              <strong>
                {profile.weight} <small>kg</small>
              </strong>
            </div>
            <div>
              <span>BMR</span>
              <strong>
                {nutrition.bmr} <small>kcal</small>
              </strong>
            </div>
            <div>
              <span>TDEE</span>
              <strong>
                {nutrition.tdee} <small>kcal</small>
              </strong>
            </div>
            <div>
              <span>Cân nặng đích</span>
              <strong className="is-positive">
                {profile.targetWeight} <small>kg</small>
              </strong>
            </div>
          </div>
          <div className="dashboard-calorie-progress">
            <div>
              <span>
                <Flame size={17} /> Calo hôm nay
              </span>
              <strong>
                {consumed.calories} / {nutrition.target} kcal
              </strong>
            </div>
            <div className="dashboard-progress-track">
              <span style={{ width: `${calorieProgress}%` }} />
            </div>
            <div className="dashboard-calorie-progress__footer">
              <p>
                Còn lại {Math.max(0, nutrition.target - consumed.calories)} kcal
                {calorieProgress <= 100
                  ? " — bạn đang đi đúng kế hoạch."
                  : " — hãy ưu tiên bữa nhẹ cho phần còn lại trong ngày."}
              </p>
              <button className="button button--soft button--small" onClick={() => onGo("plan")}>
                Xem thực đơn hôm nay <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </article>

        <article className="figma-card weight-card">
          <div className="figma-card__heading weight-card__heading">
            <div>
              <h2>
                <TrendingDown size={22} /> Xu hướng cân nặng
              </h2>
              <p>Chỉ hiển thị các số đo thực tế bạn đã lưu, đơn vị kilogram.</p>
            </div>
            <div className="weight-range-tabs" aria-label="Khoảng thời gian biểu đồ">
              {weightRangeOptions.map((option) => (
                <button
                  className={weightRange === option.value ? "is-active" : ""}
                  key={option.value}
                  onClick={() => setWeightRange(option.value)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          {loadingWeight ? (
            <div className="weight-card__state">
              <LoaderCircle className="spin" size={25} />
              <span>Đang tải lịch sử cân nặng…</span>
            </div>
          ) : weightError ? (
            <div className="weight-card__state weight-card__state--error">
              <AlertCircle size={25} />
              <span>{weightError}</span>
            </div>
          ) : weightHistory.length < 2 ? (
            <div className="weight-card__state">
              <TrendingDown size={28} />
              <strong>
                {weightHistory.length === 1
                  ? "Cần thêm một lần cập nhật để thấy xu hướng"
                  : "Chưa có dữ liệu cân nặng trong khoảng này"}
              </strong>
              <span>
                {weightHistory.length === 1
                  ? `Đã ghi nhận ${Number(weightHistory[0].weight_kg)} kg ngày ${formatWeightDate(weightHistory[0].recorded_on, "7d")}.`
                  : "Mỗi lần bạn cập nhật hồ sơ và số đo, cân nặng sẽ được ghi lại tại đây."}
              </span>
              <button className="button button--soft button--small" onClick={onEdit}>
                Cập nhật số đo
              </button>
            </div>
          ) : (
            <>
              <WeightTrendChart entries={weightHistory} range={weightRange} />
              <WeightTrendResult entries={weightHistory} />
            </>
          )}
        </article>
      </section>

      <AiInsightDashboardCard />

      <section>
        <article className="figma-card next-meal-card">
          <div className="figma-card__heading">
            <h2>
              <Target size={19} /> Bữa ăn kế tiếp
            </h2>
            <button className="link-button" onClick={() => onGo("plan")}>
              Cả thực đơn <ArrowRight size={15} />
            </button>
          </div>
          {loadingMenus ? (
            <div className="dashboard-menu-state">
              <LoaderCircle className="spin" size={22} />
              <span>Đang đồng bộ thực đơn cá nhân…</span>
            </div>
          ) : menuError ? (
            <div className="plan-api-error">
              <AlertCircle size={18} />
              <span>{menuError}</span>
              <button onClick={() => void loadMenus()}>
                <RefreshCw size={15} /> Thử lại
              </button>
            </div>
          ) : nextMeal ? (
            <button
              className="next-meal"
              type="button"
              onClick={() => onMeal(nextMeal)}
            >
              <span className="next-meal__image">
                <Image
                  src={nextMeal.image}
                  alt={nextMeal.name}
                  fill
                  sizes="(max-width: 760px) 100vw, 280px"
                />
              </span>
              <span className="next-meal__content">
                <span className="next-meal__tags">
                  <small>{dashboardMealLabel(nextItem!)}</small>
                  <small>Kế hoạch cá nhân</small>
                </span>
                <strong>{nextMeal.name}</strong>
                <span>{nextMeal.subtitle}</span>
                <span className="next-meal__nutrition">
                  <small>
                    <Flame size={14} /> {nextMeal.calories} kcal
                  </small>
                  <small>{nextMeal.protein}g đạm</small>
                  <small>{nextMeal.carbs}g tinh bột</small>
                </span>
                <span className="next-meal__link">
                  Xem chi tiết <ArrowRight size={15} />
                </span>
              </span>
            </button>
          ) : (
            <div className="dashboard-menu-state dashboard-menu-state--empty">
              <Sparkles size={24} />
              <div>
                <h3>
                  {effectiveSubscribed
                    ? "Hoàn thành hồ sơ để tạo thực đơn"
                    : "Mở thực đơn cá nhân với NutriPlan Plus"}
                </h3>
                <p>
                  {menus?.personalPlanUnavailableReason ??
                    "Thực đơn được tính theo mục tiêu calorie và macro của bạn."}
                </p>
              </div>
              <button
                className="button button--primary button--small"
                onClick={effectiveSubscribed ? onEdit : onSubscribe}
              >
                {effectiveSubscribed ? "Cập nhật hồ sơ" : "Đăng ký Plus"}
              </button>
            </div>
          )}
        </article>

      </section>

      {todayMeals.length > 0 ? (
        <section className="section-block">
          <div className="section-heading">
            <div>
              <span className="section-kicker">KẾ HOẠCH CÁ NHÂN</span>
              <h2>Thực đơn hôm nay</h2>
            </div>
            <button className="link-button" onClick={() => onGo("plan")}>
              Xem cả tuần <ArrowRight size={16} />
            </button>
          </div>
          <div className="meal-row">
            {todayMeals.map((item) => {
              const meal = personalMealItemToMeal(item);
              return (
                <MealCard
                  key={item.id}
                  slot={dashboardMealLabel(item)}
                  meal={meal}
                  eaten={item.consumption_status === "eaten"}
                  onClick={() => onMeal(meal)}
                />
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="dashboard-kitchen-banner">
        <span>
          <ChefHat />
        </span>
        <div>
          <small>BẾP ĐỐI TÁC</small>
          <h2>Không có thời gian nấu?</h2>
          <p>Mua món lẻ hoặc gói ăn phù hợp mà không cần đăng ký Plus.</p>
        </div>
        <button className="button button--primary" onClick={() => onGo("kitchens")}>
          Khám phá bếp <ArrowRight size={16} />
        </button>
      </section>
    </div>
  );
}

function WeightTrendChart({
  entries,
  range: timeRange
}: {
  entries: WeightHistoryEntry[];
  range: WeightRange;
}) {
  const width = 1000;
  const height = 260;
  const plot = { left: 70, right: 30, top: 38, bottom: 46 };
  const values = entries.map((entry) => Number(entry.weight_kg));
  const minWeight = Math.floor((Math.min(...values) - .5) * 2) / 2;
  const maxWeight = Math.ceil((Math.max(...values) + .5) * 2) / 2;
  const weightSpan = Math.max(1, maxWeight - minWeight);
  const chartWidth = width - plot.left - plot.right;
  const chartHeight = height - plot.top - plot.bottom;
  const points = values.map((value, index) => ({
    value,
    x: plot.left + (index * chartWidth) / (values.length - 1),
    y: plot.top + ((maxWeight - value) / weightSpan) * chartHeight
  }));
  const linePoints = points.map((point) => `${point.x},${point.y}`).join(" ");
  const yTicks = Array.from(
    { length: 5 },
    (_, index) => maxWeight - (weightSpan * index) / 4
  );
  const visibleLabelIndexes = getVisibleLabelIndexes(entries.length);
  const firstValue = values[0];
  const lastValue = values[values.length - 1];

  return (
    <div className="weight-chart">
      <svg
        aria-label={`Xu hướng cân nặng, từ ${firstValue} kg đến ${lastValue} kg`}
        role="img"
        viewBox={`0 0 ${width} ${height}`}
      >
        <title>Biểu đồ đường xu hướng cân nặng</title>
        <defs>
          <linearGradient id="weight-area-gradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity=".22" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
          </linearGradient>
        </defs>
        <text className="weight-chart__axis-unit" x={plot.left - 12} y={20} textAnchor="end">kg</text>
        {yTicks.map((tick) => {
          const y = plot.top + ((maxWeight - tick) / weightSpan) * chartHeight;
          return (
            <g key={tick}>
              <line className="weight-chart__grid" x1={plot.left} x2={width - plot.right} y1={y} y2={y} />
              <text className="weight-chart__axis-label" x={plot.left - 12} y={y + 5} textAnchor="end">{tick.toFixed(1)}</text>
            </g>
          );
        })}
        <polygon
          className="weight-chart__area"
          points={`${points[0].x},${plot.top + chartHeight} ${linePoints} ${points.at(-1)!.x},${plot.top + chartHeight}`}
        />
        <polyline className="weight-chart__line" points={linePoints} />
        {points.map((point, index) => {
          const showLabel = visibleLabelIndexes.has(index);
          const dateLabel = formatWeightDate(entries[index].recorded_on, timeRange);
          return (
            <g key={entries[index].id}>
              <circle
                aria-label={`${dateLabel}: ${point.value} kg`}
                className="weight-chart__point"
                cx={point.x}
                cy={point.y}
                r={index === points.length - 1 ? 7 : 6}
              />
              {showLabel ? (
                <>
                  <text className="weight-chart__day-label" x={point.x} y={height - 13} textAnchor="middle">{dateLabel}</text>
                  <text className="weight-chart__value-label" x={point.x} y={point.y - 14} textAnchor="middle">{`${point.value} kg`}</text>
                </>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function WeightTrendResult({ entries }: { entries: WeightHistoryEntry[] }) {
  const first = Number(entries[0].weight_kg);
  const latest = Number(entries.at(-1)!.weight_kg);
  const change = Number((latest - first).toFixed(1));
  const changeLabel = change === 0
    ? "Không đổi trong khoảng đã chọn"
    : `${change > 0 ? "+" : ""}${change} kg trong khoảng đã chọn`;

  return (
    <div className="weight-card__result">
      <div>
        <small>Lần ghi nhận gần nhất · {formatWeightDate(entries.at(-1)!.recorded_on, "7d")}</small>
        <strong>{latest} kg</strong>
      </div>
      <span className={change > 0 ? "is-increase" : ""}>
        <TrendingDown size={16} /> {changeLabel}
      </span>
    </div>
  );
}

function getVisibleLabelIndexes(length: number) {
  const labelCount = Math.min(7, length);
  return new Set(
    Array.from({ length: labelCount }, (_, index) =>
      Math.round((index * (length - 1)) / Math.max(1, labelCount - 1))
    )
  );
}

function formatWeightDate(date: string, range: WeightRange) {
  const value = new Date(`${date}T00:00:00`);
  return new Intl.DateTimeFormat("vi-VN", {
    day: range === "1y" || range === "all" ? undefined : "2-digit",
    month: "2-digit",
    year: range === "1y" || range === "all" ? "numeric" : undefined
  }).format(value);
}
