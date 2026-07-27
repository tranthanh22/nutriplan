"use client";

import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

interface NavButtonsProps {
  onBack?: () => void;
  onContinue: () => void;
  continueLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  hideBack?: boolean;
}

export function NavButtons({
  onBack,
  onContinue,
  continueLabel = "Tiếp tục",
  loading = false,
  disabled = false,
  hideBack = false,
}: NavButtonsProps) {
  return (
    <div className="ob-nav-buttons">
      {!hideBack && onBack ? (
        <button className="ob-btn-back" onClick={onBack} type="button">
          <ArrowLeft size={16} />
          Quay lại
        </button>
      ) : (
        <span />
      )}
      <button
        className="ob-btn-continue"
        onClick={onContinue}
        type="button"
        disabled={disabled || loading}
      >
        {loading ? (
          <>
            <Loader2 size={16} className="ob-spin" />
            Vui lòng chờ…
          </>
        ) : (
          <>
            {continueLabel}
            <ArrowRight size={16} />
          </>
        )}
      </button>
    </div>
  );
}
