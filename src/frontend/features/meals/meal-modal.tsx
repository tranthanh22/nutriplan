import Image from "next/image";
import { AlertCircle, Check, LoaderCircle, LockKeyhole, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Metric } from "@/components/ui/nutrition-widgets";
import { getDishRecipe, type DishRecipe } from "@/features/meal-plan/meal-plan-api";
import type { Meal } from "@/lib/data";

export function MealModal({
  meal,
  subscribed,
  onClose,
  onSubscribe,
  onAdd
}: {
  meal: Meal;
  subscribed: boolean;
  onClose: () => void;
  onSubscribe: () => void;
  onAdd: () => void | Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [recipe, setRecipe] = useState<DishRecipe | null>(null);
  const [recipeError, setRecipeError] = useState("");
  const [recipeLoading, setRecipeLoading] = useState(subscribed);
  const eaten = meal.consumptionStatus === "eaten";

  useEffect(() => {
    if (!subscribed) {
      setRecipe(null);
      setRecipeLoading(false);
      return;
    }

    const controller = new AbortController();
    setRecipe(null);
    setRecipeError("");
    setRecipeLoading(true);
    void getDishRecipe(meal.id, controller.signal)
      .then(setRecipe)
      .catch((loadError: unknown) => {
        if (controller.signal.aborted) return;
        setRecipeError(
          loadError instanceof Error
            ? loadError.message
            : "Không thể tải công thức của món này."
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setRecipeLoading(false);
      });

    return () => controller.abort();
  }, [meal.id, subscribed]);

  async function addMeal() {
    setSaving(true);
    setError("");
    try {
      await onAdd();
    } catch (addError) {
      setError(
        addError instanceof Error
          ? addError.message
          : "Không thể ghi nhận bữa ăn."
      );
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose} wide>
      <div className="meal-modal">
        <div className="meal-modal__hero">
          <Image src={meal.image} alt={meal.name} fill sizes="680px" />
          <button className="modal-close modal-close--image" onClick={onClose}><X size={19} /></button>
          <div className="meal-modal__hero-text">
            <div className="tag-list">{meal.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
            <h2>{meal.name}</h2>
            <p>{meal.subtitle}</p>
          </div>
        </div>
        <div className="meal-modal__content">
          <div className="nutrition-strip">
            <Metric label="Năng lượng" value={`${meal.calories}`} unit="kcal" />
            <Metric label="Protein" value={`${meal.protein}`} unit="g" />
            <Metric label="Carbs" value={`${meal.carbs}`} unit="g" />
            <Metric label="Chất béo" value={`${meal.fat}`} unit="g" />
          </div>
          {subscribed ? (
            recipeLoading ? (
              <div className="recipe-loading">
                <LoaderCircle className="spin" size={22} /> Đang tải công thức…
              </div>
            ) : recipeError ? (
              <div className="login-error">
                <AlertCircle size={17} /><span>{recipeError}</span>
              </div>
            ) : recipe ? (
              <div className="recipe-grid">
                <div>
                  <span className="section-kicker">NGUYÊN LIỆU · 1 KHẨU PHẦN</span>
                  <ul className="check-list">
                    {recipe.ingredients.map((item) => (
                      <li key={item}><Check size={15} /> {item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="section-kicker">
                    CÁCH LÀM · {(recipe.prep_time_minutes ?? meal.prepTime) + (recipe.cook_time_minutes ?? 0)} PHÚT
                  </span>
                  <ol className="step-list">
                    {recipe.instructions.map((item, index) => (
                      <li key={`${index}-${item}`}><span>{index + 1}</span><p>{item}</p></li>
                    ))}
                  </ol>
                  {recipe.cooking_tips ? <p className="recipe-note"><strong>Mẹo:</strong> {recipe.cooking_tips}</p> : null}
                </div>
              </div>
            ) : null
          ) : (
            <div className="inline-paywall">
              <LockKeyhole size={26} />
              <div><h3>Recipe chi tiết dành cho Plus</h3><p>Mở khóa định lượng nguyên liệu, cách làm và lưu vào kế hoạch.</p></div>
              <button className="button button--dark" onClick={onSubscribe}>Dùng thử miễn phí</button>
            </div>
          )}
          <div className="modal-actions">
            <button className="button button--outline" onClick={onClose}>Đóng</button>
            {subscribed && eaten ? (
              <span className="eaten-tag">
                <Check size={15} /> Bữa ăn đã được ghi nhận
              </span>
            ) : subscribed ? (
              <button
                className="button button--dark"
                disabled={saving}
                onClick={() => void addMeal()}
              >
                {saving ? (
                  <LoaderCircle className="spin" size={17} />
                ) : (
                  <Check size={17} />
                )}
                {saving ? "Đang ghi…" : "Ghi đã ăn"}
              </button>
            ) : null}
          </div>
          {error ? (
            <div className="login-error">
              <AlertCircle size={17} /><span>{error}</span>
            </div>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
