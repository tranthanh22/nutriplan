"use client";

import {
  Ban,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  MapPin,
  Package,
  Search,
  ShieldCheck,
  UsersRound
} from "lucide-react";
import { useMemo, useState } from "react";
import type {
  AdminKitchen,
  AdminKitchensResponse,
  AdminKitchenStatus
} from "./management-api";

const statusLabels: Record<AdminKitchenStatus, string> = {
  active: "Đang hoạt động",
  suspended: "Đã tạm ngưng",
  pending: "Chờ duyệt",
  closed: "Đã đóng"
};

const offerStatusLabels: Record<AdminKitchen["offers"][number]["status"], string> = {
  active: "Đang bán",
  draft: "Bản nháp",
  sold_out: "Hết suất",
  inactive: "Ngừng bán"
};

function formatMoney(value: number | string, currency = "VND") {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(Number(value));
}

function formatDate(value: string | null) {
  if (!value) return "Chưa có";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short" }).format(new Date(value));
}

type Props = {
  data: AdminKitchensResponse;
  updatingKitchenId: string | null;
  onStatusChange: (kitchen: AdminKitchen, status: "active" | "suspended") => Promise<void>;
};

export function AdminKitchenManagement({ data, updatingKitchenId, onStatusChange }: Props) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | AdminKitchenStatus>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("vi");
    return data.kitchens.filter((kitchen) => {
      const matchesStatus = status === "all" || kitchen.status === status;
      const matchesQuery = !normalized || [kitchen.name, kitchen.email, kitchen.phone, kitchen.address_text]
        .some((value) => value?.toLocaleLowerCase("vi").includes(normalized));
      return matchesStatus && matchesQuery;
    });
  }, [data.kitchens, query, status]);

  async function changeStatus(kitchen: AdminKitchen) {
    const nextStatus = kitchen.status === "active" ? "suspended" : "active";
    const message = nextStatus === "suspended"
      ? `Tạm ngưng ${kitchen.name}? Bếp sẽ bị ẩn khỏi chợ và không nhận đơn mới.`
      : `Cho phép ${kitchen.name} hoạt động và nhận đơn mới?`;
    if (!window.confirm(message)) return;
    await onStatusChange(kitchen, nextStatus);
  }

  return (
    <section className="management-panel admin-kitchen-management">
      <div className="management-panel__heading">
        <div><span className="section-kicker">ĐỐI TÁC NHÀ BẾP</span><h2>Quản lý tài khoản bếp</h2></div>
        <small>{data.summary.active}/{data.summary.total} bếp đang hoạt động</small>
      </div>

      <div className="admin-kitchen-summary">
        <span><CheckCircle2 /> <strong>{data.summary.active}</strong> hoạt động</span>
        <span><Ban /> <strong>{data.summary.suspended}</strong> tạm ngưng</span>
        <span><Package /> <strong>{data.summary.activeOffers}</strong> gói đang bán</span>
        <span><CircleDollarSign /> <strong>{formatMoney(data.summary.totalRevenue)}</strong> doanh thu</span>
      </div>

      <div className="management-filters">
        <label className="management-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo tên, email, số điện thoại, địa chỉ…" /></label>
        <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} aria-label="Lọc trạng thái nhà bếp">
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="suspended">Đã tạm ngưng</option>
          <option value="pending">Chờ duyệt</option>
          <option value="closed">Đã đóng</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="management-state"><Search /><strong>Không tìm thấy nhà bếp phù hợp</strong></div>
      ) : (
        <div className="admin-kitchen-list">
          {filtered.map((kitchen) => {
            const expanded = expandedId === kitchen.id;
            const updating = updatingKitchenId === kitchen.id;
            return (
              <article className="admin-kitchen-card" key={kitchen.id}>
                <div className="admin-kitchen-card__main">
                  <button className="admin-kitchen-card__identity" onClick={() => setExpandedId(expanded ? null : kitchen.id)} aria-expanded={expanded}>
                    <span className="admin-kitchen-avatar">{kitchen.name.slice(0, 2).toLocaleUpperCase("vi")}</span>
                    <span><strong>{kitchen.name}</strong><small><MapPin size={13} /> {kitchen.address_text || "Chưa cập nhật địa chỉ"}</small></span>
                    {expanded ? <ChevronUp /> : <ChevronDown />}
                  </button>
                  <span className={`kitchen-account-status kitchen-account-status--${kitchen.status}`}>{statusLabels[kitchen.status]}</span>
                  <div className="admin-kitchen-card__stats">
                    <span><small>Doanh thu</small><strong>{formatMoney(kitchen.stats.revenue)}</strong></span>
                    <span><small>Đơn / khách</small><strong>{kitchen.stats.orderCount} / {kitchen.stats.customerCount}</strong></span>
                    <span><small>Gói đang bán</small><strong>{kitchen.stats.activeOffers}/{kitchen.offers.length}</strong></span>
                    <span><small>Đơn gần nhất</small><strong>{formatDate(kitchen.stats.lastOrderAt)}</strong></span>
                  </div>
                  <button className={`button ${kitchen.status === "active" ? "button--danger-outline" : "button--primary"}`} disabled={updating} onClick={() => void changeStatus(kitchen)}>
                    {kitchen.status === "active" ? <Ban size={17} /> : <ShieldCheck size={17} />}
                    {updating ? "Đang cập nhật…" : kitchen.status === "active" ? "Tạm ngưng" : "Cho hoạt động"}
                  </button>
                </div>

                {expanded ? (
                  <div className="admin-kitchen-card__detail">
                    <section><h3><UsersRound size={17} /> Tài khoản quản lý</h3>{kitchen.members.length ? <ul>{kitchen.members.map((member) => <li key={member.user_id}><span><strong>{member.profile?.full_name || "Thành viên bếp"}</strong><small>{member.profile?.phone || member.user_id}</small></span><em>{member.role} · {member.is_active ? "đang hoạt động" : "đã khóa"}</em></li>)}</ul> : <p>Chưa có tài khoản quản lý được gán.</p>}</section>
                    <section><h3><Package size={17} /> Các gói của bếp</h3>{kitchen.offers.length ? <div className="admin-kitchen-offers">{kitchen.offers.map((offer) => <article key={offer.id}><div><strong>{offer.name}</strong><span className={`offer-admin-status offer-admin-status--${offer.status}`}>{offerStatusLabels[offer.status]}</span></div><p>{offer.type === "single_meal" ? "Món lẻ" : `${offer.package_days ?? 0} ngày · ${offer.meals_per_day} bữa/ngày`}</p><b>{formatMoney(offer.price_amount, offer.currency)}</b></article>)}</div> : <p>Bếp chưa tạo gói bán hàng.</p>}</section>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
      <p className="admin-kitchen-policy-note"><ShieldCheck size={16} /> Tạm ngưng sẽ ẩn bếp khỏi marketplace và chặn đơn mới. Các đơn đã thanh toán vẫn được giữ để bếp hoàn tất.</p>
    </section>
  );
}
