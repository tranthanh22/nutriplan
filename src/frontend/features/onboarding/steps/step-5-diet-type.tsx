"use client";

import type { OnboardingData } from "@/types/onboarding";
import { NavButtons } from "../components/nav-buttons";
import { ProgressBar } from "../components/progress-bar";
import { SplitLayout } from "../components/split-layout";

interface Step5DietTypeProps {
  data: Pick<OnboardingData, "dietaryPreferences">;
  onChange: (patch: Partial<OnboardingData>) => void;
  onBack: () => void;
  onNext: () => void;
}

const DIET_OPTIONS: {
  value: string;
  emoji: string;
  title: string;
  desc: string;
}[] = [
  { value: "standard", emoji: "🍽️", title: "Tiêu chuẩn", desc: "Không có hạn chế đặc biệt" },
  { value: "vegetarian", emoji: "🥦", title: "Ăn chay thanh đạm", desc: "Không ăn thịt, có thể ăn trứng & sữa" },
  { value: "vegan", emoji: "🌱", title: "Ăn chay thuần (Vegan)", desc: "Không dùng sản phẩm từ động vật" },
  { value: "keto", emoji: "🥑", title: "Keto / Low-Carb", desc: "Ít tinh bột, giàu chất béo tốt" },
  { value: "paleo", emoji: "🍖", title: "Paleo", desc: "Thực phẩm tự nhiên, không chế biến sẵn" },
  { value: "gluten_free", emoji: "🌾", title: "Không Gluten", desc: "Né tránh lúa mì & ngũ cốc có gluten" },
];

export function Step5DietType({ data, onChange, onBack, onNext }: Step5DietTypeProps) {
  const toggle = (value: string) => {
    const current = data.dietaryPreferences;
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ dietaryPreferences: next });
  };

  return (
    <div className="ob-full-page">
      <SplitLayout imageSrc="/assets/diet_type.jpg" imageAlt="Chế độ ăn ưa thích">
        <div className="ob-form-content">
          <ProgressBar currentStep={3} totalSteps={5} />

          <h2 className="ob-step-title">Chế độ ăn ưa thích của bạn?</h2>
          <p className="ob-step-sub">
            Chọn các chế độ ăn bạn áp dụng. Điều này giúp hệ thống gợi ý thực đơn phù hợp nhất.
          </p>

          <div className="ob-chip-grid">
            {DIET_OPTIONS.map((opt) => {
              const selected = data.dietaryPreferences.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  id={`ob-diet-${opt.value}`}
                  className={`ob-chip-card${selected ? " ob-chip-card--selected" : ""}`}
                  onClick={() => toggle(opt.value)}
                >
                  <span className="ob-chip-card__emoji">{opt.emoji}</span>
                  <strong className="ob-chip-card__title">{opt.title}</strong>
                  <small className="ob-chip-card__desc">{opt.desc}</small>
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
