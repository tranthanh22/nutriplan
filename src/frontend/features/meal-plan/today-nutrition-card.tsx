"use client";

import {
  ChartPie,
  ChevronDown,
  Info,
  Leaf,
  NotebookText,
  X
} from "lucide-react";
import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/modal";
import type { DishMicronutrients } from "./meal-plan-types";

type NutritionTargets = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type NutrientKey = keyof DishMicronutrients;

export type NutritionMealItem = {
  calories_kcal: number | string;
  protein_g: number | string;
  carbs_g: number | string;
  fat_g: number | string;
  servings: number | string;
  dishes?: {
    dish_nutrition?: DishMicronutrients | DishMicronutrients[] | null;
  };
};

const macroColors = {
  carbs: "#f5b800",
  fat: "#19b7c5",
  protein: "#8b68ee"
};

const micronutrientRows: Array<{
  key: NutrientKey;
  label: string;
  unit: string;
  target: number;
  upperLimit?: boolean;
}> = [
  { key: "fiber_g", label: "Chất xơ", unit: "g", target: 25 },
  { key: "sodium_mg", label: "Natri", unit: "mg", target: 2300, upperLimit: true },
  { key: "cholesterol_mg", label: "Cholesterol", unit: "mg", target: 300, upperLimit: true },
  { key: "potassium_mg", label: "Kali", unit: "mg", target: 3500 },
  { key: "calcium_mg", label: "Canxi", unit: "mg", target: 1000 },
  { key: "iron_mg", label: "Sắt", unit: "mg", target: 18 },
  { key: "magnesium_mg", label: "Magie", unit: "mg", target: 400 },
  { key: "vitamin_a_mcg", label: "Vitamin A", unit: "mcg", target: 900 },
  { key: "vitamin_c_mg", label: "Vitamin C", unit: "mg", target: 90 },
  { key: "vitamin_d_mcg", label: "Vitamin D", unit: "mcg", target: 15 },
  { key: "vitamin_b12_mcg", label: "Vitamin B12", unit: "mcg", target: 2.4 }
];

function numberValue(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function dishMicronutrients(item: NutritionMealItem) {
  const nutrition = item.dishes?.dish_nutrition;
  return Array.isArray(nutrition) ? nutrition[0] : nutrition;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: value < 10 && value % 1 !== 0 ? 1 : 0
  }).format(value);
}

function polarPoint(angle: number, radius = 86) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: 100 + radius * Math.cos(radians),
    y: 100 + radius * Math.sin(radians)
  };
}

function pieSlicePath(startAngle: number, endAngle: number) {
  const start = polarPoint(endAngle);
  const end = polarPoint(startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M 100 100 L ${start.x} ${start.y} A 86 86 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

export function TodayNutritionCard({
  meals,
  targets,
  onOpenJournal,
  sourceLabel = "kế hoạch cá nhân",
  micronutrientsAvailable = true
}: {
  meals: NutritionMealItem[];
  targets: NutritionTargets;
  onOpenJournal: () => void;
  sourceLabel?: string;
  micronutrientsAvailable?: boolean;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const totals = useMemo(() => {
    const result = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      micronutrients: Object.fromEntries(
        micronutrientRows.map((row) => [row.key, 0])
      ) as Record<NutrientKey, number>
    };

    for (const meal of meals) {
      result.calories += numberValue(meal.calories_kcal);
      result.protein += numberValue(meal.protein_g);
      result.carbs += numberValue(meal.carbs_g);
      result.fat += numberValue(meal.fat_g);
      const nutrition = dishMicronutrients(meal);
      const servings = Math.max(0, numberValue(meal.servings));
      for (const row of micronutrientRows) {
        result.micronutrients[row.key] +=
          numberValue(nutrition?.[row.key]) * servings;
      }
    }
    return result;
  }, [meals]);

  const macroEnergy = {
    carbs: totals.carbs * 4,
    fat: totals.fat * 9,
    protein: totals.protein * 4
  };
  const macroEnergyTotal =
    macroEnergy.carbs + macroEnergy.fat + macroEnergy.protein;
  const percentages = {
    carbs: macroEnergyTotal ? (macroEnergy.carbs / macroEnergyTotal) * 100 : 0,
    fat: macroEnergyTotal ? (macroEnergy.fat / macroEnergyTotal) * 100 : 0,
    protein: macroEnergyTotal ? (macroEnergy.protein / macroEnergyTotal) * 100 : 0
  };

  return (
    <>
      <article className="figma-card today-nutrition-card">
      <div className="figma-card__heading today-nutrition-card__heading">
        <div>
          <h2><ChartPie size={20} /> Dinh dưỡng thực đơn hôm nay</h2>
          <p>Tổng hợp từ {meals.length} món trong {sourceLabel}.</p>
        </div>
        <button className="link-button" onClick={onOpenJournal} type="button">
          <NotebookText size={16} /> Nhật ký
        </button>
      </div>

      {meals.length === 0 ? (
        <div className="today-nutrition-card__empty">
          <Leaf size={28} />
          <strong>Chưa có thực đơn cho hôm nay</strong>
          <span>Biểu đồ sẽ xuất hiện sau khi thực đơn cá nhân được tạo.</span>
        </div>
      ) : (
        <>
          <div className="today-nutrition-overview">
            <MacroDonut
              calories={totals.calories}
              percentages={percentages}
            />
            <div className="today-nutrition-table">
              <div className="today-nutrition-table__head">
                <span />
                <strong>Tổng thực đơn</strong>
                <strong>Mục tiêu</strong>
              </div>
              <NutritionTotalRow label="Năng lượng" value={`${formatNumber(totals.calories)} kcal`} target={`${formatNumber(targets.calories)} kcal`} />
              <NutritionTotalRow color={macroColors.carbs} label="Tinh bột" value={`${formatNumber(totals.carbs)} g`} target={`${formatNumber(targets.carbs)} g`} />
              <NutritionTotalRow color={macroColors.fat} label="Chất béo" value={`${formatNumber(totals.fat)} g`} target={`${formatNumber(targets.fat)} g`} />
              <NutritionTotalRow color={macroColors.protein} label="Protein" value={`${formatNumber(totals.protein)} g`} target={`${formatNumber(targets.protein)} g`} />
              {micronutrientsAvailable
                ? micronutrientRows.slice(0, 3).map((row) => (
                    <NutritionTotalRow
                      key={row.key}
                      label={row.label}
                      target={`${row.upperLimit ? "≤ " : ""}${formatNumber(row.target)} ${row.unit}`}
                      value={`${formatNumber(totals.micronutrients[row.key])} ${row.unit}`}
                    />
                  ))
                : null}
            </div>
          </div>

          <button
            aria-expanded={detailsOpen}
            aria-haspopup="dialog"
            className="today-nutrition-details-toggle"
            onClick={() => setDetailsOpen(true)}
            type="button"
          >
            Xem vitamin và khoáng chất
            <ChevronDown size={18} />
          </button>

          <div className="today-nutrition-note">
            <Info size={15} />
            <span>
              {micronutrientsAvailable
                ? "Vitamin và khoáng chất là số liệu ước tính theo khẩu phần món; mốc tham chiếu chung không thay thế tư vấn chuyên gia."
                : "Món từ bếp hiện có calorie và macro; dữ liệu vitamin, khoáng chất sẽ hiển thị khi bếp cung cấp."}
            </span>
          </div>
        </>
      )}
      </article>

      {detailsOpen ? (
        <MicronutrientModal
          totals={totals.micronutrients}
          available={micronutrientsAvailable}
          sourceLabel={sourceLabel}
          onClose={() => setDetailsOpen(false)}
        />
      ) : null}
    </>
  );
}

function MicronutrientModal({
  totals,
  available,
  sourceLabel,
  onClose
}: {
  totals: Record<NutrientKey, number>;
  available: boolean;
  sourceLabel: string;
  onClose: () => void;
}) {
  return (
    <Modal labelledBy="micronutrient-modal-title" onClose={onClose} wide>
      <section className="micronutrient-modal">
        <header className="modal-header micronutrient-modal__header">
          <div>
            <span className="section-kicker">CHI TIẾT DINH DƯỠNG</span>
            <h2 id="micronutrient-modal-title">Vitamin và khoáng chất</h2>
            <p>Thông tin từ toàn bộ món trong {sourceLabel} của ngày đang chọn.</p>
          </div>
          <button
            aria-label="Đóng chi tiết vitamin và khoáng chất"
            autoFocus
            className="modal-close"
            onClick={onClose}
            type="button"
          >
            <X size={19} />
          </button>
        </header>

        <div className="micronutrient-modal__content">
          {available ? (
            <div className="micronutrient-grid micronutrient-grid--modal">
              {micronutrientRows.slice(3).map((row) => {
                const value = totals[row.key];
                const progress = Math.min(100, (value / row.target) * 100);
                return (
                  <div className="micronutrient-item" key={row.key}>
                    <div><span>{row.label}</span><strong>{formatNumber(value)} <small>{row.unit}</small></strong></div>
                    <div className="micronutrient-item__track"><span style={{ width: `${progress}%` }} /></div>
                    <small>{formatNumber(progress)}% mốc tham chiếu</small>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="micronutrient-modal__empty">
              <Leaf size={30} />
              <strong>Bếp chưa cung cấp dữ liệu vi chất</strong>
              <span>Calorie, protein, tinh bột và chất béo vẫn được tổng hợp chính xác từ các món trong lịch ăn.</span>
            </div>
          )}
          <div className="today-nutrition-note today-nutrition-note--modal">
            <Info size={16} />
            <span>
              {available
                ? "Số liệu được ước tính theo khẩu phần món và mốc tham chiếu chung, không thay thế tư vấn của chuyên gia dinh dưỡng."
                : "NutriPlan không tự suy đoán vitamin và khoáng chất khi nhà bếp chưa khai báo dữ liệu."}
            </span>
          </div>
        </div>
      </section>
    </Modal>
  );
}

function MacroDonut({
  calories,
  percentages
}: {
  calories: number;
  percentages: { carbs: number; fat: number; protein: number };
}) {
  let angle = 0;
  const segments = [
    { key: "carbs", label: "Tinh bột", value: percentages.carbs, color: macroColors.carbs },
    { key: "fat", label: "Chất béo", value: percentages.fat, color: macroColors.fat },
    { key: "protein", label: "Protein", value: percentages.protein, color: macroColors.protein }
  ];

  return (
    <div className="macro-donut-wrap">
      <div className="macro-donut">
        <svg aria-label="Tỷ lệ năng lượng từ tinh bột, chất béo và protein" role="img" viewBox="0 0 200 200">
          <title>Biểu đồ tỷ lệ chất dinh dưỡng hôm nay</title>
          {segments.every((segment) => segment.value === 0) ? <circle className="macro-pie__empty" cx="100" cy="100" r="86" /> : null}
          {segments.map((segment) => {
            const startAngle = angle;
            const sliceAngle = (segment.value / 100) * 360;
            const endAngle = startAngle + sliceAngle;
            angle = endAngle;
            const label = polarPoint(startAngle + sliceAngle / 2, 53);
            if (sliceAngle <= 0) return null;
            return (
              <g key={segment.key}>
                {sliceAngle >= 359.99 ? (
                  <circle className="macro-pie__slice" cx="100" cy="100" fill={segment.color} r="86" />
                ) : (
                  <path className="macro-pie__slice" d={pieSlicePath(startAngle, endAngle)} fill={segment.color} />
                )}
                {segment.value >= 8 ? (
                  <text className="macro-pie__label" textAnchor="middle" x={label.x} y={label.y - 3}>
                    <tspan x={label.x}>{segment.label}</tspan>
                    <tspan dy="15" x={label.x}>{formatNumber(segment.value)}%</tspan>
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="macro-donut__total"><strong>{formatNumber(calories)}</strong><span>kcal trong thực đơn</span></div>
      <div className="macro-donut-legend">
        {segments.map((segment) => (
          <span key={segment.key}><i style={{ background: segment.color }} /><strong>{segment.label}</strong>{formatNumber(segment.value)}%</span>
        ))}
      </div>
    </div>
  );
}

function NutritionTotalRow({
  color,
  label,
  target,
  value
}: {
  color?: string;
  label: string;
  target: string;
  value: string;
}) {
  return (
    <div className="today-nutrition-table__row">
      <span>{color ? <i style={{ background: color }} /> : null}{label}</span>
      <strong>{value}</strong>
      <span>{target}</span>
    </div>
  );
}
