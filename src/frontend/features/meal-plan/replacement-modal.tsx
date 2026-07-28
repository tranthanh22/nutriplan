"use client";

import Image from "next/image";
import { AlertCircle, Check, LoaderCircle, RefreshCw, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import {
  getReplacementCandidates,
  replacePersonalMeal
} from "./meal-plan-api";
import type { PersonalMealItem, ReplacementCandidate } from "./meal-plan-types";

export function ReplacementModal({
  item,
  onClose,
  onReplaced
}: {
  item: PersonalMealItem;
  onClose: () => void;
  onReplaced: () => void;
}) {
  const [candidates, setCandidates] = useState<ReplacementCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [replacingId, setReplacingId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void getReplacementCandidates(item.id)
      .then((data) => {
        if (!cancelled) setCandidates(data);
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Không thể tải món thay thế."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [item.id]);

  async function selectCandidate(candidate: ReplacementCandidate) {
    setReplacingId(candidate.dish_id);
    setError("");
    try {
      await replacePersonalMeal(item.id, candidate.dish_id);
      onReplaced();
    } catch (replaceError) {
      setError(
        replaceError instanceof Error
          ? replaceError.message
          : "Không thể đổi món."
      );
      setReplacingId("");
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="replacement-modal">
        <button className="modal-close" aria-label="Đóng" onClick={onClose}>
          <X size={19} />
        </button>
        <span className="section-kicker">ĐỔI MÓN AN TOÀN</span>
        <h2>Thay “{item.dishes.name}”</h2>
        <p>
          Chỉ hiển thị món cùng loại bữa, không xung đột dị ứng và vẫn giữ
          tổng dinh dưỡng ngày trong miền mục tiêu.
        </p>

        {loading && (
          <div className="replacement-state">
            <LoaderCircle className="spin" />
            Đang tính lại dinh dưỡng cả ngày…
          </div>
        )}
        {error && (
          <div className="subscription-error">
            <AlertCircle size={17} />
            <span>{error}</span>
          </div>
        )}
        {!loading && !error && candidates.length === 0 && (
          <div className="replacement-state">
            <RefreshCw />
            Hiện chưa có món thay thế nào giữ đủ mục tiêu dinh dưỡng ngày.
          </div>
        )}
        <div className="replacement-list">
          {candidates.map((candidate) => (
            <article className="replacement-option" key={candidate.dish_id}>
              <div className="replacement-option__image">
                {candidate.image_path ? (
                  <Image
                    src={candidate.image_path}
                    alt={candidate.name}
                    fill
                    sizes="100px"
                  />
                ) : null}
              </div>
              <div>
                <span className="status-pill">
                  <span /> Cân bằng {candidate.balance_score}%
                </span>
                <h3>{candidate.name}</h3>
                <p>{candidate.short_description}</p>
                <small>
                  {Math.round(Number(candidate.calories_kcal))} kcal · P{" "}
                  {Math.round(Number(candidate.protein_g))}g · C{" "}
                  {Math.round(Number(candidate.carbs_g))}g · F{" "}
                  {Math.round(Number(candidate.fat_g))}g
                </small>
              </div>
              <button
                className="button button--dark button--small"
                disabled={Boolean(replacingId)}
                onClick={() => void selectCandidate(candidate)}
              >
                {replacingId === candidate.dish_id ? (
                  <LoaderCircle className="spin" size={16} />
                ) : (
                  <Check size={16} />
                )}
                Chọn
              </button>
            </article>
          ))}
        </div>
      </div>
    </Modal>
  );
}
