"use client";

import Image from "next/image";
import {
  AlertCircle,
  Check,
  ChefHat,
  LoaderCircle,
  RefreshCw,
  X
} from "lucide-react";
import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Metric } from "@/components/ui/nutrition-widgets";
import {
  getJournalEntryDetail
} from "@/features/meal-plan/meal-plan-api";
import type { JournalEntryDetail } from "@/features/meal-plan/meal-plan-types";
import { resolveFigmaMealImage } from "@/lib/figma-assets";
import type { JournalEntry } from "@/types/app";

export function JournalEntryDetailModal({
  entry,
  onClose
}: {
  entry: JournalEntry;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<JournalEntryDetail | null>(null);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setDetail(null);
    setError("");

    void getJournalEntryDetail(entry.id, controller.signal)
      .then(setDetail)
      .catch((loadError: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Không thể tải thông tin món ăn."
        );
      });

    return () => controller.abort();
  }, [entry.id, reloadKey]);

  const sourceLabel =
    detail?.source === "kitchen"
      ? "Bếp đối tác"
      : detail?.source === "recipe"
        ? "Kế hoạch cá nhân"
        : entry.source;

  return (
    <Modal labelledBy="journal-entry-detail-title" onClose={onClose} wide>
      <div className="journal-detail">
        <div className="journal-detail__hero">
          <Image
            alt={entry.name}
            fill
            sizes="760px"
            src={resolveFigmaMealImage(entry.name, detail?.image_path)}
          />
          <button
            aria-label="Đóng chi tiết món ăn"
            className="modal-close modal-close--image"
            onClick={onClose}
            type="button"
          >
            <X size={20} />
          </button>
          <div className="journal-detail__hero-content">
            <span>{sourceLabel} · {entry.slot} · {entry.time}</span>
            <h2 id="journal-entry-detail-title">{entry.name}</h2>
          </div>
        </div>

        {!detail && !error ? (
          <div className="journal-detail__state">
            <LoaderCircle className="spin" size={25} />
            <strong>Đang tải thông tin món ăn…</strong>
          </div>
        ) : error ? (
          <div className="journal-detail__state journal-detail__state--error">
            <AlertCircle size={24} />
            <strong>{error}</strong>
            <button
              className="button button--outline"
              onClick={() => setReloadKey((key) => key + 1)}
              type="button"
            >
              <RefreshCw size={16} /> Tải lại
            </button>
          </div>
        ) : detail ? (
          <div className="journal-detail__content">
            {detail.description ? (
              <p className="journal-detail__description">{detail.description}</p>
            ) : null}

            <div className="nutrition-strip journal-detail__nutrition">
              <Metric label="Năng lượng" value={`${detail.calories_kcal}`} unit="kcal" />
              <Metric label="Protein" value={`${detail.protein_g}`} unit="g" />
              <Metric label="Carbs" value={`${detail.carbs_g}`} unit="g" />
              <Metric label="Chất béo" value={`${detail.fat_g}`} unit="g" />
            </div>

            <div className={`journal-detail__grid ${detail.instructions.length === 0 ? "journal-detail__grid--single" : ""}`}>
              <section>
                <div className="journal-detail__section-title">
                  <ChefHat size={19} />
                  <div>
                    <span>THÀNH PHẦN MÓN ĂN</span>
                    <small>{detail.servings} khẩu phần đã ghi</small>
                  </div>
                </div>
                {detail.ingredients.length > 0 ? (
                  <ul className="check-list journal-detail__ingredients">
                    {detail.ingredients.map((ingredient, index) => (
                      <li key={`${index}-${ingredient}`}>
                        <Check size={16} /> {ingredient}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="journal-detail__empty">
                    Món này chưa có danh sách thành phần chi tiết.
                  </p>
                )}
              </section>

              {detail.instructions.length > 0 ? (
                <section>
                  <div className="journal-detail__section-title">
                    <ChefHat size={19} />
                    <div><span>CÁCH CHUẨN BỊ</span></div>
                  </div>
                  <ol className="step-list">
                    {detail.instructions.map((instruction, index) => (
                      <li key={`${index}-${instruction}`}>
                        <span>{index + 1}</span><p>{instruction}</p>
                      </li>
                    ))}
                  </ol>
                  {detail.cooking_tips ? (
                    <p className="recipe-note"><strong>Mẹo:</strong> {detail.cooking_tips}</p>
                  ) : null}
                </section>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="modal-actions">
          <button className="button button--outline" onClick={onClose} type="button">
            Đóng
          </button>
        </div>
      </div>
    </Modal>
  );
}
