"use client";

import type { ReactNode } from "react";

interface SplitLayoutProps {
  imageSrc: string;
  imageAlt: string;
  children: ReactNode;
}

export function SplitLayout({ imageSrc, imageAlt, children }: SplitLayoutProps) {
  return (
    <div className="ob-split">
      {/* Left column — illustration */}
      <div className="ob-split__image-col">
        <img src={imageSrc} alt={imageAlt} className="ob-split__illustration" />
      </div>

      {/* Right column — form content */}
      <div className="ob-split__form-col">{children}</div>
    </div>
  );
}
