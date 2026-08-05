"use client";

import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  HeartPulse,
  LoaderCircle,
  ShieldCheck,
  Target,
  Utensils
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { NumberInput } from "@/components/ui/number-input";
import {
  profileToInput,
  type NutritionProfile,
  type NutritionProfileInput
} from "./onboarding-api";

const DIET_OPTIONS = [
  "Ăn cân bằng",
  "Ăn chay",
  "Thuần chay",
  "Ít tinh bột",
  "Giàu protein",
  "Không gluten",
  "Không sữa"
];

function listToText(values: string[]) {
  return values.join(", ");
}

function textToList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 30);
}

export function HealthOnboardingModal({
  current,
  currentName,
  required,
  onClose,
  onSave
}: {
  current: NutritionProfile | null;
  currentName: string;
  required: boolean;
  onClose: () => void;
  onSave: (input: NutritionProfileInput, fullName: string) => Promise<void>;
}) {
  const initial = useMemo(() => profileToInput(current), [current]);
  const [fullName, setFullName] = useState(
    currentName === "Bạn" ? "" : currentName
  );
  const [form, setForm] = useState(initial);
  const [step, setStep] = useState(0);
  const [avoidFoods, setAvoidFoods] = useState(listToText(initial.dislikedIngredients));
  const [allergies, setAllergies] = useState(listToText(initial.foodAllergies));
  const [intolerances, setIntolerances] = useState(listToText(initial.foodIntolerances));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const update = <K extends keyof NutritionProfileInput>(
    key: K,
    value: NutritionProfileInput[K]
  ) => setForm((currentForm) => ({ ...currentForm, [key]: value }));

  function updateWeight(weightKg: number) {
    setForm((currentForm) => {
      const currentDelta = currentForm.targetWeightKg - currentForm.weightKg;
      return {
        ...currentForm,
        weightKg,
        targetWeightKg:
          currentForm.goal === "maintain"
            ? weightKg
            : Math.round((weightKg + currentDelta) * 10) / 10
      };
    });
  }

  function updateGoal(goal: NutritionProfileInput["goal"]) {
    setForm((currentForm) => ({
      ...currentForm,
      goal,
      targetWeightKg:
        goal === "lose_weight"
          ? Math.max(20, currentForm.weightKg - 5)
          : goal === "gain_muscle"
            ? Math.min(400, currentForm.weightKg + 5)
            : currentForm.weightKg
    }));
  }

  function toggleDiet(value: string) {
    update(
      "dietaryPreferences",
      form.dietaryPreferences.includes(value)
        ? form.dietaryPreferences.filter((item) => item !== value)
        : [...form.dietaryPreferences, value]
    );
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (step < 2) {
      setStep((currentStep) => currentStep + 1);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave(
        {
          ...form,
          dislikedIngredients: textToList(avoidFoods),
          foodAllergies: textToList(allergies),
          foodIntolerances: textToList(intolerances),
          medicalNotes: form.medicalNotes?.trim() || undefined
        },
        fullName.trim()
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Không thể lưu hồ sơ sức khỏe."
      );
      setSaving(false);
    }
  }

  return (
    <Modal onClose={required ? () => undefined : onClose} wide>
      <form className="onboarding-modal" onSubmit={(event) => void submit(event)}>
        <header className="onboarding-header">
          <div className="onboarding-brand"><HeartPulse size={20} /> NutriPlan Health Profile</div>
          <span>Bước {step + 1}/3</span>
          <div className="onboarding-progress">
            <span style={{ width: `${((step + 1) / 3) * 100}%` }} />
          </div>
        </header>

        <div className="onboarding-body">
          {step === 0 && (
            <>
              <div className="onboarding-title">
                <span><Activity size={22} /></span>
                <div>
                  <h2>Chỉ số cơ thể hiện tại</h2>
                  <p>NutriPlan dùng các chỉ số này để tính BMR, TDEE và nhu cầu dinh dưỡng.</p>
                </div>
              </div>
              <div className="onboarding-fields">
                <label className="onboarding-field--full">
                  Họ và tên của bạn
                  <input
                    autoComplete="name"
                    maxLength={100}
                    minLength={2}
                    placeholder="Ví dụ: Nguyễn Văn An"
                    required
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                  />
                </label>
                <label>
                  Giới tính sinh học
                  <select
                    value={form.gender}
                    onChange={(event) => update("gender", event.target.value as NutritionProfileInput["gender"])}
                  >
                    <option value="female">Nữ</option>
                    <option value="male">Nam</option>
                  </select>
                </label>
                <label>
                  Ngày sinh
                  <input
                    type="date"
                    required
                    max={new Date().toISOString().slice(0, 10)}
                    value={form.birthDate}
                    onChange={(event) => update("birthDate", event.target.value)}
                  />
                </label>
                <label>
                  Chiều cao (cm)
                  <NumberInput
                    min={80}
                    max={250}
                    required
                    value={form.heightCm}
                    onValueChange={(value) => {
                      if (value !== undefined) update("heightCm", value);
                    }}
                  />
                </label>
                <label>
                  Cân nặng (kg)
                  <NumberInput
                    min={20}
                    max={400}
                    step="0.1"
                    required
                    value={form.weightKg}
                    onValueChange={(value) => {
                      if (value !== undefined) updateWeight(value);
                    }}
                  />
                </label>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="onboarding-title">
                <span><Target size={22} /></span>
                <div>
                  <h2>Vận động và mục tiêu</h2>
                  <p>Chọn mức gần nhất với 7 ngày vừa qua, không phải mức bạn mong muốn đạt được.</p>
                </div>
              </div>
              <div className="onboarding-fields onboarding-fields--single">
                <label>
                  Tần suất vận động mỗi tuần
                  <select
                    value={form.activityDaysPerWeek}
                    onChange={(event) => update("activityDaysPerWeek", Number(event.target.value))}
                  >
                    {Array.from({ length: 8 }, (_, days) => (
                      <option key={days} value={days}>{days} ngày/tuần</option>
                    ))}
                  </select>
                </label>
                <label>
                  Mức độ hoạt động
                  <select
                    value={form.activityLevel}
                    onChange={(event) => update("activityLevel", event.target.value as NutritionProfileInput["activityLevel"])}
                  >
                    <option value="sedentary">Ít vận động, chủ yếu ngồi</option>
                    <option value="light">Nhẹ, đi bộ hoặc tập 1–3 buổi/tuần</option>
                    <option value="moderate">Vừa, tập 3–5 buổi/tuần</option>
                    <option value="active">Cao, tập 6–7 buổi/tuần</option>
                    <option value="very_active">Rất cao, lao động hoặc tập nặng</option>
                  </select>
                </label>
                <label>
                  Mục tiêu chính
                  <select
                    value={form.goal}
                    onChange={(event) => updateGoal(event.target.value as NutritionProfileInput["goal"])}
                  >
                    <option value="lose_weight">Giảm cân, ưu tiên giảm mỡ và giữ cơ</option>
                    <option value="maintain">Duy trì cân nặng và cải thiện thể lực</option>
                    <option value="gain_muscle">Tăng cân, ưu tiên tăng cơ nạc</option>
                  </select>
                </label>
                <div className="goal-target-card">
                  <div className="goal-target-card__fields">
                    <label>
                      Cân nặng muốn đạt (kg)
                      <NumberInput
                        min={form.goal === "gain_muscle" ? form.weightKg + 0.1 : 20}
                        max={form.goal === "lose_weight" ? form.weightKg - 0.1 : 400}
                        step="0.1"
                        required
                        disabled={form.goal === "maintain"}
                        value={form.targetWeightKg}
                        onValueChange={(value) => {
                          if (value !== undefined) update("targetWeightKg", value);
                        }}
                      />
                    </label>
                    <label>
                      Thời gian dự kiến
                      <select
                        value={form.goalDurationWeeks}
                        onChange={(event) => update("goalDurationWeeks", Number(event.target.value))}
                      >
                        <option value={4}>4 tuần</option>
                        <option value={8}>8 tuần</option>
                        <option value={12}>12 tuần</option>
                        <option value={16}>16 tuần</option>
                        <option value={24}>24 tuần</option>
                        <option value={36}>36 tuần</option>
                        <option value={52}>1 năm</option>
                      </select>
                    </label>
                  </div>
                  <div className="goal-target-card__summary">
                    <Target size={18} />
                    <span>
                      Từ <strong>{form.weightKg} kg</strong> đến{" "}
                      <strong>{form.targetWeightKg} kg</strong>
                      {form.goal === "maintain"
                        ? " — duy trì ổn định."
                        : ` — ${Math.abs(form.targetWeightKg - form.weightKg).toFixed(1)} kg trong ${form.goalDurationWeeks} tuần.`}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="onboarding-title">
                <span><Utensils size={22} /></span>
                <div>
                  <h2>Sở thích và thực phẩm cần tránh</h2>
                  <p>Thông tin dị ứng chỉ giúp lọc gợi ý; hãy luôn kiểm tra nguyên liệu thực tế.</p>
                </div>
              </div>
              <fieldset className="preference-fieldset">
                <legend>Chế độ ăn bạn ưu tiên</legend>
                <div className="preference-options">
                  {DIET_OPTIONS.map((option) => {
                    const selected = form.dietaryPreferences.includes(option);
                    return (
                      <button
                        aria-pressed={selected}
                        className={selected ? "is-selected" : ""}
                        key={option}
                        onClick={() => toggleDiet(option)}
                        type="button"
                      >
                        {selected && <Check size={14} />} {option}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
              <div className="onboarding-fields onboarding-fields--single">
                <label>Món/nguyên liệu không thích<input value={avoidFoods} onChange={(event) => setAvoidFoods(event.target.value)} placeholder="Ví dụ: hành tây, cần tây" /></label>
                <label>Dị ứng thực phẩm<input value={allergies} onChange={(event) => setAllergies(event.target.value)} placeholder="Ví dụ: đậu phộng, hải sản" /></label>
                <label>Không dung nạp hoặc không ăn được<input value={intolerances} onChange={(event) => setIntolerances(event.target.value)} placeholder="Ví dụ: lactose, gluten" /></label>
                <label>Ghi chú sức khỏe cho kế hoạch<textarea maxLength={1000} value={form.medicalNotes ?? ""} onChange={(event) => update("medicalNotes", event.target.value)} placeholder="Không bắt buộc. Không nhập thông tin định danh cá nhân." /></label>
              </div>
              <div className="onboarding-safety"><ShieldCheck size={18} /><span>NutriPlan không chẩn đoán bệnh và không thay thế bác sĩ hoặc chuyên gia dinh dưỡng.</span></div>
            </>
          )}

          {error && <div className="login-error"><AlertCircle size={17} /><span>{error}</span></div>}
        </div>

        <footer className="onboarding-actions">
          <div>
            {step > 0 && (
              <button className="button button--outline" disabled={saving} onClick={() => setStep((value) => value - 1)} type="button">
                <ArrowLeft size={17} /> Quay lại
              </button>
            )}
            {!required && step === 0 && (
              <button className="button button--outline" disabled={saving} onClick={onClose} type="button">Để sau</button>
            )}
          </div>
          <button className="button button--dark" disabled={saving} type="submit">
            {saving ? <LoaderCircle className="spin" size={17} /> : step === 2 ? <Check size={17} /> : <ArrowRight size={17} />}
            {saving ? "Đang lưu…" : step === 2 ? "Lưu hồ sơ" : "Tiếp tục"}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
