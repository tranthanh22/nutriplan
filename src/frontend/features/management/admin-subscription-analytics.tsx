import {
  BadgeDollarSign,
  CircleOff,
  CreditCard,
  Info,
  Repeat2,
  Sparkles,
  TrendingUp,
  UsersRound
} from "lucide-react";
import type { AdminSubscriptionAnalyticsResponse } from "./management-api";

function formatMoney(value: number | string, currency = "VND") {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(Number(value));
}

function formatPercent(value: number) {
  return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(value)}%`;
}

export function AdminSubscriptionAnalytics({ data }: { data: AdminSubscriptionAnalyticsResponse }) {
  const summary = data.summary;

  return (
    <section className="management-panel admin-subscription-analytics">
      <div className="management-panel__heading">
        <div><span className="section-kicker">DOANH THU SUBSCRIPTION</span><h2>Hiệu quả kinh doanh NutriPlan Plus</h2></div>
        <small>{summary.successfulPayments} lượt thanh toán thành công</small>
      </div>

      <div className="subscription-kpi-grid">
        <SubscriptionKpi icon={<BadgeDollarSign />} label="Doanh thu gói" value={formatMoney(summary.revenue)} detail="Đã trừ tiền hoàn lại" tone="green" />
        <SubscriptionKpi icon={<UsersRound />} label="Khách từng mua Plus" value={formatPercent(summary.payingCustomerRatePercent)} detail={`${summary.payingCustomers}/${summary.customers} khách hàng`} tone="blue" />
        <SubscriptionKpi icon={<CreditCard />} label="Đang trả phí" value={formatPercent(summary.activePaidRatePercent)} detail={`${summary.activePaidSubscribers} thuê bao còn hạn`} tone="purple" />
        <SubscriptionKpi icon={<Sparkles />} label="Dùng thử → trả phí" value={formatPercent(summary.trialConversionRatePercent)} detail={`${summary.convertedTrials}/${summary.trialUsers} khách dùng thử`} tone="amber" />
        <SubscriptionKpi icon={<CircleOff />} label="Tỷ lệ hủy" value={formatPercent(summary.cancellationRatePercent)} detail={`${summary.cancelledCustomers}/${summary.payingCustomers} khách trả phí`} tone="red" />
      </div>

      <div className="subscription-plan-table-wrap">
        <table className="subscription-plan-table">
          <thead><tr><th>Gói subscription</th><th>Giá bán</th><th>Doanh thu</th><th>Tỷ trọng</th><th>Người mua</th><th>Đang hoạt động</th><th>Từ dùng thử</th><th>Hủy gói</th></tr></thead>
          <tbody>
            {data.plans.map((plan) => (
              <tr key={plan.id}>
                <td><div className="subscription-plan-name"><span><Repeat2 size={16} /></span><div><strong>{plan.name}</strong><small>{plan.is_active ? "Đang bán" : "Đã ngừng bán"} · {plan.metrics.paymentCount} thanh toán</small></div></div></td>
                <td>{formatMoney(plan.price_amount, plan.currency)}</td>
                <td><strong>{formatMoney(plan.metrics.revenue, plan.currency)}</strong></td>
                <td><div className="subscription-revenue-share"><span><i style={{ width: `${Math.min(100, plan.metrics.revenueSharePercent)}%` }} /></span><b>{formatPercent(plan.metrics.revenueSharePercent)}</b></div></td>
                <td>{plan.metrics.buyers}</td>
                <td>{plan.metrics.activeSubscribers}</td>
                <td>{plan.metrics.trialConversions}</td>
                <td><span className={plan.metrics.cancellations ? "subscription-cancel-rate subscription-cancel-rate--warning" : "subscription-cancel-rate"}>{plan.metrics.cancellations} · {formatPercent(plan.metrics.cancellationRatePercent)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <details className="subscription-definitions">
        <summary><Info size={16} /> Cách tính các chỉ số</summary>
        <ul>
          <li><strong>Doanh thu:</strong> {data.definitions.revenue}</li>
          <li><strong>Khách từng mua Plus:</strong> {data.definitions.payingCustomerRate}</li>
          <li><strong>Đang trả phí:</strong> {data.definitions.activePaidRate}</li>
          <li><strong>Chuyển đổi dùng thử:</strong> {data.definitions.trialConversion}</li>
          <li><strong>Tỷ lệ hủy:</strong> {data.definitions.cancellationRate}</li>
        </ul>
      </details>
    </section>
  );
}

function SubscriptionKpi({ icon, label, value, detail, tone }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  tone: "green" | "blue" | "purple" | "amber" | "red";
}) {
  return (
    <article className={`subscription-kpi subscription-kpi--${tone}`}>
      <span>{icon}</span>
      <div><small>{label}</small><strong>{value}</strong><p><TrendingUp size={13} /> {detail}</p></div>
    </article>
  );
}
