"use client";

interface ProgressBarProps {
  currentStep: number; // 1-based, steps 3-7 are shown (indices 0-4)
  totalSteps: number;
}

const STEP_LABELS = [
  "Thông tin cá nhân",
  "Mục tiêu sức khỏe",
  "Chế độ ăn",
  "Món ăn ưa thích",
  "Thực phẩm né tránh",
];

export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  return (
    <div className="ob-progress">
      <div className="ob-progress__dots">
        {Array.from({ length: totalSteps }, (_, i) => {
          const status =
            i + 1 < currentStep ? "done" : i + 1 === currentStep ? "active" : "idle";
          return (
            <div key={i} className={`ob-step-dot ob-step-dot--${status}`}>
              {status === "done" ? (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M2 5l2 2 4-4"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <span>{i + 1}</span>
              )}
            </div>
          );
        })}
      </div>
      <p className="ob-progress__label">
        {STEP_LABELS[currentStep - 1]} &mdash; Bước {currentStep} / {totalSteps}
      </p>
      <div className="ob-progress__track">
        <div
          className="ob-progress__fill"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        />
      </div>
    </div>
  );
}
