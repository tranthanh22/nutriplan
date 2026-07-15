import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NutriPlan — Ăn đúng mục tiêu",
  description: "MVP lập kế hoạch dinh dưỡng cá nhân và đặt món từ bếp đối tác."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
