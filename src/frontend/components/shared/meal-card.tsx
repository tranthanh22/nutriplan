import Image from "next/image";
import { Check, Clock3, Flame, Target } from "lucide-react";
import type { Meal } from "@/lib/data";

export function MealCard({
  slot,
  meal,
  eaten = false,
  onClick
}: {
  slot: string;
  meal: Meal;
  eaten?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`meal-card ${eaten ? "meal-card--eaten" : ""}`}
      onClick={onClick}
    >
      <div className="meal-card__image">
        <Image src={meal.image} alt={meal.name} fill sizes="(max-width: 800px) 100vw, 33vw" />
        <span className="meal-card__slot">{slot}</span>
        {eaten ? (
          <span className="meal-card__eaten"><Check size={13} /> Đã ăn</span>
        ) : null}
      </div>
      <div className="meal-card__body">
        <h3>{meal.name}</h3>
        <p>{meal.subtitle}</p>
        <div className="meal-card__meta">
          <span><Flame size={15} /> {meal.calories} kcal</span>
          <span><Target size={15} /> {meal.protein}g đạm</span>
          <span><Clock3 size={15} /> {meal.prepTime} phút</span>
        </div>
      </div>
    </button>
  );
}
