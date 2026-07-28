"use client";

import { useEffect, useState } from "react";
import type { OnboardingData } from "@/types/onboarding";
import { fetchIngredients } from "../onboarding.service";
import { NavButtons } from "../components/nav-buttons";
import { ProgressBar } from "../components/progress-bar";
import { SplitLayout } from "../components/split-layout";

interface Step6LikedMealsProps {
  data: Pick<OnboardingData, "likedMealTypes">;
  onChange: (patch: Partial<OnboardingData>) => void;
  onBack: () => void;
  onNext: () => void;
}

interface IngredientItem {
  value: string;
  label: string;
}

const DEFAULT_INGREDIENTS: IngredientItem[] = [
  { value: "uc_ga", label: "Ức gà" },
  { value: "thit_bo", label: "Thịt bò" },
  { value: "tom_tuoi", label: "Tôm tươi" },
  { value: "ca_hoi", label: "Cá hồi" },
  { value: "trung_ga", label: "Trứng gà" },
  { value: "dau_phu", label: "Đậu phụ" },
  { value: "gao_lut", label: "Gạo lứt" },
  { value: "yen_mach", label: "Yến mạch" },
  { value: "khoai_lang", label: "Khoai lang" },
  { value: "bong_cai_xanh", label: "Bông cải xanh" },
  { value: "rau_bina", label: "Rau bina" },
  { value: "bo_qua", label: "Bơ quả" },
];

export function Step6LikedMeals({ data, onChange, onBack, onNext }: Step6LikedMealsProps) {
  const [ingredients, setIngredients] = useState<IngredientItem[]>(DEFAULT_INGREDIENTS);

  useEffect(() => {
    fetchIngredients()
      .then((items) => {
        if (Array.isArray(items) && items.length > 0) {
          setIngredients(
            items.map((i) => ({
              value: i.name,
              label: i.name,
            }))
          );
        }
      })
      .catch(() => {
        // Fallback to defaults
      });
  }, []);

  const toggle = (value: string) => {
    const current = data.likedMealTypes;
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ likedMealTypes: next });
  };

  return (
    <div className="ob-full-page">
      <SplitLayout imageSrc="/assets/favorite.png" imageAlt="Thực phẩm & Nguyên liệu ưa thích">
        <div className="ob-form-content">
          <ProgressBar currentStep={4} totalSteps={5} />

          <h2 className="ob-step-title">Bạn ưa thích những thực phẩm nào?</h2>
          <p className="ob-step-sub">
            Chọn các nguyên liệu & thực phẩm bạn yêu thích. Hệ thống sẽ ưu tiên các món có nguyên liệu này khi xây dựng thực đơn.
          </p>

          <div className="ob-pill-grid">
            {ingredients.map((item) => {
              const selected = data.likedMealTypes.includes(item.value);
              return (
                <button
                  key={item.value}
                  type="button"
                  id={`ob-liked-${item.value}`}
                  className={`ob-pill${selected ? " ob-pill--selected" : ""}`}
                  onClick={() => toggle(item.value)}
                >
                  {item.label}
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
