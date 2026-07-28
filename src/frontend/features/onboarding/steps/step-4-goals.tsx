"use client";

import type { NutritionGoal, OnboardingData } from "@/types/onboarding";
import { NavButtons } from "../components/nav-buttons";
import { ProgressBar } from "../components/progress-bar";
import { SplitLayout } from "../components/split-layout";

interface Step4GoalsProps {
  data: Pick<OnboardingData, "goal">;
  onChange: (patch: Partial<OnboardingData>) => void;
  onBack: () => void;
  onNext: () => void;
}

const GOAL_OPTIONS: {
  value: NutritionGoal;
  emoji: string;
  title: string;
  desc: string;
}[] = [
    {
      value: "lose_weight",
      emoji: "🔥",
      title: "Giảm cân & Giảm mỡ",
      desc: "Giảm mỡ thừa an toàn với lượng thâm hụt calo chuẩn khoa học",
    },
    {
      value: "maintain",
      emoji: "⚖️",
      title: "Duy trì vóc dáng",
      desc: "Giữ cân nặng ổn định và nâng cao sức khỏe toàn diện",
    },
    {
      value: "gain_muscle",
      emoji: "💪",
      title: "Tăng cơ & Tăng cân",
      desc: "Phát triển khối lượng cơ bắp với thặng dư calo lành mạnh",
    },
  ];

export function Step4Goals({ data, onChange, onBack, onNext }: Step4GoalsProps) {
  return (
    <div className="ob-full-page">
      <SplitLayout imageSrc="/assets/goals.png" imageAlt="Mục tiêu dinh dưỡng">
        <div className="ob-form-content">
          <ProgressBar currentStep={2} totalSteps={5} />

          <h2 className="ob-step-title">Mục tiêu chính của bạn là gì?</h2>
          <p className="ob-step-sub">
            Chọn mục tiêu phù hợp nhất với mong muốn thay đổi vóc dáng của bạn.
          </p>

          <div className="ob-choice-list">
            {GOAL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                id={`ob-goal-${opt.value}`}
                className={`ob-choice-card ob-choice-card--wide${data.goal === opt.value ? " ob-choice-card--selected" : ""
                  }`}
                onClick={() => onChange({ goal: opt.value })}
              >
                <span className="ob-choice-card__emoji">{opt.emoji}</span>
                <span className="ob-choice-card__text">
                  <strong>{opt.title}</strong>
                  <small>{opt.desc}</small>
                </span>
                {data.goal === opt.value && (
                  <span className="ob-choice-card__check">✓</span>
                )}
              </button>
            ))}
          </div>

          <NavButtons onBack={onBack} onContinue={onNext} disabled={!data.goal} />
        </div>
      </SplitLayout>
    </div>
  );
}
