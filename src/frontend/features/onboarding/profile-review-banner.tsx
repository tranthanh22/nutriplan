import { CalendarClock, ChevronRight, X } from "lucide-react";

export function ProfileReviewBanner({
  onReview,
  onDismiss
}: {
  onReview: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="profile-review-banner">
      <span><CalendarClock size={20} /></span>
      <div>
        <strong>Đã đến lúc cập nhật hồ sơ 7 ngày</strong>
        <p>Kiểm tra lại cân nặng, mức vận động và mục tiêu để kế hoạch cùng AI Insight sát với hiện tại.</p>
      </div>
      <button className="button button--soft" onClick={onReview}>Cập nhật ngay <ChevronRight size={16} /></button>
      <button className="profile-review-banner__close" aria-label="Nhắc lại sau" onClick={onDismiss}><X size={17} /></button>
    </div>
  );
}
