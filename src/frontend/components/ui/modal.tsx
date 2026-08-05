"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";

export function Modal({
  children,
  onClose,
  labelledBy,
  wide = false,
  extraWide = false
}: {
  children: ReactNode;
  onClose: () => void;
  labelledBy?: string;
  wide?: boolean;
  extraWide?: boolean;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        aria-labelledby={labelledBy}
        aria-modal="true"
        className={`modal ${wide ? "modal--wide" : ""} ${extraWide ? "modal--extra-wide" : ""}`}
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        {children}
      </div>
    </div>
  );
}
