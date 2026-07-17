"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight, Check, LockKeyhole, Sparkles } from "lucide-react";
import { useState } from "react";
import { MacroRow } from "@/components/ui/nutrition-widgets";
import type { Meal } from "@/lib/data";
import { weekPlan } from "@/lib/data";

export function MealPlanPage({
  subscribed,
  onSubscribe,
  onMeal,
  onAdd
}: {
  subscribed: boolean;
  onSubscribe: () => void;
  onMeal: (meal: Meal) => void;
  onAdd: (meal: Meal) => void;
}) {
  const [dayIndex, setDayIndex] = useState(0);
  const day = weekPlan[dayIndex];

  return (
    <div className="page-content">
      <section className="page-title">
        <div>
          <p className="eyebrow">KẾ HOẠCH CÁ NHÂN</p>
          <h1>Thực đơn 7 ngày của bạn</h1>
          <p>Mục tiêu trung bình 1.680 kcal/ngày · giàu protein · không có dị ứng.</p>
        </div>
        <div className="week-switcher">
          <button className="icon-button" onClick={() => setDayIndex((value) => Math.max(0, value - 1))}><ArrowLeft size={18} /></button>
          <strong>15–21 tháng 7</strong>
          <button className="icon-button" onClick={() => setDayIndex((value) => Math.min(6, value + 1))}><ArrowRight size={18} /></button>
        </div>
      </section>

      <div className="day-tabs">
        {weekPlan.map((item, index) => (
          <button key={item.date} className={index === dayIndex ? "active" : ""} onClick={() => setDayIndex(index)}>
            <span>{item.day.replace("Thứ ", "T")}</span>
            <strong>{item.date.split("/")[0]}</strong>
          </button>
        ))}
      </div>

      <section className="plan-layout">
        <div className="plan-list">
          <div className="section-heading">
            <div><span className="section-kicker">{day.day.toUpperCase()} · {day.date}</span><h2>Hôm nay ăn gì?</h2></div>
            <span className="status-pill"><span /> Cân bằng 96%</span>
          </div>
          {day.meals.map(({ slot, meal }, index) => {
            const locked = !subscribed && (dayIndex > 0 || index > 0);

            return (
              <article className={`plan-item ${locked ? "plan-item--locked" : ""}`} key={`${day.date}-${slot}`}>
                <div className="plan-item__time"><span>{slot}</span><small>{slot === "Sáng" ? "07:30" : slot === "Trưa" ? "12:00" : "18:30"}</small></div>
                <div className="plan-item__image"><Image src={meal.image} alt={meal.name} fill sizes="140px" /></div>
                <div className="plan-item__body">
                  <h3>{meal.name}</h3>
                  <p>{meal.subtitle}</p>
                  <div className="meal-card__meta"><span>{meal.calories} kcal</span><span>{meal.protein}g protein</span><span>{meal.prepTime} phút</span></div>
                </div>
                {locked ? (
                  <button className="locked-button" onClick={onSubscribe}><LockKeyhole size={17} /> Mở khóa</button>
                ) : (
                  <div className="plan-item__actions">
                    <button className="icon-button" title="Ghi đã ăn" onClick={() => onAdd(meal)}><Check size={18} /></button>
                    <button className="button button--outline button--small" onClick={() => onMeal(meal)}>Xem món</button>
                  </div>
                )}
                {locked && <div className="plan-item__veil" />}
              </article>
            );
          })}
        </div>
        <aside className="plan-aside">
          <div className="aside-card">
            <span className="section-kicker">TỔNG DINH DƯỠNG</span>
            <h3>{day.day}</h3>
            <MacroRow label="Protein" value={108} target={112} color="var(--coral)" />
            <MacroRow label="Carbs" value={170} target={181} color="var(--amber)" />
            <MacroRow label="Chất béo" value={57} target={52} color="var(--mint-dark)" />
            <div className="aside-total"><span>Tổng năng lượng</span><strong>1.576 kcal</strong></div>
          </div>
          {!subscribed && (
            <div className="aside-card aside-card--dark">
              <Sparkles size={24} /><h3>Mở toàn bộ kế hoạch</h3>
              <p>Xem Recipe, định lượng và đổi món trong cả tuần.</p>
              <button className="button button--cream" onClick={onSubscribe}>Dùng thử 7 ngày</button>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}
