"use client";

import Image from "next/image";
import { Check, ImagePlus, Minus, Plus, Sparkles, WandSparkles, X } from "lucide-react";
import { type ChangeEvent, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Metric } from "@/components/ui/nutrition-widgets";
import type { JournalEntry } from "@/types/app";

export function ImageAnalysisModal({
  onClose,
  onConfirm
}: {
  onClose: () => void;
  onConfirm: (entry: JournalEntry) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(false);
  const [portion, setPortion] = useState(1);

  const onFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setPreview(url);
    setAnalyzing(true);
    setResult(false);
    window.setTimeout(() => {
      setAnalyzing(false);
      setResult(true);
    }, 1500);
  };

  const entry: JournalEntry = {
    id: `scan-${Date.now()}`,
    name: "Cơm gà rau củ (ước tính)",
    slot: "Bữa được quét",
    calories: Math.round(568 * portion),
    protein: Math.round(41 * portion),
    carbs: Math.round(64 * portion),
    fat: Math.round(17 * portion),
    source: "Ảnh ước tính",
    time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    image: preview || undefined
  };

  return (
    <Modal onClose={onClose}>
      <div className="modal-header">
        <div><span className="section-kicker">MEAL SCAN BETA</span><h2>Phân tích ảnh món ăn</h2></div>
        <button className="modal-close" onClick={onClose}><X size={19} /></button>
      </div>
      {!preview ? (
        <label className="upload-zone">
          <input type="file" accept="image/*" onChange={onFile} />
          <span className="upload-zone__icon"><ImagePlus size={28} /></span>
          <h3>Tải ảnh bữa ăn hôm nay</h3>
          <p>Ảnh rõ, đủ sáng và chụp từ trên xuống sẽ cho kết quả tốt hơn.</p>
          <span className="button button--outline">Chọn ảnh</span>
        </label>
      ) : (
        <div className="analysis-workspace">
          <div className="analysis-image">
            <Image src={preview} alt="Món ăn cần phân tích" fill sizes="(max-width: 580px) 100vw, 280px" unoptimized />
            {analyzing && (
              <div className="analysis-loading"><WandSparkles size={25} /><strong>Đang nhận diện món...</strong><span>So khớp với thư viện dinh dưỡng</span></div>
            )}
          </div>
          {result && (
            <div className="analysis-result">
              <div className="confidence"><span>Độ tin cậy</span><strong>82%</strong></div>
              <label>Tên món<input defaultValue="Cơm gà rau củ" /></label>
              <div className="quantity-line">
                <span>Khẩu phần ước tính</span>
                <div>
                  <button onClick={() => setPortion((value) => Math.max(0.5, value - 0.25))}><Minus size={16} /></button>
                  <strong>{portion} phần</strong>
                  <button onClick={() => setPortion((value) => Math.min(2, value + 0.25))}><Plus size={16} /></button>
                </div>
              </div>
              <div className="nutrition-strip nutrition-strip--compact">
                <Metric label="Kcal" value={`${entry.calories}`} unit="" />
                <Metric label="Đạm" value={`${entry.protein}`} unit="g" />
                <Metric label="Carbs" value={`${entry.carbs}`} unit="g" />
                <Metric label="Béo" value={`${entry.fat}`} unit="g" />
              </div>
              <div className="estimate-note"><Sparkles size={17} /><span>Đây là số liệu ước tính. Hãy sửa món hoặc khẩu phần trước khi xác nhận.</span></div>
            </div>
          )}
        </div>
      )}
      <div className="modal-actions">
        <button className="button button--outline" onClick={onClose}>Hủy</button>
        {result && <button className="button button--dark" onClick={() => onConfirm(entry)}><Check size={17} /> Xác nhận và lưu</button>}
      </div>
    </Modal>
  );
}
