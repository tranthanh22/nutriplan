export type WeightRange = "7d" | "1m" | "3m" | "1y" | "all";

export type WeightHistoryEntry = {
  id: string;
  recorded_on: string;
  weight_kg: number | string;
  created_at: string;
  updated_at: string;
};

export type WeightHistoryResponse = {
  range: WeightRange;
  entries: WeightHistoryEntry[];
};

export async function getWeightHistory(range: WeightRange) {
  const response = await fetch(
    `/api/nutrition-profiles/weight-history?range=${encodeURIComponent(range)}`,
    { cache: "no-store" }
  );
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload
        ? String(payload.message)
        : "Không thể tải lịch sử cân nặng.";
    throw new Error(message);
  }
  return payload as WeightHistoryResponse;
}
