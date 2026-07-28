"use client";

import { ChevronDown, Edit3, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Modal } from "@/components/ui/modal";
import type { Profile } from "@/types/app";
import { fetchAllergens, fetchDietTypes, fetchIngredients } from "@/features/onboarding/onboarding.service";

interface OptionItem {
  code: string;
  name: string;
}

const DEFAULT_ALLERGEN_OPTIONS: OptionItem[] = [
  { code: "peanut", name: "Đậu phộng" },
  { code: "tree_nut", name: "Hạt cây" },
  { code: "milk", name: "Sữa" },
  { code: "egg", name: "Trứng" },
  { code: "soy", name: "Đậu nành" },
  { code: "wheat", name: "Lúa mì" },
  { code: "fish", name: "Cá" },
  { code: "shellfish", name: "Hải sản" },
];

const DEFAULT_DIET_OPTIONS: OptionItem[] = [
  { code: "standard", name: "Tiêu chuẩn" },
  { code: "vegetarian", name: "Ăn chay thanh đạm" },
  { code: "vegan", name: "Ăn chay thuần (Vegan)" },
  { code: "keto", name: "Keto / Low-Carb" },
  { code: "paleo", name: "Paleo" },
  { code: "gluten_free", name: "Không Gluten" },
];

const DEFAULT_INGREDIENT_OPTIONS: OptionItem[] = [
  { code: "uc_ga", name: "Ức gà" },
  { code: "thit_bo", name: "Thịt bò" },
  { code: "tom_tuoi", name: "Tôm tươi" },
  { code: "ca_hoi", name: "Cá hồi" },
  { code: "trung_ga", name: "Trứng gà" },
  { code: "dau_phu", name: "Đậu phụ" },
  { code: "gao_lut", name: "Gạo lứt" },
  { code: "yen_mach", name: "Yến mạch" },
  { code: "khoai_lang", name: "Khoai lang" },
  { code: "bong_cai_xanh", name: "Bông cải xanh" },
  { code: "rau_bina", name: "Rau bina" },
  { code: "bo_qua", name: "Bơ quả" },
];

// Multi-select Option Menu Component
function MultiSelectOptionMenu({
  label,
  options,
  selectedValues,
  onChange,
  placeholder = "Chọn các tùy chọn...",
}: {
  label: string;
  options: OptionItem[];
  selectedValues: string[];
  onChange: (nextValues: string[]) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const isSelected = (opt: OptionItem) => {
    return selectedValues.some(
      (v) =>
        v.toLowerCase() === opt.code.toLowerCase() ||
        v.toLowerCase() === opt.name.toLowerCase()
    );
  };

  const toggleOption = (opt: OptionItem) => {
    const checked = isSelected(opt);
    const next = checked
      ? selectedValues.filter(
          (v) =>
            v.toLowerCase() !== opt.code.toLowerCase() &&
            v.toLowerCase() !== opt.name.toLowerCase()
        )
      : [...selectedValues, opt.name];
    onChange(next);
  };

  const removeValue = (val: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedValues.filter((v) => v.toLowerCase() !== val.toLowerCase()));
  };

  return (
    <div className="multi-select-container" ref={containerRef}>
      <span className="form-label--compact">{label}</span>
      <div
        className={`multi-select-box${open ? " multi-select-box--open" : ""}`}
        onClick={() => setOpen(!open)}
      >
        <div className="multi-select-selected-list">
          {selectedValues.length > 0 ? (
            selectedValues.map((val) => {
              const matched = options.find(
                (o) =>
                  o.code.toLowerCase() === val.toLowerCase() ||
                  o.name.toLowerCase() === val.toLowerCase()
              );
              const displayName = matched ? matched.name : val;
              return (
                <span key={val} className="multi-select-badge">
                  {displayName}
                  <button
                    type="button"
                    className="multi-select-badge-remove"
                    onClick={(e) => removeValue(val, e)}
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })
          ) : (
            <span className="multi-select-placeholder">{placeholder}</span>
          )}
        </div>
        <ChevronDown size={16} className={`multi-select-arrow${open ? " multi-select-arrow--open" : ""}`} />
      </div>

      {open && (
        <div className="multi-select-dropdown">
          {options.map((opt) => {
            const checked = isSelected(opt);
            return (
              <div
                key={opt.code}
                className={`multi-select-option${checked ? " multi-select-option--checked" : ""}`}
                onClick={() => toggleOption(opt)}
              >
                <input type="checkbox" checked={checked} readOnly />
                <span>{opt.name}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ProfileModal({
  value,
  onClose,
  onSave,
}: {
  value: Profile;
  onClose: () => void;
  onSave: (value: Profile) => void;
}) {
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [form, setForm] = useState(value);
  const [allergenList, setAllergenList] = useState<OptionItem[]>(DEFAULT_ALLERGEN_OPTIONS);
  const [dietList, setDietList] = useState<OptionItem[]>(DEFAULT_DIET_OPTIONS);
  const [ingredientList, setIngredientList] = useState<OptionItem[]>(DEFAULT_INGREDIENT_OPTIONS);

  useEffect(() => {
    setForm(value);
  }, [value]);

  useEffect(() => {
    fetchAllergens()
      .then((items) => {
        if (Array.isArray(items) && items.length > 0) {
          setAllergenList(items.map((a) => ({ code: a.code, name: a.name })));
        }
      })
      .catch(() => {});

    fetchDietTypes()
      .then((items) => {
        if (Array.isArray(items) && items.length > 0) {
          setDietList(items.map((d) => ({ code: d.code, name: d.name })));
        }
      })
      .catch(() => {});

    fetchIngredients()
      .then((items) => {
        if (Array.isArray(items) && items.length > 0) {
          setIngredientList(
            items.map((i) => ({
              code: i.normalized_name,
              name: i.name,
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  const update = <K extends keyof Profile>(key: K, next: Profile[K]) =>
    setForm((current) => ({ ...current, [key]: next }));

  const activityLabels: Record<number, string> = {
    1.2: "Ít vận động",
    1.375: "Nhẹ · 1–3 buổi/tuần",
    1.55: "Vừa · 3–5 buổi/tuần",
    1.725: "Cao · 6–7 buổi/tuần",
  };

  const goalLabels: Record<Profile["goal"], string> = {
    lose: "Giảm mỡ lành mạnh",
    maintain: "Duy trì cân nặng",
    gain: "Tăng cơ",
  };

  // Extract selected array values
  const selectedAllergies = form.allergies
    ? form.allergies.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const selectedDiets = Array.isArray(form.dietaryPreferences) ? form.dietaryPreferences : [];
  const selectedLikedFoods = Array.isArray(form.likedFoods) ? form.likedFoods : [];

  return (
    <Modal wide onClose={onClose}>
      <div className="profile-landscape-layout">
        {/* Left Column: Info / Form */}
        <div className="profile-landscape-left">
          <div className="modal-header modal-header--compact">
            <div>
              <h2>{mode === "view" ? `Thông tin tài khoản (${value.name})` : `Chỉnh sửa thông tin (${value.name})`}</h2>
            </div>
            <button type="button" className="modal-close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          {mode === "view" ? (
            <div className="profile-view-content">
              <div className="profile-info-grid">
                <div className="profile-info-item">
                  <span className="profile-info-label">Giới tính</span>
                  <span className="profile-info-val">
                    {value.gender === "female" ? "Nữ" : "Nam"}
                  </span>
                </div>
                <div className="profile-info-item">
                  <span className="profile-info-label">Tuổi</span>
                  <span className="profile-info-val">{value.age} tuổi</span>
                </div>
                <div className="profile-info-item">
                  <span className="profile-info-label">Chiều cao</span>
                  <span className="profile-info-val">{value.height} cm</span>
                </div>
                <div className="profile-info-item">
                  <span className="profile-info-label">Cân nặng</span>
                  <span className="profile-info-val">{value.weight} kg</span>
                </div>
                <div className="profile-info-item profile-info-item--full">
                  <span className="profile-info-label">Mức vận động</span>
                  <span className="profile-info-val">
                    {activityLabels[value.activity] || `${value.activity}`}
                  </span>
                </div>
                <div className="profile-info-item profile-info-item--full">
                  <span className="profile-info-label">Mục tiêu dinh dưỡng</span>
                  <span className="profile-info-val">
                    {goalLabels[value.goal] || value.goal}
                  </span>
                </div>
                <div className="profile-info-item profile-info-item--full">
                  <span className="profile-info-label">Chế độ ăn ưa thích</span>
                  <div className="allergen-tag-list">
                    {selectedDiets.length > 0 ? (
                      selectedDiets.map((code) => {
                        const matched = dietList.find((d) => d.code === code || d.name === code);
                        return (
                          <span key={code} className="allergen-tag">
                            {matched ? matched.name : code}
                          </span>
                        );
                      })
                    ) : (
                      <span className="profile-info-val">Tiêu chuẩn (Không hạn chế)</span>
                    )}
                  </div>
                </div>
                <div className="profile-info-item profile-info-item--full">
                  <span className="profile-info-label">Thực phẩm ưa thích</span>
                  <div className="allergen-tag-list">
                    {selectedLikedFoods.length > 0 ? (
                      selectedLikedFoods.map((item, idx) => (
                        <span key={idx} className="allergen-tag">
                          {item}
                        </span>
                      ))
                    ) : (
                      <span className="profile-info-val">Chưa khai báo</span>
                    )}
                  </div>
                </div>
                <div className="profile-info-item profile-info-item--full">
                  <span className="profile-info-label">Dị ứng & Né tránh thực phẩm</span>
                  <div className="allergen-tag-list">
                    {selectedAllergies.length > 0 ? (
                      selectedAllergies.map((item, idx) => (
                        <span key={idx} className="allergen-tag">
                          {item}
                        </span>
                      ))
                    ) : (
                      <span className="profile-info-val">Chưa khai báo (Không có)</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-actions modal-actions--compact">
                <button type="button" className="button button--outline button--small" onClick={onClose}>
                  Đóng
                </button>
                <button
                  type="button"
                  className="button button--dark button--small"
                  onClick={() => setMode("edit")}
                >
                  <Edit3 size={15} /> Chỉnh sửa tài khoản
                </button>
              </div>
            </div>
          ) : (
            <form
              className="profile-edit-content"
              onSubmit={(event) => {
                event.preventDefault();
                onSave(form);
                setMode("view");
              }}
            >
              <div className="form-stack form-stack--compact">
                <label className="form-label--compact">
                  Họ tên
                  <input
                    value={form.name}
                    onChange={(event) => update("name", event.target.value)}
                    required
                  />
                </label>
                <div className="form-grid">
                  <label className="form-label--compact">
                    Giới tính
                    <select
                      value={form.gender}
                      onChange={(event) =>
                        update("gender", event.target.value as Profile["gender"])
                      }
                    >
                      <option value="female">Nữ</option>
                      <option value="male">Nam</option>
                    </select>
                  </label>
                  <label className="form-label--compact">
                    Tuổi
                    <input
                      type="number"
                      value={form.age}
                      onChange={(event) => update("age", Number(event.target.value))}
                      min={16}
                      max={80}
                    />
                  </label>
                </div>
                <div className="form-grid">
                  <label className="form-label--compact">
                    Chiều cao (cm)
                    <input
                      type="number"
                      value={form.height}
                      onChange={(event) => update("height", Number(event.target.value))}
                      min={80}
                      max={250}
                    />
                  </label>
                  <label className="form-label--compact">
                    Cân nặng (kg)
                    <input
                      type="number"
                      value={form.weight}
                      onChange={(event) => update("weight", Number(event.target.value))}
                      min={20}
                      max={400}
                      step="0.1"
                    />
                  </label>
                </div>
                <div className="form-grid">
                  <label className="form-label--compact">
                    Mức vận động
                    <select
                      value={form.activity}
                      onChange={(event) => update("activity", Number(event.target.value))}
                    >
                      <option value={1.2}>Ít vận động</option>
                      <option value={1.375}>Nhẹ · 1–3 buổi/tuần</option>
                      <option value={1.55}>Vừa · 3–5 buổi/tuần</option>
                      <option value={1.725}>Cao · 6–7 buổi/tuần</option>
                    </select>
                  </label>
                  <label className="form-label--compact">
                    Mục tiêu
                    <select
                      value={form.goal}
                      onChange={(event) =>
                        update("goal", event.target.value as Profile["goal"])
                      }
                    >
                      <option value="lose">Giảm mỡ lành mạnh</option>
                      <option value="maintain">Duy trì cân nặng</option>
                      <option value="gain">Tăng cơ</option>
                    </select>
                  </label>
                </div>

                {/* Option Menu: Chế độ ăn ưa thích */}
                <MultiSelectOptionMenu
                  label="Chế độ ăn ưa thích"
                  options={dietList}
                  selectedValues={selectedDiets}
                  onChange={(next) => update("dietaryPreferences", next)}
                  placeholder="Chọn chế độ ăn ưa thích..."
                />

                {/* Option Menu: Thực phẩm ưa thích */}
                <MultiSelectOptionMenu
                  label="Thực phẩm ưa thích"
                  options={ingredientList}
                  selectedValues={selectedLikedFoods}
                  onChange={(next) => update("likedFoods", next)}
                  placeholder="Chọn thực phẩm ưa thích..."
                />

                {/* Option Menu: Dị ứng & Né tránh thực phẩm */}
                <MultiSelectOptionMenu
                  label="Dị ứng & Né tránh thực phẩm"
                  options={allergenList}
                  selectedValues={selectedAllergies}
                  onChange={(next) => update("allergies", next.join(", "))}
                  placeholder="Chọn thực phẩm dị ứng..."
                />
              </div>

              <div className="modal-actions modal-actions--compact">
                <button
                  type="button"
                  className="button button--outline button--small"
                  onClick={() => setMode("view")}
                >
                  Hủy
                </button>
                <button className="button button--dark button--small" type="submit">
                  Lưu thay đổi
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Low opacity vertical line divider */}
        <div className="profile-landscape-divider" />

        {/* Right Column: Profile graphic image */}
        <div className="profile-landscape-right">
          <img
            src="/assets/profile.png"
            alt="Profile Illustration"
            className="profile-landscape-img"
          />
        </div>
      </div>
    </Modal>
  );
}





