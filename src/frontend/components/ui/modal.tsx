import type { ReactNode } from "react";

export function Modal({
  children,
  onClose,
  wide = false,
  extraWide = false
}: {
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
  extraWide?: boolean;
}) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
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
