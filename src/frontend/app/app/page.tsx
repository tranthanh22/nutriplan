import type { Metadata } from "next";
import { NutriPlanApp } from "@/components/nutriplan-app";

export const metadata: Metadata = {
  title: "Tổng quan | NutriPlan",
  description: "Màn hình quản lý dinh dưỡng cá nhân của NutriPlan."
};

export default function NutriPlanDashboardPage() {
  return <NutriPlanApp />;
}
