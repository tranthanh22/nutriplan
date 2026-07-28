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
      <p className="ob-progress__label">
        {STEP_LABELS[currentStep - 1]}
      </p>
      
      <div className="ob-stepper">
        {Array.from({ length: totalSteps }, (_, i) => {
          const stepNum = i + 1;
          const status =
            stepNum < currentStep ? "done" : stepNum === currentStep ? "active" : "idle";
          const formattedNum = stepNum < 10 ? `0${stepNum}` : `${stepNum}`;
          
          return (
            <div key={i} className="ob-stepper__item">
              {i > 0 && (
                <div
                  className={`ob-stepper__line ${
                    stepNum <= currentStep ? "ob-stepper__line--filled" : ""
                  }`}
                />
              )}
              <div className={`ob-stepper__circle ob-stepper__circle--${status}`}>
                <span>{formattedNum}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
