"use client";

import {
  Bot,
  ChefHat,
  CircleDollarSign,
  ClipboardList,
  LoaderCircle,
  RefreshCw,
  Salad,
  ShieldCheck,
  Store,
  UsersRound,
  WalletCards,
  XCircle
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AdminKitchenManagement } from "./admin-kitchen-management";
import { AdminSubscriptionAnalytics } from "./admin-subscription-analytics";
import {
  getAdminDashboard,
  getAdminKitchens,
  getAdminSubscriptionAnalytics,
  updateAdminKitchenStatus,
  type AdminDashboardResponse,
  type AdminKitchen,
  type AdminKitchensResponse,
  type AdminSubscriptionAnalyticsResponse,
  type KitchenOrderStatus
} from "./management-api";

const statusLabels: Record<KitchenOrderStatus, string> = {
  pending_payment: "Chờ thanh toán",
  paid: "Đã thanh toán",
  confirmed: "Đã xác nhận",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
  refunded: "Đã hoàn tiền"
};

function formatMoney(value: number | string) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(Number(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardResponse | null>(null);
  const [kitchensData, setKitchensData] = useState<AdminKitchensResponse | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<AdminSubscriptionAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [updatingKitchenId, setUpdatingKitchenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [dashboard, kitchens, subscriptions] = await Promise.all([
        getAdminDashboard(),
        getAdminKitchens(),
        getAdminSubscriptionAnalytics()
      ]);
      setData(dashboard);
      setKitchensData(kitchens);
      setSubscriptionData(subscriptions);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể tải thống kê.");
    } finally {
      setLoading(false);
    }
  }, []);

  const changeKitchenStatus = useCallback(async (
    kitchen: AdminKitchen,
    status: "active" | "suspended"
  ) => {
    setUpdatingKitchenId(kitchen.id);
    setError("");
    setNotice("");
    try {
      await updateAdminKitchenStatus(kitchen.id, status);
      const [dashboard, kitchens] = await Promise.all([
        getAdminDashboard(),
        getAdminKitchens()
      ]);
      setData(dashboard);
      setKitchensData(kitchens);
      setNotice(status === "suspended"
        ? `Đã tạm ngưng ${kitchen.name}. Bếp không thể nhận đơn mới.`
        : `Đã cho phép ${kitchen.name} hoạt động trở lại.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể cập nhật nhà bếp.");
    } finally {
      setUpdatingKitchenId(null);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const metrics = data?.metrics;

  return (
    <div className="page-content management-page admin-page">
      <header className="management-heading">
        <div><span className="section-kicker">QUẢN TRỊ HỆ THỐNG</span><h1>Tổng quan NutriPlan</h1><p>Thống kê khách hàng, đối tác bếp, doanh thu và mức sử dụng sản phẩm.</p></div>
        <button className="button button--outline" onClick={() => void load()} disabled={loading}><RefreshCw className={loading ? "spin" : ""} size={18} /> Làm mới</button>
      </header>

      {error ? <div className="management-alert" role="alert"><XCircle size={19} />{error}</div> : null}
      {notice ? <div className="management-notice" role="status"><ShieldCheck size={19} />{notice}</div> : null}

      {loading && !data ? (
        <div className="management-state management-state--page"><LoaderCircle className="spin" /><span>Đang tổng hợp dữ liệu hệ thống…</span></div>
      ) : (
        <>
          <section className="admin-metrics">
            <AdminMetric icon={<UsersRound />} label="Khách hàng" value={metrics?.customers ?? 0} />
            <AdminMetric icon={<Store />} label="Tổng số bếp" value={metrics?.kitchens ?? 0} detail={`${metrics?.activeKitchens ?? 0} đang hoạt động`} />
            <AdminMetric icon={<WalletCards />} label="Gói Plus đang hoạt động" value={metrics?.activeSubscriptions ?? 0} />
            <AdminMetric icon={<ClipboardList />} label="Đơn hàng bếp" value={metrics?.kitchenOrders ?? 0} />
            <AdminMetric icon={<CircleDollarSign />} label="Doanh thu bếp" value={formatMoney(metrics?.kitchenRevenue ?? 0)} />
            <AdminMetric icon={<Salad />} label="Bữa ăn đã ghi" value={metrics?.mealLogs ?? 0} />
            <AdminMetric icon={<Bot />} label="AI Insight hoàn tất" value={metrics?.aiInsights ?? 0} />
            <AdminMetric icon={<ChefHat />} label="Tỷ lệ bếp hoạt động" value={metrics?.kitchens ? `${Math.round((metrics.activeKitchens / metrics.kitchens) * 100)}%` : "0%"} />
          </section>

          {subscriptionData ? <AdminSubscriptionAnalytics data={subscriptionData} /> : null}

          {kitchensData ? (
            <AdminKitchenManagement
              data={kitchensData}
              updatingKitchenId={updatingKitchenId}
              onStatusChange={changeKitchenStatus}
            />
          ) : null}

          <section className="management-panel admin-recent-orders">
            <div className="management-panel__heading"><div><span className="section-kicker">HOẠT ĐỘNG GẦN ĐÂY</span><h2>Đơn hàng mới nhất</h2></div><small>{data?.generatedAt ? `Cập nhật ${formatDate(data.generatedAt)}` : ""}</small></div>
            {(data?.recentOrders ?? []).length === 0 ? (
              <div className="management-state"><ClipboardList /><strong>Chưa có đơn hàng</strong></div>
            ) : (
              <div className="admin-order-table-wrap">
                <table className="admin-order-table">
                  <thead><tr><th>Mã đơn</th><th>Khách hàng</th><th>Nhà bếp</th><th>Trạng thái</th><th>Giá trị</th><th>Thời gian</th></tr></thead>
                  <tbody>{data?.recentOrders.map((order) => <tr key={order.id}><td><strong>{order.order_number}</strong></td><td>{order.customerName}</td><td>{order.kitchens?.name ?? "—"}</td><td><span className={`order-status order-status--${order.status}`}>{statusLabels[order.status]}</span></td><td>{formatMoney(order.total_amount)}</td><td>{formatDate(order.created_at)}</td></tr>)}</tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function AdminMetric({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string | number; detail?: string }) {
  return <article className="admin-metric"><span>{icon}</span><div><small>{label}</small><strong>{value}</strong>{detail ? <p>{detail}</p> : null}</div></article>;
}
