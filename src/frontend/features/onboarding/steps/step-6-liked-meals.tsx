"use client";

import type { OnboardingData } from "@/types/onboarding";
import { NavButtons } from "../components/nav-buttons";
import { ProgressBar } from "../components/progress-bar";
import { SplitLayout } from "../components/split-layout";

interface Step6LikedMealsProps {
  data: Pick<OnboardingData, "likedMealTypes">;
  onChange: (patch: Partial<OnboardingData>) => void;
  onBack: () => void;
  onNext: () => void;
}

const MEAL_TYPES: { value: string; emoji: string; label: string }[] = [
  { value: "breakfast", emoji: "🌅", label: "Món ăn sáng" },
  { value: "lunch", emoji: "🥗", label: "Món ăn trưa" },
  { value: "dinner", emoji: "🍜", label: "Món ăn tối" },
  { value: "snack", emoji: "🥨", label: "Món ăn nhẹ" },
  { value: "soup", emoji: "🍲", label: "Canh & Lẩu" },
  { value: "salad", emoji: "🥙", label: "Salad & Gỏi" },
  { value: "grill", emoji: "🥩", label: "Món nướng & Rán" },
  { value: "seafood", emoji: "🐟", label: "Hải sản" },
  { value: "vegetable", emoji: "🥦", label: "Món rau củ" },
  { value: "rice_noodle", emoji: "🍚", label: "Cơm & Bún / Phở" },
  { value: "smoothie", emoji: "🥤", label: "Sinh tố & Nước ép" },
  { value: "dessert", emoji: "🍓", label: "Tráng miệng lành mạnh" },
];

export function Step6LikedMeals({ data, onChange, onBack, onNext }: Step6LikedMealsProps) {
  const toggle = (value: string) => {
    const current = data.likedMealTypes;
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ likedMealTypes: next });
  };

  return (
    <div className="ob-full-page">
      <SplitLayout imageSrc="/assets/favorite.png" imageAlt="Món ăn ưa thích">
        <div className="ob-form-content">
          <ProgressBar currentStep={4} totalSteps={5} />

          <h2 className="ob-step-title">Bạn thích những món ăn nào?</h2>
          <p className="ob-step-sub">
            Chọn các loại món ưa thích. Hệ thống sẽ ưu tiên các món này khi xây dựng thực đơn của bạn.
          </p>

          <div className="ob-pill-grid">
            {MEAL_TYPES.map((m) => {
              const selected = data.likedMealTypes.includes(m.value);
              return (
                <button
                  key={m.value}
                  type="button"
                  id={`ob-liked-${m.value}`}
                  className={`ob-pill${selected ? " ob-pill--selected" : ""}`}
                  onClick={() => toggle(m.value)}
                >
                  {m.emoji} {m.label}
                </button>
              );
            })}
          </div>

          <NavButtons onBack={onBack} onContinue={onNext} />
        </div>
      </SplitLayout>
    </div>
  );
}
