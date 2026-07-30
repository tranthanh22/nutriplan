"use client";

import Image from "next/image";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
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
import { MacroRow } from "@/components/ui/nutrition-widgets";
import { AiInsightDashboardCard } from "@/features/ai-insights/ai-insights-page";
import {
  getMyMenus,
  personalMealItemToMeal
} from "@/features/meal-plan/meal-plan-api";
import type { MyMenusResponse } from "@/features/meal-plan/meal-plan-types";
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

const weightTrend = [64.1, 63.7, 63.9, 63.2, 62.8, 62.5, 62.1];

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function goalLabel(goal: Profile["goal"]) {
  if (goal === "lose") return "Giảm mỡ lành mạnh";
  if (goal === "gain") return "Tăng cơ";
  return "Duy trì cân nặng";
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

  const todayMeals = useMemo(
    () =>
      (menus?.personalPlan?.meal_plan_items ?? [])
        .filter((item) => item.planned_date === today)
        .sort((first, second) => first.sequence_no - second.sequence_no),
    [menus, today]
  );
  const nextItem =
    todayMeals.find((item) => item.consumption_status !== "eaten") ??
    todayMeals[0];
  const nextMeal = nextItem ? personalMealItemToMeal(nextItem) : null;

  return (
    <div className="page-content dashboard-page">
      <section className="dashboard-welcome">
        <div>
          <p className="eyebrow">TỔNG QUAN HÔM NAY</p>
          <h1>
            Chào buổi sáng, {profile.name.split(" ").slice(-1)[0]}!{" "}
            <span aria-hidden="true">👋</span>
          </h1>
          <p>
            Mục tiêu: <strong>{goalLabel(profile.goal)}</strong>
            {subscribed ? " · Kế hoạch Plus đang hoạt động" : " · Tài khoản miễn phí"}
          </p>
        </div>
        <button className="button button--primary" onClick={() => onGo("plan")}>
          <CalendarDays size={17} /> Xem thực đơn hôm nay
        </button>
      </section>

      <section className="dashboard-summary-grid">
        <article className="figma-card dashboard-metrics">
          <div className="figma-card__heading">
            <h2>
              <Activity size={20} /> Chỉ số của bạn
            </h2>
            <button className="link-button" onClick={onEdit}>
              Cập nhật <ArrowRight size={15} />
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
              <span>Mục tiêu</span>
              <strong className="is-positive">
                {nutrition.target} <small>kcal</small>
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
            <p>
              Còn lại {Math.max(0, nutrition.target - consumed.calories)} kcal
              {calorieProgress <= 100
                ? " — bạn đang đi đúng kế hoạch."
                : " — hãy ưu tiên bữa nhẹ cho phần còn lại trong ngày."}
            </p>
          </div>
        </article>

        <article className="figma-card weight-card">
          <div className="figma-card__heading">
            <h2>
              <TrendingDown size={18} /> Xu hướng 7 ngày
            </h2>
          </div>
          <div className="weight-sparkline" aria-label="Biểu đồ xu hướng cân nặng">
            {weightTrend.map((weight, index) => (
              <div key={`${weight}-${index}`}>
                <span style={{ height: `${42 + (weight - 62) * 22}%` }} />
                <small>{index === 6 ? "CN" : `T${index + 2}`}</small>
              </div>
            ))}
          </div>
          <div className="weight-card__result">
            <strong>{profile.weight} kg</strong>
            <span>
              <TrendingDown size={14} /> Dữ liệu minh họa 7 ngày
            </span>
          </div>
          <button className="button button--soft button--full" onClick={onEdit}>
            Cập nhật số đo
          </button>
        </article>
      </section>

      <AiInsightDashboardCard onEditProfile={onEdit} />

      <section className="dashboard-focus-grid">
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
                  <small>{mealLabels[nextItem!.meal_type]}</small>
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

        <article className="figma-card daily-macros-card">
          <div className="figma-card__heading">
            <h2>
              <CheckCircle2 size={18} /> Dinh dưỡng hôm nay
            </h2>
            <button className="link-button" onClick={() => onGo("journal")}>
              Nhật ký
            </button>
          </div>
          <div className="daily-macros-card__body">
            <MacroRow
              label="Protein"
              value={consumed.protein}
              target={nutrition.protein}
              color="var(--primary)"
            />
            <MacroRow
              label="Tinh bột"
              value={consumed.carbs}
              target={nutrition.carbs}
              color="var(--amber)"
            />
            <MacroRow
              label="Chất béo"
              value={consumed.fat}
              target={nutrition.fat}
              color="#6366f1"
            />
          </div>
          <button
            className="button button--soft button--full"
            onClick={() => onGo("journal")}
          >
            Xem nhật ký dinh dưỡng
          </button>
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
                  slot={mealLabels[item.meal_type]}
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
