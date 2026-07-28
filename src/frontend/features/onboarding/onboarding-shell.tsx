"use client";

import { useCallback, useState } from "react";
import { CheckCircle2, Leaf } from "lucide-react";
import type { OnboardingData } from "@/types/onboarding";
import * as OnboardingService from "./onboarding.service";
import { Step1Auth } from "./steps/step-1-auth";
import { Step2EmailSent } from "./steps/step-2-email-sent";
import { Step3Demographics } from "./steps/step-3-demographics";
import { Step4Goals } from "./steps/step-4-goals";
import { Step5DietType } from "./steps/step-5-diet-type";
import { Step6LikedMeals } from "./steps/step-6-liked-meals";
import { Step7Disliked } from "./steps/step-7-disliked";

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | "done";

const EMPTY_DATA: OnboardingData = {
  email: "",
  password: "",
  heightCm: 0,
  weightKg: 0,
  gender: "male",
  activityLevel: "sedentary",
  birthDate: "",
  goal: "maintain",
  dietaryPreferences: [],
  likedMealTypes: [],
  dislikedIngredients: [],
};

interface OnboardingShellProps {
  initialAccessToken?: string | null;
  initialStep?: Step;
  onComplete: () => void;
}

export function OnboardingShell({ initialAccessToken, initialStep, onComplete }: OnboardingShellProps) {
  const [step, setStep] = useState<Step>(initialStep ?? (initialAccessToken ? 3 : 1));
  const [data, setData] = useState<OnboardingData>(EMPTY_DATA);
  const [accessToken, setAccessToken] = useState<string | null>(initialAccessToken ?? null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const patch = useCallback(
    (updates: Partial<OnboardingData>) =>
      setData((prev) => ({ ...prev, ...updates })),
    [],
  );

  // ── Step 1 ────────────────────────────────────────────────
  const handleSignUp = async (email: string, password: string) => {
    await OnboardingService.signUp(email, password);
    patch({ email, password });
  };

  const handleLogin = async (email: string, password: string) => {
    await OnboardingService.login(email, password);
    onComplete();
  };

  // ── Step 7 – final save ───────────────────────────────────
  const handleFinish = async () => {
    const activeToken = accessToken || (typeof window !== "undefined" ? window.localStorage.getItem("nutriplan_access_token") : null);
    if (!activeToken) {
      setSaveError("Phiên làm việc hết hạn. Vui lòng nhấn vào liên kết xác nhận trong email của bạn lần nữa.");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      await OnboardingService.saveNutritionProfile(activeToken, {
        heightCm: data.heightCm,
        weightKg: data.weightKg,
        gender: data.gender,
        activityLevel: data.activityLevel,
        birthDate: data.birthDate,
        goal: data.goal,
        dietaryPreferences: data.dietaryPreferences,
        dislikedIngredients: data.dislikedIngredients,
      });
      setStep("done");
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Khổng lưu được hồ sơ dinh dưỡng.");
    } finally {
      setSaving(false);
    }
  };

  // ── Completion screen ─────────────────────────────────────
  if (step === "done") {
    return (
      <div className="ob-done-page">
        <div className="ob-done-card">
          <div className="ob-done-icon">
            <CheckCircle2 size={48} />
          </div>
          <h1 className="ob-done-title">Bạn đã sẵn sàng! 🎉</h1>
          <p className="ob-done-sub">
            Hồ sơ dinh dưỡng cá nhân của bạn đã được khởi tạo thành công. Hãy bắt đầu khám phá thực đơn được thiết kế dành riêng cho bạn.
          </p>
          <button className="ob-btn-primary" onClick={onComplete} type="button">
            Vào Bảng Điều Khiển →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ob-shell">
      {/* Brand watermark shown on steps 1-2 only */}
      {(step === 1 || step === 2) && (
        <div className="ob-shell__brand-mark">
          <Leaf size={14} />
          NutriPlan
        </div>
      )}

      {step === 1 && (
        <Step1Auth
          onSignUp={handleSignUp}
          onLogin={handleLogin}
          onSuccess={(email) => {
            patch({ email });
            setStep(2); // Show "email sent" screen – user must confirm before onboarding
          }}
        />
      )}

      {step === 2 && (
        <Step2EmailSent
          email={data.email}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && (
        <Step3Demographics
          data={data}
          onChange={patch}
          onBack={undefined as unknown as () => void} // No back button on first profile setup step
          onNext={() => setStep(4)}
        />
      )}

      {step === 4 && (
        <Step4Goals
          data={data}
          onChange={patch}
          onBack={() => setStep(3)}
          onNext={() => setStep(5)}
        />
      )}

      {step === 5 && (
        <Step5DietType
          data={data}
          onChange={patch}
          onBack={() => setStep(4)}
          onNext={() => setStep(6)}
        />
      )}

      {step === 6 && (
        <Step6LikedMeals
          data={data}
          onChange={patch}
          onBack={() => setStep(5)}
          onNext={() => setStep(7)}
        />
      )}

      {step === 7 && (
        <>
          <Step7Disliked
            data={data}
            onChange={patch}
            onBack={() => setStep(6)}
            onFinish={handleFinish}
            fetchAllergens={OnboardingService.fetchAllergens}
            loading={saving}
          />
          {saveError && (
            <div className="ob-save-error">
              <span>⚠️ {saveError}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
