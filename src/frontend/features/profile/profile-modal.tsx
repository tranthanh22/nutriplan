"use client";

import { ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import type { Profile } from "@/types/app";

export function ProfileModal({
  value,
  onClose,
  onSave
}: {
  value: Profile;
  onClose: () => void;
  onSave: (value: Profile) => void;
}) {
  const [form, setForm] = useState(value);
  const update = <K extends keyof Profile>(key: K, next: Profile[K]) =>
    setForm((current) => ({ ...current, [key]: next }));

  return (
    <Modal onClose={onClose}>
      <form onSubmit={(event) => { event.preventDefault(); onSave(form); }}>
        <div className="modal-header">
          <div><span className="section-kicker">HỒ SƠ DINH DƯỠNG</span><h2>Cập nhật chỉ số</h2></div>
          <button type="button" className="modal-close" onClick={onClose}><X size={19} /></button>
        </div>
        <div className="form-stack">
          <label>Họ tên<input value={form.name} onChange={(event) => update("name", event.target.value)} required /></label>
          <div className="form-grid">
            <label>Giới tính<select value={form.gender} onChange={(event) => update("gender", event.target.value as Profile["gender"])}><option value="female">Nữ</option><option value="male">Nam</option></select></label>
            <label>Tuổi<input type="number" value={form.age} onChange={(event) => update("age", Number(event.target.value))} min={16} max={80} /></label>
          </div>
          <div className="form-grid">
            <label>Chiều cao (cm)<input type="number" value={form.height} onChange={(event) => update("height", Number(event.target.value))} min={80} max={250} /></label>
            <label>Cân nặng (kg)<input type="number" value={form.weight} onChange={(event) => update("weight", Number(event.target.value))} min={20} max={400} step="0.1" /></label>
          </div>
          <label>Mức vận động<select value={form.activity} onChange={(event) => update("activity", Number(event.target.value))}><option value={1.2}>Ít vận động</option><option value={1.375}>Nhẹ · 1–3 buổi/tuần</option><option value={1.55}>Vừa · 3–5 buổi/tuần</option><option value={1.725}>Cao · 6–7 buổi/tuần</option></select></label>
          <label>Mục tiêu<select value={form.goal} onChange={(event) => update("goal", event.target.value as Profile["goal"])}><option value="lose">Giảm mỡ lành mạnh</option><option value="maintain">Duy trì cân nặng</option><option value="gain">Tăng cơ</option></select></label>
          <label>Dị ứng thực phẩm<input value={form.allergies} onChange={(event) => update("allergies", event.target.value)} /></label>
          <div className="medical-note"><ShieldCheck size={18} /><span>Kết quả chỉ hỗ trợ lập kế hoạch, không thay thế tư vấn y khoa.</span></div>
        </div>
        <div className="modal-actions">
          <button type="button" className="button button--outline" onClick={onClose}>Hủy</button>
          <button className="button button--dark" type="submit">Lưu và tính lại</button>
        </div>
      </form>
    </Modal>
  );
}
