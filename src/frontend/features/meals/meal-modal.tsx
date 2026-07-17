import Image from "next/image";
import { Check, LockKeyhole, X } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Metric } from "@/components/ui/nutrition-widgets";
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
  onAdd: () => void;
}) {
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
            <div className="recipe-grid">
              <div>
                <span className="section-kicker">NGUYÊN LIỆU · 1 KHẨU PHẦN</span>
                <ul className="check-list">{meal.ingredients.map((item) => <li key={item}><Check size={15} /> {item}</li>)}</ul>
              </div>
              <div>
                <span className="section-kicker">CÁCH LÀM · {meal.prepTime} PHÚT</span>
                <ol className="step-list">{meal.instructions.map((item, index) => <li key={item}><span>{index + 1}</span><p>{item}</p></li>)}</ol>
              </div>
            </div>
          ) : (
            <div className="inline-paywall">
              <LockKeyhole size={26} />
              <div><h3>Recipe chi tiết dành cho Plus</h3><p>Mở khóa định lượng nguyên liệu, cách làm và lưu vào kế hoạch.</p></div>
              <button className="button button--dark" onClick={onSubscribe}>Dùng thử miễn phí</button>
            </div>
          )}
          <div className="modal-actions">
            <button className="button button--outline" onClick={onClose}>Đóng</button>
            {subscribed && <button className="button button--dark" onClick={onAdd}><Check size={17} /> Ghi đã ăn</button>}
          </div>
        </div>
      </div>
    </Modal>
  );
}

