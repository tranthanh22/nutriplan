"use client";

import { useState } from "react";
import type { ActivityLevel, Gender, OnboardingData } from "@/types/onboarding";
import { NavButtons } from "../components/nav-buttons";
import { ProgressBar } from "../components/progress-bar";
import { SplitLayout } from "../components/split-layout";

interface Step3DemographicsProps {
  data: Pick<OnboardingData, "heightCm" | "weightKg" | "gender" | "activityLevel" | "birthDate">;
  onChange: (patch: Partial<OnboardingData>) => void;
  onBack: () => void;
  onNext: () => void;
}

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; desc: string }[] = [
  { value: "sedentary", label: "Ít vận động", desc: "Làm việc văn phòng, ít hoặc không tập thể dục" },
  { value: "light", label: "Vận động nhẹ", desc: "Tập thể dục nhẹ nhàng 1–3 buổi/tuần" },
  { value: "moderate", label: "Vận động vừa", desc: "Tập thể dục vừa sức 3–5 buổi/tuần" },
  { value: "active", label: "Vận động nhiều", desc: "Tập luyện cường độ cao 6–7 buổi/tuần" },
  { value: "very_active", label: "Vận động rất nhiều", desc: "Lao động thể lực nặng hoặc tập 2 lần/ngày" },
];

export function Step3Demographics({ data, onChange, onBack, onNext }: Step3DemographicsProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!data.birthDate) e.birthDate = "Vui lòng chọn ngày sinh.";
    if (!data.heightCm || data.heightCm < 80 || data.heightCm > 250)
      e.heightCm = "Chiều cao phải từ 80 đến 250 cm.";
    if (!data.weightKg || data.weightKg < 20 || data.weightKg > 400)
      e.weightKg = "Cân nặng phải từ 20 đến 400 kg.";
    if (!data.gender) e.gender = "Vui lòng chọn giới tính.";
    if (!data.activityLevel) e.activityLevel = "Vui lòng chọn mức độ vận động.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validate()) onNext();
  };

  return (
    <div className="ob-full-page">
      <SplitLayout imageSrc="/assets/about_you.jpg" imageAlt="Hình minh họa thông tin cá nhân">
        <div className="ob-form-content">
          <ProgressBar currentStep={1} totalSteps={5} />

          <h2 className="ob-step-title">Cho chúng tôi biết về bạn</h2>
          <p className="ob-step-sub">
            Thông tin này giúp tính toán chính xác Nhu cầu Calo & Macro (Protein, Carbs, Fat) hàng ngày của bạn.
          </p>

          {/* Date of birth */}
          <div className="ob-field">
            <label htmlFor="ob-dob" className="ob-label">Ngày sinh</label>
            <input
              id="ob-dob"
              type="date"
              className={`ob-input${errors.birthDate ? " ob-input--error" : ""}`}
              value={data.birthDate}
              onChange={(e) => onChange({ birthDate: e.target.value })}
              max={new Date().toISOString().split("T")[0]}
            />
            {errors.birthDate && <p className="ob-field-error">{errors.birthDate}</p>}
          </div>

          {/* Height & Weight */}
          <div className="ob-row-2col">
            <div className="ob-field">
              <label htmlFor="ob-height" className="ob-label">Chiều cao (cm)</label>
              <input
                id="ob-height"
                type="number"
                className={`ob-input${errors.heightCm ? " ob-input--error" : ""}`}
                placeholder="Ví dụ: 170"
                min={80}
                max={250}
                value={data.heightCm || ""}
                onChange={(e) => onChange({ heightCm: Number(e.target.value) })}
              />
              {errors.heightCm && <p className="ob-field-error">{errors.heightCm}</p>}
            </div>
            <div className="ob-field">
              <label htmlFor="ob-weight" className="ob-label">Cân nặng (kg)</label>
              <input
                id="ob-weight"
                type="number"
                className={`ob-input${errors.weightKg ? " ob-input--error" : ""}`}
                placeholder="Ví dụ: 65"
                min={20}
                max={400}
                step={0.1}
                value={data.weightKg || ""}
                onChange={(e) => onChange({ weightKg: Number(e.target.value) })}
              />
              {errors.weightKg && <p className="ob-field-error">{errors.weightKg}</p>}
            </div>
          </div>

          {/* Sex */}
          <div className="ob-field">
            <p className="ob-label">Giới tính</p>
            {errors.gender && <p className="ob-field-error">{errors.gender}</p>}
            <div className="ob-radio-group">
              {(["male", "female"] as Gender[]).map((g) => (
                <label
                  key={g}
                  htmlFor={`ob-gender-${g}`}
                  className={`ob-radio-card${data.gender === g ? " ob-radio-card--selected" : ""}`}
                >
                  <input
                    id={`ob-gender-${g}`}
                    type="radio"
                    name="ob-gender"
                    value={g}
                    checked={data.gender === g}
                    onChange={() => onChange({ gender: g })}
                    className="ob-sr-only"
                  />
                  <span>{g === "male" ? "♂ Nam" : "♀ Nữ"}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Activity level */}
          <div className="ob-field">
            <label htmlFor="ob-activity" className="ob-label">Mức độ vận động</label>
            {errors.activityLevel && <p className="ob-field-error">{errors.activityLevel}</p>}
            <select
              id="ob-activity"
              className={`ob-input${errors.activityLevel ? " ob-input--error" : ""}`}
              value={data.activityLevel}
              onChange={(e) => onChange({ activityLevel: e.target.value as ActivityLevel })}
            >
              <option value="">Chọn mức độ vận động…</option>
              {ACTIVITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} — {opt.desc}
                </option>
              ))}
            </select>
          </div>

          <NavButtons onBack={onBack} onContinue={handleNext} />
        </div>
      </SplitLayout>
    </div>
  );
}
