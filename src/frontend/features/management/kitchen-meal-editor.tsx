"use client";

import { Check, LoaderCircle, Pencil, X } from "lucide-react";
import { useEffect, useState } from "react";
import { NumberInput } from "@/components/ui/number-input";
import {
  updateManagedDailyOrderItem,
  type ManagedDailyOrderItem,
  type UpdateManagedDailyOrderItemInput
} from "./management-api";

function numeric(value: number | string) {
  return Number(value);
}

function numberLabel(value: number | string) {
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(Number(value));
}

function initialDraft(item: ManagedDailyOrderItem): UpdateManagedDailyOrderItemInput {
  return {
    dishName: item.dish_name,
    ingredients: item.ingredient_snapshot,
    servings: numeric(item.servings),
    caloriesKcal: numeric(item.calories_kcal),
    proteinG: numeric(item.protein_g),
    carbsG: numeric(item.carbs_g),
    fatG: numeric(item.fat_g),
    allergens: item.allergen_snapshot
  };
}

export function KitchenMealEditor({
  orderId,
  dailyOrderId,
  item,
  locked,
  onUpdated
}: {
  orderId: string;
  dailyOrderId: string;
  item: ManagedDailyOrderItem;
  locked: boolean;
  onUpdated: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState(() => initialDraft(item));
  const [allergensText, setAllergensText] = useState(item.allergen_snapshot.join(", "));
  const [ingredientsText, setIngredientsText] = useState(item.ingredient_snapshot.join(", "));

  useEffect(() => {
    if (editing) return;
    setDraft(initialDraft(item));
    setAllergensText(item.allergen_snapshot.join(", "));
    setIngredientsText(item.ingredient_snapshot.join(", "));
  }, [editing, item]);

  function cancel() {
    setDraft(initialDraft(item));
    setAllergensText(item.allergen_snapshot.join(", "));
    setIngredientsText(item.ingredient_snapshot.join(", "));
    setError("");
    setEditing(false);
  }

  async function save() {
    if (!draft.dishName.trim()) {
      setError("Vui lòng nhập tên món.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await updateManagedDailyOrderItem(orderId, dailyOrderId, item.id, {
        ...draft,
        dishName: draft.dishName.trim(),
        ingredients: ingredientsText.split(",").map((value) => value.trim()).filter(Boolean),
        allergens: allergensText.split(",").map((value) => value.trim()).filter(Boolean)
      });
      setEditing(false);
      await onUpdated();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể lưu món ăn.");
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div className="package-meal__dish">
        <div className="package-meal__dish-heading">
          <strong>{item.dish_name}</strong>
          {!locked ? (
            <button className="meal-edit-button" onClick={() => setEditing(true)} aria-label={`Chỉnh món ${item.dish_name}`}>
              <Pencil size={14} /> Chỉnh món
            </button>
          ) : null}
        </div>
        <span>{numberLabel(item.servings)} suất</span>
        <span>Nguyên liệu: {item.ingredient_snapshot.join(", ")}</span>
        <div>
          <small>{numberLabel(item.calories_kcal)} kcal</small>
          <small>P {numberLabel(item.protein_g)}g</small>
          <small>C {numberLabel(item.carbs_g)}g</small>
          <small>F {numberLabel(item.fat_g)}g</small>
        </div>
        {item.allergen_snapshot.length > 0 ? <em>Có chứa: {item.allergen_snapshot.join(", ")}</em> : null}
      </div>
    );
  }

  return (
    <div className="kitchen-meal-editor">
      <label className="kitchen-meal-editor__name">
        <span>Tên món nhà bếp chuẩn bị</span>
        <input value={draft.dishName} maxLength={150} onChange={(event) => setDraft((current) => ({ ...current, dishName: event.target.value }))} />
      </label>
      <div className="kitchen-meal-editor__numbers">
        <NutritionNumber label="Số suất" value={draft.servings} min={0.25} max={50} onChange={(servings) => setDraft((current) => ({ ...current, servings }))} />
        <NutritionNumber label="Kcal" value={draft.caloriesKcal} min={0} max={5000} onChange={(caloriesKcal) => setDraft((current) => ({ ...current, caloriesKcal }))} />
        <NutritionNumber label="Protein (g)" value={draft.proteinG} min={0} max={500} onChange={(proteinG) => setDraft((current) => ({ ...current, proteinG }))} />
        <NutritionNumber label="Carb (g)" value={draft.carbsG} min={0} max={1000} onChange={(carbsG) => setDraft((current) => ({ ...current, carbsG }))} />
        <NutritionNumber label="Fat (g)" value={draft.fatG} min={0} max={500} onChange={(fatG) => setDraft((current) => ({ ...current, fatG }))} />
      </div>
      <label>
        <span>Nguyên liệu (cách nhau bằng dấu phẩy)</span>
        <input value={ingredientsText} placeholder="Ví dụ: ức gà, khoai lang, bông cải" onChange={(event) => setIngredientsText(event.target.value)} />
      </label>
      <label>
        <span>Dị nguyên trong món (cách nhau bằng dấu phẩy)</span>
        <input value={allergensText} placeholder="Ví dụ: đậu phộng, sữa" onChange={(event) => setAllergensText(event.target.value)} />
      </label>
      {error ? <p className="kitchen-meal-editor__error" role="alert">{error}</p> : null}
      <div className="kitchen-meal-editor__actions">
        <button className="button button--outline button--small" disabled={saving} onClick={cancel}><X size={15} /> Hủy</button>
        <button className="button button--primary button--small" disabled={saving} onClick={() => void save()}>
          {saving ? <LoaderCircle className="spin" size={15} /> : <Check size={15} />} Lưu món
        </button>
      </div>
    </div>
  );
}

function NutritionNumber({
  label,
  value,
  min,
  max,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <label>
      <span>{label}</span>
      <NumberInput value={value} min={min} max={max} step="0.1" onValueChange={(next) => { if (next !== undefined) onChange(next); }} />
    </label>
  );
}
