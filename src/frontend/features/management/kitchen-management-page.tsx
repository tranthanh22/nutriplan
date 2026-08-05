"use client";

import {
  CheckCircle2,
  ChefHat,
  CircleDollarSign,
  ClipboardList,
  CalendarDays,
  LoaderCircle,
  PackageCheck,
  RefreshCw,
  Search,
  ShieldAlert,
  Soup,
  XCircle
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getKitchenDashboard,
  updateManagedOrderStatus,
  type KitchenDashboardResponse,
  type KitchenOrderStatus,
  type ManagedOrder
} from "./management-api";
import { KitchenPackageManager } from "./kitchen-package-manager";

const statusLabels: Record<KitchenOrderStatus, string> = {
  pending_payment: "Chờ thanh toán",
  paid: "Đã thanh toán",
  confirmed: "Đã xác nhận",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
  refunded: "Đã hoàn tiền"
};

const statusOptions: Array<{ value: "all" | KitchenOrderStatus; label: string }> = [
  { value: "all", label: "Tất cả trạng thái" },
  ...Object.entries(statusLabels).map(([value, label]) => ({
    value: value as KitchenOrderStatus,
    label
  }))
];

function formatMoney(value: number | string) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(Number(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function deliveryAddress(order: ManagedOrder) {
  const address = order.delivery_address;
  return [address.line1, address.ward, address.district, address.city]
    .filter((part): part is string => typeof part === "string" && part.length > 0)
    .join(", ") || "Chưa có địa chỉ";
}

function offerTypeLabel(order: ManagedOrder) {
  if (!order.kitchen_offers) return "Gói không còn được bán";
  if (order.kitchen_offers.type === "single_meal") return "Món lẻ";
  return `Gói ${order.kitchen_offers.package_days ?? "nhiều"} ngày`;
}

function RequirementChips({
  items,
  emptyLabel,
  tone = "default"
}: {
  items: string[];
  emptyLabel: string;
  tone?: "default" | "warning";
}) {
  if (items.length === 0) return <span className="requirement-empty">{emptyLabel}</span>;
  return <div className={`requirement-chips requirement-chips--${tone}`}>{items.map((item) => <span key={item}>{item}</span>)}</div>;
}

export function KitchenManagementPage() {
  const [data, setData] = useState<KitchenDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | KitchenOrderStatus>("all");
  const [selectedOrderId, setSelectedOrderId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await getKitchenDashboard());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể tải đơn hàng.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const orders = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("vi");
    return (data?.orders ?? []).filter((order) => {
      const matchesStatus = status === "all" || order.status === status;
      const matchesQuery = !normalizedQuery || [
        order.order_number,
        order.recipient_name,
        order.recipient_phone,
        order.customer?.full_name ?? ""
      ].some((value) => value.toLocaleLowerCase("vi").includes(normalizedQuery));
      return matchesStatus && matchesQuery;
    });
  }, [data, query, status]);
  const selectedOrder = data?.orders.find((order) => order.id === selectedOrderId) ?? null;

  async function changeStatus(
    order: ManagedOrder,
    nextStatus: "confirmed" | "completed" | "cancelled"
  ) {
    setUpdatingId(order.id);
    setError("");
    try {
      await updateManagedOrderStatus(order.id, nextStatus);
      await load();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không thể cập nhật đơn.");
    } finally {
      setUpdatingId("");
    }
  }

  return (
    <div className="page-content management-page">
      <header className="management-heading">
        <div>
          <span className="section-kicker">DÀNH CHO ĐỐI TÁC</span>
          <h1>Quản lý đơn hàng nhà bếp</h1>
          <p>Theo dõi khách nhận món, gói đã đặt và cập nhật trạng thái xử lý.</p>
        </div>
        <button className="button button--outline" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={loading ? "spin" : ""} size={18} /> Làm mới
        </button>
      </header>

      {error ? <div className="management-alert" role="alert"><XCircle size={19} />{error}</div> : null}

      <section className="management-metrics">
        <Metric icon={<ClipboardList />} label="Tổng đơn" value={data?.summary.total ?? 0} />
        <Metric icon={<ChefHat />} label="Đang xử lý" value={data?.summary.confirmed ?? 0} />
        <Metric icon={<PackageCheck />} label="Hoàn thành" value={data?.summary.completed ?? 0} />
        <Metric icon={<CircleDollarSign />} label="Doanh thu hoàn tất" value={formatMoney(data?.summary.revenue ?? 0)} />
      </section>

      <section className="management-panel">
        <div className="management-filters">
          <label className="management-search">
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm mã đơn, tên hoặc số điện thoại…" />
          </label>
          <select value={status} onChange={(event) => setStatus(event.target.value as "all" | KitchenOrderStatus)} aria-label="Lọc theo trạng thái">
            {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>

        {loading && !data ? (
          <div className="management-state"><LoaderCircle className="spin" /><span>Đang tải đơn hàng…</span></div>
        ) : orders.length === 0 ? (
          <div className="management-state"><ClipboardList /><strong>Không có đơn phù hợp</strong><span>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</span></div>
        ) : (
          <div className="management-order-list">
            {orders.map((order) => (
              <article className="managed-order" key={order.id}>
                <div className="managed-order__head">
                  <div><strong>{order.order_number}</strong><span>{order.kitchens?.name ?? "Nhà bếp"} · {formatDate(order.created_at)}</span></div>
                  <span className={`order-status order-status--${order.status}`}>{statusLabels[order.status]}</span>
                </div>
                <div className="managed-order__body">
                  <div><small>Khách nhận</small><strong>{order.recipient_name}</strong><span>{order.recipient_phone}</span></div>
                  <div><small>Giao đến</small><strong>{deliveryAddress(order)}</strong><span>{order.delivery_note || "Không có ghi chú"}</span></div>
                  <div>
                    <small>Gói đã mua</small>
                    <strong>{order.kitchen_offers?.name ?? order.kitchen_order_items[0]?.item_name ?? "Gói bếp"}</strong>
                    <span>{offerTypeLabel(order)} · {order.fulfillment.total_meals || order.kitchen_order_items.length} bữa</span>
                    {order.fulfillment.total_meals > 0 ? <span>{order.fulfillment.delivered_meals}/{order.fulfillment.total_meals} bữa đã giao</span> : null}
                  </div>
                  <div><small>Tổng tiền</small><strong>{formatMoney(order.total_amount)}</strong><span>{order.customer?.full_name || "Tài khoản khách hàng"}</span></div>
                </div>
                <div className="managed-order__fulfillment">
                  <section className="order-package-detail">
                    <h3><Soup size={17} /> Chi tiết gói và món</h3>
                    <p>{order.kitchen_offers?.description || "Danh sách món được chụp lại từ đơn khách đã xác nhận."}</p>
                    <ul>{order.kitchen_order_items.map((item) => <li key={item.id}><span>{item.item_name}</span><strong>x{Number(item.quantity)}</strong></li>)}</ul>
                  </section>
                  <section className="order-requirements">
                    <div className="order-requirements__heading">
                      <h3><ShieldAlert size={17} /> Yêu cầu ăn uống của khách</h3>
                      <small>{order.nutrition_requirements.source === "order_snapshot" ? "Đã lưu theo thời điểm đặt đơn" : "Lấy từ hồ sơ hiện tại"}</small>
                    </div>
                    <div className="order-requirements__grid">
                      <div><strong>Chế độ ăn</strong><RequirementChips items={order.nutrition_requirements.dietary_preferences} emptyLabel="Không yêu cầu chế độ riêng" /></div>
                      <div><strong>Dị ứng thực phẩm</strong><RequirementChips tone="warning" items={order.nutrition_requirements.food_allergies} emptyLabel="Khách không khai báo dị ứng" /></div>
                      <div><strong>Không dung nạp</strong><RequirementChips tone="warning" items={order.nutrition_requirements.food_intolerances} emptyLabel="Không khai báo" /></div>
                      <div><strong>Không thích/không ăn</strong><RequirementChips items={order.nutrition_requirements.disliked_ingredients} emptyLabel="Không khai báo" /></div>
                    </div>
                  </section>
                </div>
                <div className="managed-order__actions">
                  {order.daily_orders.length > 0 ? (
                    <button className="button button--dark button--small" onClick={() => setSelectedOrderId(order.id)}>
                      <CalendarDays size={16} /> {order.fulfillment.status === "active" ? "Quản lý gói đang hoạt động" : "Xem lịch thực đơn"}
                    </button>
                  ) : null}
                  {order.status === "paid" ? <button className="button button--primary button--small" disabled={updatingId === order.id} onClick={() => void changeStatus(order, "confirmed")}><CheckCircle2 size={16} /> Xác nhận đơn</button> : null}
                  {order.status === "confirmed" && order.daily_orders.length === 0 ? <button className="button button--primary button--small" disabled={updatingId === order.id} onClick={() => void changeStatus(order, "completed")}><PackageCheck size={16} /> Hoàn thành</button> : null}
                  {["pending_payment", "paid", "confirmed"].includes(order.status) ? <button className="button button--outline button--small" disabled={updatingId === order.id} onClick={() => void changeStatus(order, "cancelled")}><XCircle size={16} /> Hủy đơn</button> : null}
                  {updatingId === order.id ? <LoaderCircle className="spin" size={18} /> : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      {selectedOrder ? (
        <KitchenPackageManager
          order={selectedOrder}
          onClose={() => setSelectedOrderId("")}
          onUpdated={load}
        />
      ) : null}
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return <article className="management-metric"><span>{icon}</span><div><small>{label}</small><strong>{value}</strong></div></article>;
}
