import Image from "next/image";
import { ArrowRight, Camera, LockKeyhole, Utensils } from "lucide-react";
import { ProgressRing } from "@/components/ui/nutrition-widgets";
import type { ConsumedNutrition, JournalEntry, NutritionSummary } from "@/types/app";

export function JournalPage({
  subscribed,
  journal,
  nutrition,
  consumed,
  onAnalyze,
  onSubscribe
}: {
  subscribed: boolean;
  journal: JournalEntry[];
  nutrition: NutritionSummary;
  consumed: ConsumedNutrition;
  onAnalyze: () => void;
  onSubscribe: () => void;
}) {
  const adherence = Math.min(100, Math.round((consumed.calories / nutrition.target) * 100));

  return (
    <div className="page-content">
      <section className="page-title">
        <div>
          <p className="eyebrow">NHẬT KÝ DINH DƯỠNG</p>
          <h1>Hôm nay bạn đã ăn gì?</h1>
          <p>Ghi lại bữa ăn và theo dõi mức độ bám sát kế hoạch.</p>
        </div>
        <button className="button button--dark" onClick={onAnalyze}><Camera size={18} /> Phân tích ảnh món ăn</button>
      </section>
      {!subscribed && (
        <section className="paywall-banner">
          <div className="paywall-banner__icon"><LockKeyhole /></div>
          <div>
            <span className="section-kicker">TÍNH NĂNG PLUS</span>
            <h2>Nhật ký và phân tích dành cho subscriber</h2>
            <p>Đăng ký để lưu Meal Log, phân tích ảnh và xem mức độ tuân thủ theo ngày.</p>
          </div>
          <button className="button button--cream" onClick={onSubscribe}>Dùng thử 7 ngày <ArrowRight size={17} /></button>
        </section>
      )}
      <section className={`journal-layout ${!subscribed ? "journal-layout--muted" : ""}`}>
        <div className="journal-list-card">
          <div className="section-heading">
            <div><span className="section-kicker">15 THÁNG 7</span><h2>Meal Log hôm nay</h2></div>
            <span className="status-pill"><span /> {journal.length} bữa đã ghi</span>
          </div>
          {journal.map((entry) => (
            <article className="journal-entry" key={entry.id}>
              {entry.image ? (
                <div className="journal-entry__thumb"><Image src={entry.image} alt="Ảnh món ăn" width={46} height={46} unoptimized /></div>
              ) : (
                <div className="journal-entry__icon"><Utensils size={20} /></div>
              )}
              <div className="journal-entry__body">
                <div><span>{entry.slot} · {entry.time}</span><h3>{entry.name}</h3></div>
                <small className={`source-tag source-tag--${entry.source === "Bếp đối tác" ? "kitchen" : entry.source === "Ảnh ước tính" ? "image" : "plan"}`}>{entry.source}</small>
              </div>
              <div className="journal-entry__numbers">
                <strong>{entry.calories} kcal</strong>
                <span>P {entry.protein}g · C {entry.carbs}g · F {entry.fat}g</span>
              </div>
            </article>
          ))}
        </div>
        <aside className="journal-aside">
          <div className="adherence-card">
            <span className="section-kicker">MỨC ĐỘ TUÂN THỦ</span>
            <ProgressRing progress={adherence} label={`${adherence}%`} sublabel="mục tiêu" />
            <p>Bạn đang đi đúng hướng. Hãy ghi thêm bữa tối để hoàn tất ngày hôm nay.</p>
          </div>
          <div className="aside-card">
            <h3>Tổng hôm nay</h3>
            <div className="summary-line"><span>Năng lượng</span><strong>{consumed.calories} / {nutrition.target} kcal</strong></div>
            <div className="summary-line"><span>Protein</span><strong>{consumed.protein} / {nutrition.protein}g</strong></div>
            <div className="summary-line"><span>Carbs</span><strong>{consumed.carbs} / {nutrition.carbs}g</strong></div>
            <div className="summary-line"><span>Chất béo</span><strong>{consumed.fat} / {nutrition.fat}g</strong></div>
          </div>
        </aside>
      </section>
    </div>
  );
}
