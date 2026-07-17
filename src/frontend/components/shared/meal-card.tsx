import Image from "next/image";
import { Clock3, Flame, Target } from "lucide-react";
import type { Meal } from "@/lib/data";

export function MealCard({ slot, meal, onClick }: { slot: string; meal: Meal; onClick: () => void }) {
  return (
    <article className="meal-card" onClick={onClick}>
      <div className="meal-card__image">
        <Image src={meal.image} alt={meal.name} fill sizes="(max-width: 800px) 100vw, 33vw" />
        <span>{slot}</span>
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
    </article>
  );
}
