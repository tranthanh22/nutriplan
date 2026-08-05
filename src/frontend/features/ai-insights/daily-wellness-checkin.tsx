"use client";

import {
  Activity,
  AlertCircle,
  BedDouble,
  CheckCircle2,
  ChevronDown,
  Droplets,
  HeartPulse,
  LoaderCircle,
  Moon,
  Save,
  Smile,
  UtensilsCrossed,
  Zap
} from "lucide-react";
import { FormEvent, useEffect, useState, type ReactNode } from "react";
import {
  getTodayWellness,
  saveTodayWellness,
  type DailyWellnessInput,
  type DailyWellnessRecord
} from "./daily-wellness-api";

const SYMPTOMS = ["Không có", "Mệt lả", "Chóng mặt", "Đau đầu", "Đau cơ", "Buồn nôn", "Khó tiêu"];

type EstimateOption = {
  value: number;
  title: string;
  range: string;
  min: number;
  max?: number;
};

const ACTIVITY_DURATION_OPTIONS: EstimateOption[] = [
  { value: 0, title: "Không vận động", range: "0 phút", min: 0, max: 1 },
  { value: 10, title: "Rất ít", range: "1–15 phút", min: 1, max: 16 },
  { value: 30, title: "Nhẹ", range: "16–30 phút", min: 16, max: 31 },
  { value: 45, title: "Vừa", range: "31–60 phút", min: 31, max: 61 },
  { value: 90, title: "Nhiều", range: "Trên 60 phút", min: 61 }
];

const SLEEP_DURATION_OPTIONS: EstimateOption[] = [
  { value: 4, title: "Rất ít", range: "Dưới 5 giờ", min: 0, max: 5 },
  { value: 5.5, title: "Ít", range: "Khoảng 5–6 giờ", min: 5, max: 6 },
  { value: 6.5, title: "Tạm đủ", range: "Khoảng 6–7 giờ", min: 6, max: 7 },
  { value: 7.5, title: "Đủ", range: "Khoảng 7–8 giờ", min: 7, max: 8.01 },
  { value: 9, title: "Nhiều", range: "Trên 8 giờ", min: 8.01 }
];

const WATER_OPTIONS: EstimateOption[] = [
  { value: 0.35, title: "Rất ít", range: "Dưới 500 ml", min: 0, max: 0.5 },
  { value: 0.6, title: "Vừa", range: "500–700 ml", min: 0.5, max: 0.8 },
  { value: 1, title: "Khá", range: "800 ml–1,2 lít", min: 0.8, max: 1.3 },
  { value: 1.5, title: "Tốt", range: "1,3–1,8 lít", min: 1.3, max: 1.9 },
  { value: 2.2, title: "Nhiều", range: "Trên 1,8 lít", min: 1.9 }
];

function normalizeEstimate(value: number, options: EstimateOption[]) {
  return (
    options.find(
      (option) => value >= option.min && (option.max === undefined || value < option.max)
    )?.value ?? options[0].value
  );
}

const DEFAULT_FORM: DailyWellnessInput = {
  activityType: "walking",
  activityMinutes: 30,
  activityIntensity: "light",
  fatigueLevel: 2,
  energyLevel: 3,
  sleepHours: 7.5,
  sleepQuality: 3,
  stressLevel: 2,
  mood: "good",
  waterLiters: 1.5,
  symptoms: ["Không có"],
  notes: ""
};

function recordToForm(record: DailyWellnessRecord): DailyWellnessInput {
  return {
    activityType: record.activity_type,
    activityMinutes: normalizeEstimate(Number(record.activity_minutes), ACTIVITY_DURATION_OPTIONS),
    activityIntensity: record.activity_intensity,
    fatigueLevel: Number(record.fatigue_level),
    energyLevel: Number(record.energy_level),
    sleepHours: normalizeEstimate(Number(record.sleep_hours), SLEEP_DURATION_OPTIONS),
    sleepQuality: Number(record.sleep_quality),
    stressLevel: Number(record.stress_level),
    mood: record.mood,
    waterLiters: record.water_liters === null
      ? DEFAULT_FORM.waterLiters
      : normalizeEstimate(Number(record.water_liters), WATER_OPTIONS),
    symptoms: record.symptoms,
    notes: record.notes ?? ""
  };
}

export function DailyWellnessCheckin({
  onStatusChange,
  onSaved
}: {
  onStatusChange: (completed: boolean) => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void getTodayWellness()
      .then((record) => {
        if (!active) return;
        if (record) {
          setForm(recordToForm(record));
          setCompleted(true);
          setOpen(false);
          onStatusChange(true);
        } else {
          onStatusChange(false);
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError instanceof Error ? requestError.message : "Không thể tải check-in.");
          onStatusChange(false);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [onStatusChange]);

  const update = <K extends keyof DailyWellnessInput>(
    key: K,
    value: DailyWellnessInput[K]
  ) => setForm((current) => ({ ...current, [key]: value }));

  function toggleSymptom(symptom: string) {
    if (symptom === "Không có") {
      update("symptoms", ["Không có"]);
      return;
    }
    const withoutNone = form.symptoms.filter((item) => item !== "Không có");
    update(
      "symptoms",
      withoutNone.includes(symptom)
        ? withoutNone.filter((item) => item !== symptom)
        : [...withoutNone, symptom]
    );
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const saved = await saveTodayWellness({
        ...form,
        symptoms: form.symptoms.length ? form.symptoms : ["Không có"],
        notes: form.notes?.trim() || undefined
      });
      setForm(recordToForm(saved));
      setCompleted(true);
      setOpen(false);
      onStatusChange(true);
      onSaved();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Không thể lưu check-in.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={`daily-checkin ${completed ? "is-completed" : ""}`}>
      <button
        className="daily-checkin__toggle"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className="daily-checkin__icon">
          {completed ? <CheckCircle2 size={20} /> : <Activity size={20} />}
        </span>
        <span>
          <strong>{completed ? "Đã check-in sức khỏe hôm nay" : "Check-in trước khi nhận Insight"}</strong>
          <small>{completed ? "Bạn có thể mở lại để chỉnh câu trả lời." : "Khoảng 1 phút · giúp AI hiểu trạng thái hiện tại."}</small>
        </span>
        <ChevronDown className={open ? "is-open" : ""} size={19} />
      </button>

      {loading && <div className="daily-checkin__loading"><LoaderCircle className="spin" size={18} /> Đang tải câu hỏi…</div>}

      {!loading && open && (
        <form className="daily-checkin__form" onSubmit={(event) => void submit(event)}>
          <CheckinGroup
            icon={<Activity size={19} />}
            title="Vận động hôm nay"
            description="Loại hình, thời lượng và cường độ vận động."
          >
            <div className="daily-checkin__group-grid">
              <label>
                Bạn vận động thế nào?
                <select value={form.activityType} onChange={(event) => update("activityType", event.target.value as DailyWellnessInput["activityType"])}>
                  <option value="rest">Nghỉ ngơi/không tập</option>
                  <option value="walking">Đi bộ</option>
                  <option value="cardio">Cardio</option>
                  <option value="strength">Tập sức mạnh</option>
                  <option value="sport">Chơi thể thao</option>
                  <option value="mixed">Kết hợp nhiều hoạt động</option>
                </select>
              </label>
              <label>
                Cường độ
                <select value={form.activityIntensity} onChange={(event) => update("activityIntensity", event.target.value as DailyWellnessInput["activityIntensity"])}>
                  <option value="rest">Không vận động</option>
                  <option value="light">Nhẹ</option>
                  <option value="moderate">Vừa</option>
                  <option value="high">Cao</option>
                </select>
              </label>
              <EstimateQuestion
                icon={<Activity size={16} />}
                legend="Thời lượng vận động ước lượng"
                name="activity-duration"
                options={ACTIVITY_DURATION_OPTIONS}
                value={form.activityMinutes}
                onChange={(value) => update("activityMinutes", value)}
              />
            </div>
          </CheckinGroup>

          <CheckinGroup
            icon={<HeartPulse size={19} />}
            title="Thể trạng"
            description="Đánh giá nhanh cảm giác hiện tại của cơ thể."
          >
            <div className="daily-checkin__group-grid">
              <ScaleQuestion icon={<Zap size={16} />} label="Mức mệt mỏi" value={form.fatigueLevel} onChange={(value) => update("fatigueLevel", value)} low="Không mệt" high="Rất mệt" />
              <ScaleQuestion icon={<Smile size={16} />} label="Mức năng lượng" value={form.energyLevel} onChange={(value) => update("energyLevel", value)} low="Rất thấp" high="Rất tốt" />
            </div>
          </CheckinGroup>

          <CheckinGroup
            icon={<BedDouble size={19} />}
            title="Giấc ngủ và tinh thần"
            description="Giấc ngủ, tâm trạng và mức căng thẳng trong ngày."
          >
            <div className="daily-checkin__group-grid">
              <label>
                Tâm trạng hôm nay
                <select value={form.mood} onChange={(event) => update("mood", event.target.value as DailyWellnessInput["mood"])}>
                  <option value="very_low">Rất không tốt</option>
                  <option value="low">Không tốt</option>
                  <option value="neutral">Bình thường</option>
                  <option value="good">Tốt</option>
                  <option value="very_good">Rất tốt</option>
                </select>
              </label>
              <EstimateQuestion
                icon={<Moon size={16} />}
                legend="Bạn ngủ khoảng bao lâu?"
                name="sleep-duration"
                options={SLEEP_DURATION_OPTIONS}
                value={form.sleepHours}
                onChange={(value) => update("sleepHours", value)}
              />
              <ScaleQuestion icon={<Moon size={16} />} label="Chất lượng giấc ngủ" value={form.sleepQuality} onChange={(value) => update("sleepQuality", value)} low="Rất kém" high="Rất tốt" />
              <ScaleQuestion icon={<Zap size={16} />} label="Mức căng thẳng" value={form.stressLevel} onChange={(value) => update("stressLevel", value)} low="Thấp" high="Rất cao" />
            </div>
          </CheckinGroup>

          <CheckinGroup
            icon={<UtensilsCrossed size={19} />}
            title="Nước uống và dấu hiệu"
            description="Bổ sung các dấu hiệu cần lưu ý cho phân tích hôm nay."
          >
            <div className="daily-checkin__group-grid daily-checkin__group-grid--nutrition">
              <EstimateQuestion
                icon={<Droplets size={16} />}
                legend="Hôm nay bạn đã uống khoảng bao nhiêu nước?"
                name="water-amount"
                options={WATER_OPTIONS}
                value={form.waterLiters ?? DEFAULT_FORM.waterLiters ?? 1.5}
                onChange={(value) => update("waterLiters", value)}
              />
              <fieldset className="daily-symptoms">
                <legend>Bạn có dấu hiệu nào không?</legend>
                <div>
                  {SYMPTOMS.map((symptom) => (
                    <button
                      aria-pressed={form.symptoms.includes(symptom)}
                      className={form.symptoms.includes(symptom) ? "is-selected" : ""}
                      key={symptom}
                      onClick={() => toggleSymptom(symptom)}
                      type="button"
                    >
                      {form.symptoms.includes(symptom) && <CheckCircle2 size={14} />}
                      {symptom}
                    </button>
                  ))}
                </div>
              </fieldset>
              <label className="daily-checkin__notes">
                Ghi chú thêm <small>Không gửi sang AI trong MVP</small>
                <textarea maxLength={500} value={form.notes ?? ""} onChange={(event) => update("notes", event.target.value)} placeholder="Ví dụ: hôm nay ăn muộn, vừa đi công tác…" />
              </label>
            </div>
          </CheckinGroup>

          {error && <div className="login-error"><AlertCircle size={16} /><span>{error}</span></div>}
          <button className="button button--dark" disabled={saving} type="submit">
            {saving ? <LoaderCircle className="spin" size={17} /> : <Save size={17} />}
            {saving ? "Đang lưu…" : completed ? "Cập nhật check-in" : "Lưu check-in hôm nay"}
          </button>
        </form>
      )}
    </section>
  );
}

function CheckinGroup({
  icon,
  title,
  description,
  children
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="daily-checkin__group">
      <header className="daily-checkin__group-header">
        <span>{icon}</span>
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
      </header>
      {children}
    </section>
  );
}

function EstimateQuestion({
  icon,
  legend,
  name,
  options,
  value,
  onChange
}: {
  icon: ReactNode;
  legend: string;
  name: string;
  options: EstimateOption[];
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <fieldset className="estimate-question">
      <legend>{icon} {legend}</legend>
      <div className="estimate-question__options">
        {options.map((option) => (
          <label className={value === option.value ? "is-selected" : ""} key={option.value}>
            <input
              checked={value === option.value}
              name={name}
              onChange={() => onChange(option.value)}
              required
              type="radio"
              value={option.value}
            />
            <strong>{option.title}</strong>
            <small>{option.range}</small>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function ScaleQuestion({
  icon,
  label,
  value,
  onChange,
  low,
  high
}: {
  icon: ReactNode;
  label: string;
  value: number;
  onChange: (value: number) => void;
  low: string;
  high: string;
}) {
  return (
    <label className="scale-question">
      <span>{icon} {label}</span>
      <input type="range" min={1} max={5} value={value} onChange={(event) => onChange(Number(event.target.value))} />
      <small><span>{low}</span><b>{value}/5</b><span>{high}</span></small>
    </label>
  );
}
