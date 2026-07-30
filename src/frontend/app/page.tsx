import type { Metadata } from "next";
import { LandingPage } from "@/features/landing/landing-page";

export const metadata: Metadata = {
  title: "NutriPlan — Dinh dưỡng cá nhân hóa",
  description:
    "Phân tích sức khỏe, thực đơn cá nhân và bếp đối tác trong một nền tảng."
};

export default function Landing() {
  return <LandingPage />;
}
