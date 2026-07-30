export type DailyWellnessInput = {
  activityType: "rest" | "walking" | "cardio" | "strength" | "sport" | "mixed";
  activityMinutes: number;
  activityIntensity: "rest" | "light" | "moderate" | "high";
  fatigueLevel: number;
  energyLevel: number;
  sleepHours: number;
  sleepQuality: number;
  stressLevel: number;
  mood: "very_low" | "low" | "neutral" | "good" | "very_good";
  waterLiters?: number;
  symptoms: string[];
  notes?: string;
};

export type DailyWellnessRecord = {
  id: string;
  checkin_date: string;
  activity_type: DailyWellnessInput["activityType"];
  activity_minutes: number;
  activity_intensity: DailyWellnessInput["activityIntensity"];
  fatigue_level: number;
  energy_level: number;
  sleep_hours: number | string;
  sleep_quality: number;
  stress_level: number;
  mood: DailyWellnessInput["mood"];
  water_liters: number | string | null;
  symptoms: string[];
  notes: string | null;
  updated_at: string;
};

async function request<T>(init?: RequestInit): Promise<T> {
  const response = await fetch("/api/wellness-checkins/today", {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers
    },
    cache: "no-store"
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload
        ? Array.isArray(payload.message)
          ? payload.message.join(", ")
          : String(payload.message)
        : "Không thể lưu check-in hôm nay.";
    throw new Error(message);
  }
  return payload as T;
}

export function getTodayWellness() {
  return request<DailyWellnessRecord | null>();
}

export function saveTodayWellness(input: DailyWellnessInput) {
  return request<DailyWellnessRecord>({
    method: "PUT",
    body: JSON.stringify(input)
  });
}
