"use client";

import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Droplets,
  LoaderCircle,
  Moon,
  Save,
  Smile,
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

const DEFAULT_FORM: DailyWellnessInput = {
  activityType: "walking",
  activityMinutes: 30,
  activityIntensity: "light",
  fatigueLevel: 2,
  energyLevel: 3,
  sleepHours: 7,
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
    activityMinutes: Number(record.activity_minutes),
    activityIntensity: record.activity_intensity,
    fatigueLevel: Number(record.fatigue_level),
    energyLevel: Number(record.energy_level),
    sleepHours: Number(record.sleep_hours),
    sleepQuality: Number(record.sleep_quality),
    stressLevel: Number(record.stress_level),
    mood: record.mood,
    waterLiters:
      record.water_liters === null ? undefined : Number(record.water_liters),
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
          <div className="daily-checkin__grid">
            <label>
              <span><Activity size={15} /> Hôm nay bạn vận động thế nào?</span>
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
              Thời lượng vận động (phút)
              <input type="number" min={0} max={600} value={form.activityMinutes} onChange={(event) => update("activityMinutes", Number(event.target.value))} />
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
            <ScaleQuestion icon={<Zap size={15} />} label="Bạn có thấy mệt mỏi?" value={form.fatigueLevel} onChange={(value) => update("fatigueLevel", value)} low="Không mệt" high="Rất mệt" />
            <ScaleQuestion icon={<Smile size={15} />} label="Mức năng lượng hiện tại" value={form.energyLevel} onChange={(value) => update("energyLevel", value)} low="Rất thấp" high="Rất tốt" />
            <label>
              <span><Moon size={15} /> Bạn ngủ bao nhiêu giờ?</span>
              <input type="number" min={0} max={24} step="0.5" value={form.sleepHours} onChange={(event) => update("sleepHours", Number(event.target.value))} />
            </label>
            <ScaleQuestion icon={<Moon size={15} />} label="Chất lượng giấc ngủ" value={form.sleepQuality} onChange={(value) => update("sleepQuality", value)} low="Rất kém" high="Rất tốt" />
            <ScaleQuestion icon={<Zap size={15} />} label="Mức căng thẳng hôm nay" value={form.stressLevel} onChange={(value) => update("stressLevel", value)} low="Thấp" high="Rất cao" />
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
            <label>
              <span><Droplets size={15} /> Nước đã uống (lít)</span>
              <input type="number" min={0} max={10} step="0.1" value={form.waterLiters ?? ""} onChange={(event) => update("waterLiters", event.target.value ? Number(event.target.value) : undefined)} />
            </label>
          </div>

          <fieldset className="daily-symptoms">
            <legend>Hôm nay bạn có dấu hiệu nào không?</legend>
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
            Ghi chú cá nhân (không gửi sang AI trong MVP)
            <textarea maxLength={500} value={form.notes ?? ""} onChange={(event) => update("notes", event.target.value)} placeholder="Ví dụ: hôm nay ăn muộn, vừa đi công tác…" />
          </label>
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
