import type { Meal } from "@/lib/data";
import { resolveFigmaMealImage } from "@/lib/figma-assets";
import type { JournalEntry } from "@/types/app";
import type {
  BackendJournalEntry,
  MyMenusResponse,
  PersonalMealItem,
  ReplacementCandidate
} from "./meal-plan-types";

export type DishRecipe = {
  dish_id: string;
  ingredients: string[];
  instructions: string[];
  cooking_tips: string | null;
  storage_instructions: string | null;
  safety_notes: string | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
};

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
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
      payload &&
      typeof payload === "object" &&
      "message" in payload &&
      typeof payload.message === "string"
        ? payload.message
        : "Không thể tải dữ liệu thực đơn.";
    throw new Error(message);
  }
  return payload as T;
}

export function getMyMenus(range?: { from: string; to: string }) {
  const query = range
    ? `?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}`
    : "";
  return requestJson<MyMenusResponse>(`/api/meal-plans/mine${query}`);
}

export function getReplacementCandidates(itemId: string) {
  return requestJson<ReplacementCandidate[]>(
    `/api/meal-plans/items/${encodeURIComponent(itemId)}/replacements`
  );
}

export function generatePersonalMenuDay(plannedDate: string) {
  return requestJson<{ planId: string; plannedDate: string; itemCount: number }>(
    "/api/meal-plans/days",
    { method: "POST", body: JSON.stringify({ plannedDate }) }
  );
}

export function replacePersonalMeal(itemId: string, dishId: string) {
  return requestJson(
    `/api/meal-plans/items/${encodeURIComponent(itemId)}/replace`,
    { method: "PATCH", body: JSON.stringify({ dishId }) }
  );
}

export function confirmPersonalMeal(itemId: string) {
  return requestJson<BackendJournalEntry>(
    `/api/meal-plans/items/${encodeURIComponent(itemId)}/confirm-eaten`,
    { method: "POST", body: JSON.stringify({}) }
  );
}

export function confirmKitchenMealItem(dailyOrderItemId: string) {
  return requestJson<BackendJournalEntry>(
    `/api/meal-plans/kitchen/items/${encodeURIComponent(dailyOrderItemId)}/confirm-eaten`,
    { method: "POST", body: JSON.stringify({}) }
  );
}

export function requestKitchenMealChange(
  dailyOrderItemId: string,
  input: { reason: string; note?: string }
) {
  return requestJson(
    `/api/meal-plans/kitchen/items/${encodeURIComponent(dailyOrderItemId)}/change-requests`,
    { method: "POST", body: JSON.stringify(input) }
  );
}

export function getNutritionJournal(date?: string) {
  const query = date
    ? `?from=${encodeURIComponent(date)}&to=${encodeURIComponent(date)}`
    : "";
  return requestJson<{ entries: BackendJournalEntry[] }>(
    `/api/meal-plans/journal${query}`
  );
}

export function getDishRecipe(dishId: string, signal?: AbortSignal) {
  return requestJson<DishRecipe>(
    `/api/dishes/${encodeURIComponent(dishId)}/recipe`,
    { signal }
  );
}

export function personalMealItemToMeal(item: PersonalMealItem): Meal {
  return {
    id: item.dishes.id,
    name: item.dishes.name,
    subtitle: item.dishes.short_description ?? "Món trong kế hoạch cá nhân",
    image: resolveFigmaMealImage(item.dishes.name, item.dishes.image_path),
    calories: Math.round(Number(item.calories_kcal)),
    protein: Math.round(Number(item.protein_g)),
    carbs: Math.round(Number(item.carbs_g)),
    fat: Math.round(Number(item.fat_g)),
    prepTime: item.dishes.prep_time_minutes ?? 20,
    ingredients: ["Xem định lượng chi tiết trong Recipe của món."],
    instructions: ["Mở Recipe để xem hướng dẫn chuẩn bị từng bước."],
    tags: item.is_replacement
      ? ["Món đã thay", "Cân bằng dinh dưỡng"]
      : [
          "Kế hoạch cá nhân",
          item.dishes.dish_kind === "drink"
            ? "Đồ uống"
            : item.dishes.dish_kind === "snack"
              ? "Bữa nhẹ"
              : "Bữa chính"
        ],
    mealPlanItemId: item.id,
    consumptionStatus: item.consumption_status
  };
}

export function backendLogToJournal(entry: BackendJournalEntry): JournalEntry {
  const consumedAt = new Date(entry.consumed_at);
  const source: JournalEntry["source"] =
    entry.source === "recipe"
      ? "Kế hoạch"
      : entry.source === "kitchen"
        ? "Bếp đối tác"
        : entry.source === "image_estimate"
          ? "Ảnh ước tính"
          : "Nhập tay";
  const slot =
    entry.meal_type === "breakfast"
      ? "Sáng"
      : entry.meal_type === "lunch"
        ? "Trưa"
        : entry.meal_type === "dinner"
          ? "Tối"
          : "Bữa phụ";
  return {
    id: entry.id,
    name: entry.name,
    slot,
    calories: Number(entry.calories_kcal),
    protein: Number(entry.protein_g),
    carbs: Number(entry.carbs_g),
    fat: Number(entry.fat_g),
    source,
    time: consumedAt.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit"
    })
  };
}
