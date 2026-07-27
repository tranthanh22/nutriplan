"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { AllergenOption, OnboardingData } from "@/types/onboarding";
import { NavButtons } from "../components/nav-buttons";
import { ProgressBar } from "../components/progress-bar";
import { SplitLayout } from "../components/split-layout";

interface Step7DislikedProps {
  data: Pick<OnboardingData, "dislikedIngredients">;
  onChange: (patch: Partial<OnboardingData>) => void;
  onBack: () => void;
  onFinish: () => Promise<void>;
  fetchAllergens: () => Promise<AllergenOption[]>;
  loading: boolean;
}

export function Step7Disliked({
  data,
  onChange,
  onBack,
  onFinish,
  fetchAllergens,
  loading,
}: Step7DislikedProps) {
  const [allergens, setAllergens] = useState<AllergenOption[]>([]);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    setFetching(true);
    fetchAllergens()
      .then(setAllergens)
      .catch((err) =>
        setFetchError(err instanceof Error ? err.message : "Khổng tải được danh mục dị ứng."),
      )
      .finally(() => setFetching(false));
  }, [fetchAllergens]);

  const toggle = (code: string) => {
    const current = data.dislikedIngredients;
    const next = current.includes(code)
      ? current.filter((v) => v !== code)
      : [...current, code];
    onChange({ dislikedIngredients: next });
  };

  return (
    <div className="ob-full-page">
      <SplitLayout imageSrc="/assets/allergen.jpg" imageAlt="Thực phẩm né tránh & dị ứng">
        <div className="ob-form-content">
          <ProgressBar currentStep={5} totalSteps={5} />

          <h2 className="ob-step-title">Có thực phẩm nào bạn muốn tránh?</h2>
          <p className="ob-step-sub">
            Chọn các dị ứng hoặc nguyên liệu bạn muốn loại trừ khỏi thực đơn. Có thể bỏ qua nếu không có.
          </p>

          {fetching && (
            <div className="ob-loading-row">
              <Loader2 size={18} className="ob-spin" />
              <span>Đang tải danh sách dị ứng…</span>
            </div>
          )}

          {fetchError && <p className="ob-error">{fetchError}</p>}

          {!fetching && allergens.length > 0 && (
            <div className="ob-pill-grid">
              {allergens.map((a) => {
                const selected = data.dislikedIngredients.includes(a.code);
                return (
                  <button
                    key={a.id}
                    type="button"
                    id={`ob-allergen-${a.code}`}
                    className={`ob-pill ob-pill--allergen${selected ? " ob-pill--selected" : ""}`}
                    onClick={() => toggle(a.code)}
                    title={a.description ?? a.name}
                  >
                    {a.name}
                  </button>
                );
              })}
            </div>
          )}

          <NavButtons
            onBack={onBack}
            onContinue={onFinish}
            continueLabel="Hoàn tất & Lưu hồ sơ"
            loading={loading}
          />
        </div>
      </SplitLayout>
    </div>
  );
}
