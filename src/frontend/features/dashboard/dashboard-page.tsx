"use client";

import {
  AlertCircle,
  ArrowRight,
  Camera,
  ChefHat,
  Flame,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  Target
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MealCard } from "@/components/shared/meal-card";
import { MacroRow, Metric, ProgressRing } from "@/components/ui/nutrition-widgets";
import { AiInsightDashboardCard } from "@/features/ai-insights/ai-insights-page";
import {
  getMyMenus,
  personalMealItemToMeal
} from "@/features/meal-plan/meal-plan-api";
import type { MyMenusResponse } from "@/features/meal-plan/meal-plan-types";
import type { Meal } from "@/lib/data";
import type { ConsumedNutrition, NutritionSummary, Profile, View } from "@/types/app";

const mealLabels = {
  breakfast: "Sáng",
  lunch: "Trưa",
  dinner: "Tối",
  snack: "Bữa phụ"
} as const;

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
  const progress = Math.min(100, Math.round((consumed.calories / nutrition.target) * 100));
  const today = localDateKey();
  const todayLabel = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(new Date());
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

  return (
    <div className="page-content">
      <section className="welcome-row">
        <div>
          <p className="eyebrow">{todayLabel.toUpperCase()}</p>
          <h1>Chào buổi sáng, {profile.name.split(" ").slice(-1)[0]} <span>👋</span></h1>
          <p>Một ngày mới để tiến gần hơn tới mục tiêu của bạn.</p>
        </div>
        <button className="button button--outline" onClick={onEdit}><Target size={18} /> Chỉnh mục tiêu</button>
      </section>

      <section className="hero-grid">
        <div className="calorie-card">
          <div className="calorie-card__head">
            <div>
              <span className="section-kicker">NĂNG LƯỢNG HÔM NAY</span>
              <h2>{consumed.calories.toLocaleString("vi-VN")} <small>/ {nutrition.target.toLocaleString("vi-VN")} kcal</small></h2>
            </div>
            <span className="status-pill"><span /> Đang đúng kế hoạch</span>
          </div>
          <div className="calorie-card__body">
            <ProgressRing progress={progress} label={`${progress}%`} sublabel="đã nạp" />
            <div className="macro-stack">
              <MacroRow label="Protein" value={consumed.protein} target={nutrition.protein} color="var(--coral)" />
              <MacroRow label="Carbs" value={consumed.carbs} target={nutrition.carbs} color="var(--amber)" />
              <MacroRow label="Chất béo" value={consumed.fat} target={nutrition.fat} color="var(--mint-dark)" />
            </div>
          </div>
          <div className="calorie-card__footer">
            <span><Flame size={16} /> Còn lại <strong>{Math.max(0, nutrition.target - consumed.calories)} kcal</strong></span>
            <button className="link-button" onClick={() => onGo("journal")}>Xem chi tiết <ArrowRight size={15} /></button>
          </div>
        </div>

        <div className="profile-summary">
          <span className="section-kicker">HỒ SƠ DINH DƯỠNG</span>
          <h3>Mục tiêu: {profile.goal === "lose" ? "Giảm mỡ lành mạnh" : profile.goal === "gain" ? "Tăng cơ" : "Duy trì cân nặng"}</h3>
          <p>Các chỉ số nền do hệ thống tính từ dữ liệu bạn cung cấp.</p>
          <div className="metric-grid">
            <Metric label="BMR" value={`${nutrition.bmr}`} unit="kcal" />
            <Metric label="TDEE" value={`${nutrition.tdee}`} unit="kcal" />
            <Metric label="Mục tiêu" value={`${nutrition.target}`} unit="kcal" />
            <Metric label="Protein" value={`${nutrition.protein}`} unit="g" />
          </div>
          <button className="link-button" onClick={onEdit}>Cập nhật chỉ số <ArrowRight size={15} /></button>
        </div>
      </section>

      <AiInsightDashboardCard onEditProfile={onEdit} />

      <section className="section-block">
        <div className="section-heading">
          <div><span className="section-kicker">GỢI Ý CHO BẠN</span><h2>Thực đơn hôm nay</h2></div>
          <button className="link-button" onClick={() => onGo("plan")}>Xem cả tuần <ArrowRight size={16} /></button>
        </div>
        {loadingMenus ? (
          <div className="dashboard-menu-state">
            <LoaderCircle className="spin" size={22} />
            <span>Đang tạo và đồng bộ thực đơn cá nhân…</span>
          </div>
        ) : menuError ? (
          <div className="plan-api-error">
            <AlertCircle size={18} />
            <span>{menuError}</span>
            <button onClick={() => void loadMenus()}>
              <RefreshCw size={15} /> Thử lại
            </button>
          </div>
        ) : todayMeals.length > 0 ? (
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
                  "Thực đơn sẽ được tính theo mục tiêu calorie và macro của bạn."}
              </p>
            </div>
            <button
              className="button button--dark button--small"
              onClick={effectiveSubscribed ? onEdit : onSubscribe}
            >
              {effectiveSubscribed ? "Cập nhật hồ sơ" : "Đăng ký Plus"}
            </button>
          </div>
        )}
      </section>

      <section className="split-cta">
        <div className="cta-panel cta-panel--mint">
          <div className="cta-panel__icon"><ChefHat /></div>
          <div>
            <span className="section-kicker">KHÔNG CÓ THỜI GIAN NẤU?</span>
            <h3>Để bếp đối tác chuẩn bị giúp bạn</h3>
            <p>Mua món lẻ hoặc gói 5 ngày, không cần đăng ký NutriPlan Plus.</p>
            <button className="button button--dark" onClick={() => onGo("kitchens")}>Khám phá bếp <ArrowRight size={17} /></button>
          </div>
        </div>
        <div className="cta-panel cta-panel--peach">
          <div className="cta-panel__icon"><Camera /></div>
          <div>
            <span className="section-kicker">MEAL SCAN BETA</span>
            <h3>Chụp món ăn, ghi nhật ký nhanh hơn</h3>
            <p>Nhận ước tính Calorie/Macro và tự xác nhận trước khi lưu.</p>
            <button className="button button--light" onClick={() => subscribed ? onGo("journal") : onSubscribe()}>
              {subscribed ? "Mở Meal Scan" : "Mở khóa với Plus"} <Sparkles size={17} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
