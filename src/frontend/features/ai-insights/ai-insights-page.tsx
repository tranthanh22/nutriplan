"use client";

import Link from "next/link";
import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Lightbulb,
  LoaderCircle,
  LogIn,
  LogOut,
  RefreshCw,
  ShieldAlert,
  ShieldCheck
} from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import {
  BackendApiError,
  fetchLatestInsight,
  generateInsight,
  type AiHealthInsight,
  type AiInsightResponse
} from "./ai-insights-api";

function formatDate(value?: string | null) {
  if (!value) return "Chưa có thời điểm tạo";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function errorGuidance(error: BackendApiError) {
  if (error.status === 401) return "Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại để tiếp tục.";
  if (error.status === 404) return "Bạn cần lưu hồ sơ dinh dưỡng hiện hành trước khi yêu cầu AI Insight.";
  if (error.status === 429) return "Dịch vụ AI hiện đã hết quota hoặc đang giới hạn yêu cầu. Hãy thử lại sau.";
  return error.message;
}

export function AiInsightDashboardCard({ onEditProfile }: { onEditProfile: () => void }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<AiInsightResponse | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadLatest = useCallback(async (quiet = false) => {
    setLoading(true);
    if (!quiet) setError("");
    try {
      const latest = await fetchLatestInsight();
      setInsight(latest);
      setNotice("");
    } catch (requestError) {
      if (requestError instanceof BackendApiError && requestError.status === 404) {
        setInsight(null);
        setNotice("Chưa có insight nào. Bạn có thể tạo phân tích đầu tiên từ hồ sơ dinh dưỡng hiện hành.");
      } else {
        setError(requestError instanceof BackendApiError ? errorGuidance(requestError) : "Không thể kết nối API.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    try {
      const supabase = createClient();
      void supabase.auth.getUser().then(({ data }: { data: { user: User | null } }) => {
        if (!active) return;
        setUser(data.user);
        setAuthLoading(false);
        if (data.user) void loadLatest(true);
      });
      const { data: listener } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
        if (!active) return;
        setUser(session?.user ?? null);
      });
      return () => {
        active = false;
        listener.subscription.unsubscribe();
      };
    } catch (configurationError) {
      setError(configurationError instanceof Error ? configurationError.message : "Thiếu cấu hình đăng nhập.");
      setAuthLoading(false);
      return () => {
        active = false;
      };
    }
  }, [loadLatest]);

  async function signOut() {
    try {
      await createClient().auth.signOut();
      setUser(null);
      setInsight(null);
      setNotice("");
    } catch {
      setError("Không thể đăng xuất. Hãy thử lại.");
    }
  }

  async function createInsight() {
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const nextInsight = await generateInsight();
      setInsight(nextInsight);
      if (nextInsight.status === "processing") setNotice("Insight đang được tạo. Hãy làm mới lại sau vài giây.");
    } catch (requestError) {
      setError(requestError instanceof BackendApiError ? errorGuidance(requestError) : "Không thể kết nối API.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="insight-dashboard section-block" aria-labelledby="ai-insight-title">
      <div className="section-heading">
        <div>
          <span className="section-kicker">NUTRIPLAN AI</span>
          <h2 id="ai-insight-title">Phân tích sức khỏe của bạn</h2>
          <p>Diễn giải các chỉ số dinh dưỡng từ hồ sơ hiện hành; không thay thế chẩn đoán y khoa.</p>
        </div>
        {user && <button className="button button--outline button--small" onClick={() => void signOut()}><LogOut size={16} /> Đăng xuất</button>}
      </div>

      {!authLoading && !user && (
        <div className="insight-login-card">
          <div className="insight-icon-box"><LogIn size={19} /></div>
          <div className="insight-login-card__copy"><h3>Đăng nhập để nhận AI Insight</h3><p>Phiên đăng nhập được lưu bằng cookie an toàn. Bạn không cần dán hoặc nhìn thấy access token.</p></div>
          <Link className="button button--dark" href="/login?next=/"><LogIn size={17} /> Đăng nhập</Link>
        </div>
      )}

      {authLoading && <div className="insight-processing"><LoaderCircle className="spin" size={21} /><span>Đang kiểm tra phiên đăng nhập…</span></div>}
      {error && <div className="insight-alert insight-alert--error"><AlertTriangle size={19} /><div><strong>Không thể tải insight</strong><span>{error}</span></div></div>}
      {notice && <div className="insight-alert"><ShieldCheck size={19} /><div><strong>Trạng thái</strong><span>{notice}</span></div></div>}

      {user && (
        <div className="insight-action-card">
          <div><span className="section-kicker">HỒ SƠ ĐÃ KẾT NỐI</span><h3>{user.email ?? "Tài khoản NutriPlan"}</h3><p>Dữ liệu định danh không được gửi vào nội dung AI; backend chỉ chuyển các chỉ số tối thiểu cần thiết.</p></div>
          <div className="insight-action-card__buttons">
            <button className="button button--outline" disabled={loading} onClick={() => void loadLatest()}><RefreshCw size={17} className={loading ? "spin" : ""} /> Làm mới</button>
            <button className="button button--dark" disabled={loading} onClick={() => void createInsight()}>{loading ? <LoaderCircle size={17} className="spin" /> : <BrainCircuit size={17} />}{loading ? "Đang phân tích..." : "Nhận AI Insight"}</button>
          </div>
        </div>
      )}

      {insight?.status === "processing" && <div className="insight-processing"><LoaderCircle className="spin" size={22} /><div><strong>AI đang xử lý insight</strong><span>Thử làm mới lại sau {insight.retryAfterSeconds ?? 3} giây.</span></div></div>}
      {insight?.requiresSubscription && <InsightPreview insight={insight} />}
      {insight?.insight && <InsightDetail insight={insight.insight} generatedAt={insight.generatedAt} safetyStatus={insight.safetyStatus} />}
      {user && !insight && !loading && !error && !notice && <div className="insight-empty"><Lightbulb size={26} /><h3>Insight của bạn sẽ xuất hiện ở đây</h3><p>Hãy bảo đảm hồ sơ dinh dưỡng đã được lưu trước khi chọn “Nhận AI Insight”.</p><button className="link-button" onClick={onEditProfile}>Cập nhật hồ sơ <ChevronRight size={15} /></button></div>}
    </section>
  );
}

function InsightPreview({ insight }: { insight: AiInsightResponse }) {
  return <section className="insight-preview-card"><div className="insight-preview-card__top"><span className="status-pill"><span /> Đã tạo · {formatDate(insight.generatedAt)}</span><span className="insight-lock">Insight Plus</span></div><h3>Bản xem trước</h3><p>{insight.previewSummary ?? "Insight đã sẵn sàng."}</p><div className="insight-preview-card__footer"><ShieldAlert size={18} /> Đăng ký NutriPlan Plus để xem phần quan sát và đề xuất đầy đủ.</div></section>;
}

function InsightDetail({ insight, generatedAt, safetyStatus }: { insight: AiHealthInsight; generatedAt?: string | null; safetyStatus?: string }) {
  return <section className="insight-result"><div className="insight-result__head"><div><span className="section-kicker">INSIGHT ĐÃ TẠO</span><h3>Phân tích sức khỏe từ dữ liệu dinh dưỡng</h3><p>{formatDate(generatedAt)}</p></div><span className={`insight-safety insight-safety--${safetyStatus ?? "passed"}`}><CheckCircle2 size={16} /> {safetyStatus === "review_required" ? "Nên tham vấn chuyên gia" : "Đã kiểm tra an toàn"}</span></div><p className="insight-result__summary">{insight.summary}</p><div className="insight-grid"><InsightSection title="Quan sát chính" icon={<BrainCircuit size={18} />}>{insight.observations.map((observation) => <article className="insight-observation" key={observation.title}><div><strong>{observation.title}</strong><span className={`confidence-pill confidence-pill--${observation.confidence}`}>{observation.confidence === "high" ? "Tin cậy cao" : observation.confidence === "medium" ? "Tin cậy vừa" : "Tin cậy thấp"}</span></div><p>{observation.evidence}</p></article>)}</InsightSection><InsightSection title="Đề xuất có thể thực hiện" icon={<Lightbulb size={18} />}><TextList items={insight.actionable_suggestions} /></InsightSection><InsightSection title="Câu hỏi để theo dõi" icon={<ChevronRight size={18} />}><TextList items={insight.questions_for_user} /></InsightSection><InsightSection title="Giới hạn của phân tích" icon={<ShieldAlert size={18} />}><TextList items={insight.limitations} /></InsightSection></div>{insight.safety_flags.length > 0 && <div className="insight-flags"><AlertTriangle size={18} /><div><strong>Lưu ý an toàn</strong><TextList items={insight.safety_flags} /></div></div>}</section>;
}

function InsightSection({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return <section className="insight-section"><h3>{icon}{title}</h3>{children}</section>;
}

function TextList({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="insight-muted">Chưa có nội dung.</p>;
  return <ul className="insight-list">{items.map((item) => <li key={item}><CheckCircle2 size={15} />{item}</li>)}</ul>;
}
