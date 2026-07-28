"use client";

import { useEffect, useRef } from "react";
import { LogOut, UserRound } from "lucide-react";

export function AccountMenu({
  onOpenProfile,
  onLogout,
  onClose,
}: {
  onOpenProfile: () => void;
  onLogout: () => void;
  onClose: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="account-menu" ref={menuRef} role="menu" aria-label="Tùy chọn tài khoản">
      <button
        className="account-menu__item"
        role="menuitem"
        onClick={() => { onClose(); onOpenProfile(); }}
      >
        <UserRound size={16} />
        <span>Thông tin tài khoản</span>
      </button>
      <div className="account-menu__divider" />
      <button
        className="account-menu__item account-menu__item--danger"
        role="menuitem"
        onClick={() => { onClose(); onLogout(); }}
      >
        <LogOut size={16} />
        <span>Đăng xuất</span>
      </button>
    </div>
  );
}
