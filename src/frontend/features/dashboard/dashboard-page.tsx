import { ArrowRight, Camera, ChefHat, Flame, Sparkles, Target } from "lucide-react";
import { MealCard } from "@/components/shared/meal-card";
import { MacroRow, Metric, ProgressRing } from "@/components/ui/nutrition-widgets";
import type { Meal } from "@/lib/data";
import { weekPlan } from "@/lib/data";
import type { ConsumedNutrition, NutritionSummary, Profile, View } from "@/types/app";

export function DashboardPage({
  profile,
  nutrition,
  consumed,
  subscribed,
  onEdit,
  onGo,
  onMeal,
  onSubscribe
}: {
  profile: Profile;
  nutrition: NutritionSummary;
  consumed: ConsumedNutrition;
  subscribed: boolean;
  onEdit: () => void;
  onGo: (view: View) => void;
  onMeal: (meal: Meal) => void;
  onSubscribe: () => void;
}) {
  const progress = Math.min(100, Math.round((consumed.calories / nutrition.target) * 100));

  return (
    <div className="page-content">
      <section className="welcome-row">
        <div>
          <p className="eyebrow">THỨ TƯ, 15 THÁNG 7</p>
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

      <section className="section-block">
        <div className="section-heading">
          <div><span className="section-kicker">GỢI Ý CHO BẠN</span><h2>Thực đơn hôm nay</h2></div>
          <button className="link-button" onClick={() => onGo("plan")}>Xem cả tuần <ArrowRight size={16} /></button>
        </div>
        <div className="meal-row">
          {weekPlan[0].meals.map(({ slot, meal }) => (
            <MealCard key={slot} slot={slot} meal={meal} onClick={() => onMeal(meal)} />
          ))}
        </div>
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
