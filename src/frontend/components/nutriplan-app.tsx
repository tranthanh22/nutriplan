"use client";

import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bell,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  ChefHat,
  ChevronDown,
  CircleUserRound,
  Clock3,
  Flame,
  Home,
  ImagePlus,
  Leaf,
  LockKeyhole,
  MapPin,
  Menu,
  Minus,
  PackageCheck,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Target,
  Utensils,
  WandSparkles,
  X
} from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { KitchenOffer, Meal, kitchenOffers, meals, weekPlan } from "@/lib/data";

type View = "home" | "plan" | "kitchens" | "journal";
type Profile = {
  name: string;
  gender: "male" | "female";
  age: number;
  height: number;
  weight: number;
  activity: number;
  goal: "lose" | "maintain" | "gain";
  allergies: string;
};
type JournalEntry = {
  id: string;
  name: string;
  slot: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  source: "Kế hoạch" | "Bếp đối tác" | "Ảnh ước tính" | "Nhập tay";
  time: string;
  image?: string;
};

const defaultProfile: Profile = {
  name: "Minh Anh",
  gender: "female",
  age: 24,
  height: 162,
  weight: 58,
  activity: 1.55,
  goal: "lose",
  allergies: "Không có"
};

const initialJournal: JournalEntry[] = [
  {
    id: "morning-demo",
    name: "Yến mạch xoài sữa chua",
    slot: "Bữa sáng",
    calories: 428,
    protein: 22,
    carbs: 61,
    fat: 11,
    source: "Kế hoạch",
    time: "07:35"
  },
  {
    id: "lunch-demo",
    name: "Ức gà áp chảo & cơm gạo lứt",
    slot: "Bữa trưa",
    calories: 612,
    protein: 48,
    carbs: 67,
    fat: 17,
    source: "Bếp đối tác",
    time: "12:14"
  }
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}

function calculateNutrition(profile: Profile) {
  const bmr =
    profile.gender === "male"
      ? 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5
      : 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;
  const tdee = Math.round(bmr * profile.activity);
  const target = Math.round(tdee + (profile.goal === "lose" ? -350 : profile.goal === "gain" ? 300 : 0));
  const protein = Math.round(profile.weight * (profile.goal === "gain" ? 2 : 1.8));
  const fat = Math.round((target * 0.27) / 9);
  const carbs = Math.round((target - protein * 4 - fat * 9) / 4);
  return { bmr: Math.round(bmr), tdee, target, protein, carbs, fat };
}

function mealToEntry(meal: Meal, source: JournalEntry["source"]): JournalEntry {
  return {
    id: `${meal.id}-${Date.now()}`,
    name: meal.name,
    slot: "Bữa ăn",
    calories: meal.calories,
    protein: meal.protein,
    carbs: meal.carbs,
    fat: meal.fat,
    source,
    time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
  };
}

export function NutriPlanApp() {
  const [view, setView] = useState<View>("home");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [subscribed, setSubscribed] = useState(false);
  const [journal, setJournal] = useState<JournalEntry[]>(initialJournal);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<KitchenOffer | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("nutriplan-demo");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { profile?: Profile; subscribed?: boolean; journal?: JournalEntry[] };
        if (parsed.profile) setProfile(parsed.profile);
        if (typeof parsed.subscribed === "boolean") setSubscribed(parsed.subscribed);
        if (parsed.journal) setJournal(parsed.journal);
      } catch {
        window.localStorage.removeItem("nutriplan-demo");
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem("nutriplan-demo", JSON.stringify({ profile, subscribed, journal }));
  }, [profile, subscribed, journal, hydrated]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const nutrition = useMemo(() => calculateNutrition(profile), [profile]);
  const consumed = useMemo(
    () =>
      journal.reduce(
        (sum, item) => ({
          calories: sum.calories + item.calories,
          protein: sum.protein + item.protein,
          carbs: sum.carbs + item.carbs,
          fat: sum.fat + item.fat
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      ),
    [journal]
  );

  const go = (next: View) => {
    setView(next);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const addMeal = (meal: Meal, source: JournalEntry["source"] = "Kế hoạch") => {
    setJournal((current) => [...current, mealToEntry(meal, source)]);
    setToast(`Đã ghi “${meal.name}” vào nhật ký hôm nay.`);
    setSelectedMeal(null);
  };

  const activateDemo = () => {
    setSubscribed(true);
    setSubscribeOpen(false);
    setToast("Subscription dùng thử đã được kích hoạt trong 7 ngày.");
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? "sidebar--open" : ""}`}>
        <div className="brand" onClick={() => go("home")} role="button" tabIndex={0}>
          <span className="brand__mark"><Leaf size={21} strokeWidth={2.5} /></span>
          <span>NutriPlan</span>
        </div>

        <nav className="nav-list" aria-label="Điều hướng chính">
          <NavButton active={view === "home"} icon={<Home size={19} />} label="Tổng quan" onClick={() => go("home")} />
          <NavButton active={view === "plan"} icon={<CalendarDays size={19} />} label="Thực đơn của tôi" onClick={() => go("plan")} />
          <NavButton active={view === "kitchens"} icon={<ChefHat size={19} />} label="Bếp đối tác" onClick={() => go("kitchens")} />
          <NavButton active={view === "journal"} icon={<BarChart3 size={19} />} label="Nhật ký dinh dưỡng" onClick={() => go("journal")} />
        </nav>

        <div className="sidebar__spacer" />
        <div className={`membership-card ${subscribed ? "membership-card--active" : ""}`}>
          <div className="membership-card__icon">{subscribed ? <Check size={17} /> : <Sparkles size={17} />}</div>
          <strong>{subscribed ? "NutriPlan Plus" : "Mở khóa kế hoạch"}</strong>
          <p>{subscribed ? "Đang dùng thử · còn 7 ngày" : "Recipe chi tiết, nhật ký và phân tích ảnh."}</p>
          {!subscribed && <button className="button button--dark button--small" onClick={() => setSubscribeOpen(true)}>Dùng thử miễn phí</button>}
        </div>

        <button className="user-chip" onClick={() => setProfileOpen(true)}>
          <span className="avatar">MA</span>
          <span><strong>{profile.name}</strong><small>{subscribed ? "Thành viên Plus" : "Tài khoản miễn phí"}</small></span>
          <ChevronDown size={16} />
        </button>
      </aside>

      {mobileOpen && <button className="mobile-backdrop" aria-label="Đóng menu" onClick={() => setMobileOpen(false)} />}

      <main className="main-area">
        <header className="topbar">
          <button className="icon-button topbar__menu" aria-label="Mở menu" onClick={() => setMobileOpen(true)}><Menu size={21} /></button>
          <div className="topbar__crumb"><span>NutriPlan</span><span>/</span><strong>{view === "home" ? "Tổng quan" : view === "plan" ? "Thực đơn" : view === "kitchens" ? "Bếp đối tác" : "Nhật ký"}</strong></div>
          <div className="topbar__actions">
            <button className="icon-button" aria-label="Thông báo"><Bell size={19} /><span className="notification-dot" /></button>
            <button className="profile-button" onClick={() => setProfileOpen(true)}><CircleUserRound size={19} /> Hồ sơ <ChevronDown size={15} /></button>
          </div>
        </header>

        {view === "home" && (
          <Dashboard
            profile={profile}
            nutrition={nutrition}
            consumed={consumed}
            subscribed={subscribed}
            onEdit={() => setProfileOpen(true)}
            onGo={go}
            onMeal={setSelectedMeal}
            onSubscribe={() => setSubscribeOpen(true)}
          />
        )}
        {view === "plan" && (
          <MealPlanPage
            subscribed={subscribed}
            onSubscribe={() => setSubscribeOpen(true)}
            onMeal={setSelectedMeal}
            onAdd={addMeal}
          />
        )}
        {view === "kitchens" && <KitchenPage subscribed={subscribed} onOrder={setSelectedOffer} />}
        {view === "journal" && (
          <JournalPage
            subscribed={subscribed}
            journal={journal}
            nutrition={nutrition}
            consumed={consumed}
            onAnalyze={() => subscribed ? setImageOpen(true) : setSubscribeOpen(true)}
            onSubscribe={() => setSubscribeOpen(true)}
          />
        )}
      </main>

      {selectedMeal && <MealModal meal={selectedMeal} subscribed={subscribed} onClose={() => setSelectedMeal(null)} onSubscribe={() => { setSelectedMeal(null); setSubscribeOpen(true); }} onAdd={() => addMeal(selectedMeal)} />}
      {selectedOffer && <OrderModal offer={selectedOffer} subscribed={subscribed} onClose={() => setSelectedOffer(null)} onComplete={() => { setSelectedOffer(null); setToast("Đặt món thành công. Bếp đã nhận yêu cầu của bạn."); }} />}
      {profileOpen && <ProfileModal value={profile} onClose={() => setProfileOpen(false)} onSave={(next) => { setProfile(next); setProfileOpen(false); setToast("Hồ sơ và mục tiêu dinh dưỡng đã được cập nhật."); }} />}
      {subscribeOpen && <SubscriptionModal onClose={() => setSubscribeOpen(false)} onActivate={activateDemo} />}
      {imageOpen && <ImageAnalysisModal onClose={() => setImageOpen(false)} onConfirm={(entry) => { setJournal((items) => [...items, entry]); setImageOpen(false); setToast("Đã xác nhận kết quả và thêm vào Meal Log."); }} />}
      {toast && <div className="toast"><CheckCircle2 size={19} /><span>{toast}</span></div>}
    </div>
  );
}

function NavButton({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return <button className={`nav-button ${active ? "nav-button--active" : ""}`} onClick={onClick}>{icon}<span>{label}</span></button>;
}

function Dashboard({ profile, nutrition, consumed, subscribed, onEdit, onGo, onMeal, onSubscribe }: {
  profile: Profile;
  nutrition: ReturnType<typeof calculateNutrition>;
  consumed: { calories: number; protein: number; carbs: number; fat: number };
  subscribed: boolean;
  onEdit: () => void;
  onGo: (view: View) => void;
  onMeal: (meal: Meal) => void;
  onSubscribe: () => void;
}) {
  const progress = Math.min(100, Math.round((consumed.calories / nutrition.target) * 100));
  return (
    <div className="page-content">
      <section className="welcome-row">
        <div><p className="eyebrow">THỨ TƯ, 15 THÁNG 7</p><h1>Chào buổi sáng, {profile.name.split(" ").slice(-1)[0]} <span>👋</span></h1><p>Một ngày mới để tiến gần hơn tới mục tiêu của bạn.</p></div>
        <button className="button button--outline" onClick={onEdit}><Target size={18} /> Chỉnh mục tiêu</button>
      </section>

      <section className="hero-grid">
        <div className="calorie-card">
          <div className="calorie-card__head"><div><span className="section-kicker">NĂNG LƯỢNG HÔM NAY</span><h2>{consumed.calories.toLocaleString("vi-VN")} <small>/ {nutrition.target.toLocaleString("vi-VN")} kcal</small></h2></div><span className="status-pill"><span /> Đang đúng kế hoạch</span></div>
          <div className="calorie-card__body">
            <ProgressRing progress={progress} label={`${progress}%`} sublabel="đã nạp" />
            <div className="macro-stack">
              <MacroRow label="Protein" value={consumed.protein} target={nutrition.protein} color="var(--coral)" />
              <MacroRow label="Carbs" value={consumed.carbs} target={nutrition.carbs} color="var(--amber)" />
              <MacroRow label="Chất béo" value={consumed.fat} target={nutrition.fat} color="var(--mint-dark)" />
            </div>
          </div>
          <div className="calorie-card__footer"><span><Flame size={16} /> Còn lại <strong>{Math.max(0, nutrition.target - consumed.calories)} kcal</strong></span><button className="link-button" onClick={() => onGo("journal")}>Xem chi tiết <ArrowRight size={15} /></button></div>
        </div>

        <div className="profile-summary">
          <span className="section-kicker">HỒ SƠ DINH DƯỠNG</span>
          <h3>Mục tiêu: {profile.goal === "lose" ? "Giảm mỡ lành mạnh" : profile.goal === "gain" ? "Tăng cơ" : "Duy trì cân nặng"}</h3>
          <p>Dựa trên chỉ số hiện tại và mức vận động của bạn.</p>
          <div className="metric-grid"><Metric label="BMR" value={`${nutrition.bmr}`} unit="kcal" /><Metric label="TDEE" value={`${nutrition.tdee}`} unit="kcal" /><Metric label="Cân nặng" value={`${profile.weight}`} unit="kg" /><Metric label="Vận động" value={profile.activity >= 1.55 ? "Vừa" : "Nhẹ"} unit="" /></div>
          <button className="link-button" onClick={onEdit}>Cập nhật chỉ số <ArrowRight size={15} /></button>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading"><div><span className="section-kicker">GỢI Ý CHO BẠN</span><h2>Thực đơn hôm nay</h2></div><button className="link-button" onClick={() => onGo("plan")}>Xem cả tuần <ArrowRight size={16} /></button></div>
        <div className="meal-row">{weekPlan[0].meals.map(({ slot, meal }) => <MealCard key={slot} slot={slot} meal={meal} onClick={() => onMeal(meal)} />)}</div>
      </section>

      <section className="split-cta">
        <div className="cta-panel cta-panel--mint"><div className="cta-panel__icon"><ChefHat /></div><div><span className="section-kicker">KHÔNG CÓ THỜI GIAN NẤU?</span><h3>Để bếp đối tác chuẩn bị giúp bạn</h3><p>Mua món lẻ hoặc gói 5 ngày, không cần đăng ký NutriPlan Plus.</p><button className="button button--dark" onClick={() => onGo("kitchens")}>Khám phá bếp <ArrowRight size={17} /></button></div></div>
        <div className="cta-panel cta-panel--peach"><div className="cta-panel__icon"><Camera /></div><div><span className="section-kicker">MEAL SCAN BETA</span><h3>Chụp món ăn, ghi nhật ký nhanh hơn</h3><p>Nhận ước tính Calorie/Macro và tự xác nhận trước khi lưu.</p><button className="button button--light" onClick={() => subscribed ? onGo("journal") : onSubscribe()}>{subscribed ? "Mở Meal Scan" : "Mở khóa với Plus"} <Sparkles size={17} /></button></div></div>
      </section>
    </div>
  );
}

function ProgressRing({ progress, label, sublabel }: { progress: number; label: string; sublabel: string }) {
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  return <div className="progress-ring"><svg viewBox="0 0 132 132"><circle className="progress-ring__track" cx="66" cy="66" r={radius} /><circle className="progress-ring__fill" cx="66" cy="66" r={radius} strokeDasharray={circumference} strokeDashoffset={circumference - (progress / 100) * circumference} /></svg><div><strong>{label}</strong><span>{sublabel}</span></div></div>;
}

function MacroRow({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  const width = Math.min(100, Math.round((value / target) * 100));
  return <div className="macro-row"><div><span>{label}</span><strong>{value}g <small>/ {target}g</small></strong></div><div className="macro-track"><span style={{ width: `${width}%`, background: color }} /></div></div>;
}

function Metric({ label, value, unit }: { label: string; value: string; unit: string }) {
  return <div className="metric"><span>{label}</span><strong>{value} <small>{unit}</small></strong></div>;
}

function MealCard({ slot, meal, onClick }: { slot: string; meal: Meal; onClick: () => void }) {
  return <article className="meal-card" onClick={onClick}><div className="meal-card__image"><Image src={meal.image} alt={meal.name} fill sizes="(max-width: 800px) 100vw, 33vw" /><span>{slot}</span></div><div className="meal-card__body"><h3>{meal.name}</h3><p>{meal.subtitle}</p><div className="meal-card__meta"><span><Flame size={15} /> {meal.calories} kcal</span><span><Target size={15} /> {meal.protein}g đạm</span><span><Clock3 size={15} /> {meal.prepTime} phút</span></div></div></article>;
}

function MealPlanPage({ subscribed, onSubscribe, onMeal, onAdd }: { subscribed: boolean; onSubscribe: () => void; onMeal: (meal: Meal) => void; onAdd: (meal: Meal) => void }) {
  const [dayIndex, setDayIndex] = useState(0);
  const day = weekPlan[dayIndex];
  return <div className="page-content">
    <section className="page-title"><div><p className="eyebrow">KẾ HOẠCH CÁ NHÂN</p><h1>Thực đơn 7 ngày của bạn</h1><p>Mục tiêu trung bình 1.680 kcal/ngày · giàu protein · không có dị ứng.</p></div><div className="week-switcher"><button className="icon-button" onClick={() => setDayIndex((v) => Math.max(0, v - 1))}><ArrowLeft size={18} /></button><strong>15–21 tháng 7</strong><button className="icon-button" onClick={() => setDayIndex((v) => Math.min(6, v + 1))}><ArrowRight size={18} /></button></div></section>
    <div className="day-tabs">{weekPlan.map((item, index) => <button key={item.date} className={index === dayIndex ? "active" : ""} onClick={() => setDayIndex(index)}><span>{item.day.replace("Thứ ", "T")}</span><strong>{item.date.split("/")[0]}</strong></button>)}</div>
    <section className="plan-layout">
      <div className="plan-list">
        <div className="section-heading"><div><span className="section-kicker">{day.day.toUpperCase()} · {day.date}</span><h2>Hôm nay ăn gì?</h2></div><span className="status-pill"><span /> Cân bằng 96%</span></div>
        {day.meals.map(({ slot, meal }, index) => {
          const locked = !subscribed && (dayIndex > 0 || index > 0);
          return <article className={`plan-item ${locked ? "plan-item--locked" : ""}`} key={`${day.date}-${slot}`}>
            <div className="plan-item__time"><span>{slot}</span><small>{slot === "Sáng" ? "07:30" : slot === "Trưa" ? "12:00" : "18:30"}</small></div>
            <div className="plan-item__image"><Image src={meal.image} alt={meal.name} fill sizes="140px" /></div>
            <div className="plan-item__body"><h3>{meal.name}</h3><p>{meal.subtitle}</p><div className="meal-card__meta"><span>{meal.calories} kcal</span><span>{meal.protein}g protein</span><span>{meal.prepTime} phút</span></div></div>
            {locked ? <button className="locked-button" onClick={onSubscribe}><LockKeyhole size={17} /> Mở khóa</button> : <div className="plan-item__actions"><button className="icon-button" title="Ghi đã ăn" onClick={() => onAdd(meal)}><Check size={18} /></button><button className="button button--outline button--small" onClick={() => onMeal(meal)}>Xem món</button></div>}
            {locked && <div className="plan-item__veil" />}
          </article>;
        })}
      </div>
      <aside className="plan-aside">
        <div className="aside-card"><span className="section-kicker">TỔNG DINH DƯỠNG</span><h3>{day.day}</h3><MacroRow label="Protein" value={108} target={112} color="var(--coral)" /><MacroRow label="Carbs" value={170} target={181} color="var(--amber)" /><MacroRow label="Chất béo" value={57} target={52} color="var(--mint-dark)" /><div className="aside-total"><span>Tổng năng lượng</span><strong>1.576 kcal</strong></div></div>
        {!subscribed && <div className="aside-card aside-card--dark"><Sparkles size={24} /><h3>Mở toàn bộ kế hoạch</h3><p>Xem Recipe, định lượng và đổi món trong cả tuần.</p><button className="button button--cream" onClick={onSubscribe}>Dùng thử 7 ngày</button></div>}
      </aside>
    </section>
  </div>;
}

function KitchenPage({ subscribed, onOrder }: { subscribed: boolean; onOrder: (offer: KitchenOffer) => void }) {
  const [query, setQuery] = useState("");
  const offers = kitchenOffers.filter((offer) => `${offer.title} ${offer.kitchen}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="page-content">
    <section className="page-title"><div><p className="eyebrow">BẾP ĐỐI TÁC</p><h1>Bữa ăn phù hợp, giao tận nơi</h1><p>Mua món lẻ hoặc gói ăn mà không cần NutriPlan Subscription.</p></div><span className="independent-pill"><ShieldCheck size={17} /> Không yêu cầu Plus</span></section>
    <div className="market-toolbar"><div className="search-box"><Search size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm món hoặc tên bếp..." /></div><button className="filter-button"><MapPin size={17} /> Quận 3 <ChevronDown size={15} /></button><button className="filter-button"><Utensils size={17} /> Tất cả món <ChevronDown size={15} /></button></div>
    <div className="market-note"><div><Sparkles size={19} /><span>{subscribed ? "Bạn đang dùng Plus: món được giao sẽ tự động ghi vào Meal Log." : "Bạn vẫn có thể mua bình thường. Đăng ký Plus chỉ cần khi muốn tự động theo dõi dinh dưỡng."}</span></div></div>
    <section className="offer-grid">{offers.map((offer) => <article className="offer-card" key={offer.id}><div className="offer-card__image"><Image src={offer.image} alt={offer.title} fill sizes="(max-width: 800px) 100vw, 33vw" /><span className="offer-badge">{offer.badge}</span><span className="offer-type">{offer.type}</span></div><div className="offer-card__body"><div className="kitchen-name"><ChefHat size={15} /> {offer.kitchen}<span><Star size={14} fill="currentColor" /> {offer.rating} ({offer.reviews})</span></div><h3>{offer.title}</h3><p>{offer.description}</p><div className="offer-nutrition"><span><Flame size={15} /> {offer.calories} kcal</span><span><Target size={15} /> {offer.protein}g protein</span></div><div className="offer-delivery"><Clock3 size={15} /> {offer.delivery}</div><div className="offer-footer"><div><strong>{formatCurrency(offer.price)}</strong>{offer.oldPrice && <del>{formatCurrency(offer.oldPrice)}</del>}</div><button className="button button--dark" onClick={() => onOrder(offer)}>Chọn món <ArrowRight size={16} /></button></div></div></article>)}</section>
    {offers.length === 0 && <div className="empty-state"><Search size={30} /><h3>Không tìm thấy món phù hợp</h3><p>Thử từ khóa khác hoặc bỏ bớt bộ lọc.</p></div>}
  </div>;
}

function JournalPage({ subscribed, journal, nutrition, consumed, onAnalyze, onSubscribe }: { subscribed: boolean; journal: JournalEntry[]; nutrition: ReturnType<typeof calculateNutrition>; consumed: { calories: number; protein: number; carbs: number; fat: number }; onAnalyze: () => void; onSubscribe: () => void }) {
  return <div className="page-content">
    <section className="page-title"><div><p className="eyebrow">NHẬT KÝ DINH DƯỠNG</p><h1>Hôm nay bạn đã ăn gì?</h1><p>Ghi lại bữa ăn và theo dõi mức độ bám sát kế hoạch.</p></div><button className="button button--dark" onClick={onAnalyze}><Camera size={18} /> Phân tích ảnh món ăn</button></section>
    {!subscribed && <section className="paywall-banner"><div className="paywall-banner__icon"><LockKeyhole /></div><div><span className="section-kicker">TÍNH NĂNG PLUS</span><h2>Nhật ký và phân tích dành cho subscriber</h2><p>Đăng ký để lưu Meal Log, phân tích ảnh và xem mức độ tuân thủ theo ngày.</p></div><button className="button button--cream" onClick={onSubscribe}>Dùng thử 7 ngày <ArrowRight size={17} /></button></section>}
    <section className={`journal-layout ${!subscribed ? "journal-layout--muted" : ""}`}>
      <div className="journal-list-card"><div className="section-heading"><div><span className="section-kicker">15 THÁNG 7</span><h2>Meal Log hôm nay</h2></div><span className="status-pill"><span /> {journal.length} bữa đã ghi</span></div>{journal.map((entry) => <article className="journal-entry" key={entry.id}>{entry.image ? <div className="journal-entry__thumb"><Image src={entry.image} alt="Ảnh món ăn" width={46} height={46} unoptimized /></div> : <div className="journal-entry__icon"><Utensils size={20} /></div>}<div className="journal-entry__body"><div><span>{entry.slot} · {entry.time}</span><h3>{entry.name}</h3></div><small className={`source-tag source-tag--${entry.source === "Bếp đối tác" ? "kitchen" : entry.source === "Ảnh ước tính" ? "image" : "plan"}`}>{entry.source}</small></div><div className="journal-entry__numbers"><strong>{entry.calories} kcal</strong><span>P {entry.protein}g · C {entry.carbs}g · F {entry.fat}g</span></div></article>)}</div>
      <aside className="journal-aside"><div className="adherence-card"><span className="section-kicker">MỨC ĐỘ TUÂN THỦ</span><ProgressRing progress={Math.min(100, Math.round((consumed.calories / nutrition.target) * 100))} label={`${Math.min(100, Math.round((consumed.calories / nutrition.target) * 100))}%`} sublabel="mục tiêu" /><p>Bạn đang đi đúng hướng. Hãy ghi thêm bữa tối để hoàn tất ngày hôm nay.</p></div><div className="aside-card"><h3>Tổng hôm nay</h3><div className="summary-line"><span>Năng lượng</span><strong>{consumed.calories} / {nutrition.target} kcal</strong></div><div className="summary-line"><span>Protein</span><strong>{consumed.protein} / {nutrition.protein}g</strong></div><div className="summary-line"><span>Carbs</span><strong>{consumed.carbs} / {nutrition.carbs}g</strong></div><div className="summary-line"><span>Chất béo</span><strong>{consumed.fat} / {nutrition.fat}g</strong></div></div></aside>
    </section>
  </div>;
}

function MealModal({ meal, subscribed, onClose, onSubscribe, onAdd }: { meal: Meal; subscribed: boolean; onClose: () => void; onSubscribe: () => void; onAdd: () => void }) {
  return <Modal onClose={onClose} wide><div className="meal-modal"><div className="meal-modal__hero"><Image src={meal.image} alt={meal.name} fill sizes="680px" /><button className="modal-close modal-close--image" onClick={onClose}><X size={19} /></button><div className="meal-modal__hero-text"><div className="tag-list">{meal.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><h2>{meal.name}</h2><p>{meal.subtitle}</p></div></div><div className="meal-modal__content"><div className="nutrition-strip"><Metric label="Năng lượng" value={`${meal.calories}`} unit="kcal" /><Metric label="Protein" value={`${meal.protein}`} unit="g" /><Metric label="Carbs" value={`${meal.carbs}`} unit="g" /><Metric label="Chất béo" value={`${meal.fat}`} unit="g" /></div>{subscribed ? <div className="recipe-grid"><div><span className="section-kicker">NGUYÊN LIỆU · 1 KHẨU PHẦN</span><ul className="check-list">{meal.ingredients.map((item) => <li key={item}><Check size={15} /> {item}</li>)}</ul></div><div><span className="section-kicker">CÁCH LÀM · {meal.prepTime} PHÚT</span><ol className="step-list">{meal.instructions.map((item, index) => <li key={item}><span>{index + 1}</span><p>{item}</p></li>)}</ol></div></div> : <div className="inline-paywall"><LockKeyhole size={26} /><div><h3>Recipe chi tiết dành cho Plus</h3><p>Mở khóa định lượng nguyên liệu, cách làm và lưu vào kế hoạch.</p></div><button className="button button--dark" onClick={onSubscribe}>Dùng thử miễn phí</button></div>}<div className="modal-actions"><button className="button button--outline" onClick={onClose}>Đóng</button>{subscribed && <button className="button button--dark" onClick={onAdd}><Check size={17} /> Ghi đã ăn</button>}</div></div></div></Modal>;
}

function OrderModal({ offer, subscribed, onClose, onComplete }: { offer: KitchenOffer; subscribed: boolean; onClose: () => void; onComplete: () => void }) {
  const [quantity, setQuantity] = useState(1);
  const [step, setStep] = useState<1 | 2>(1);
  return <Modal onClose={onClose}><div className="modal-header"><div><span className="section-kicker">ĐẶT MÓN TỪ BẾP</span><h2>{step === 1 ? "Thông tin đơn hàng" : "Xác nhận thanh toán"}</h2></div><button className="modal-close" onClick={onClose}><X size={19} /></button></div><div className="order-summary"><div className="order-summary__image"><Image src={offer.image} alt={offer.title} fill sizes="90px" /></div><div><small>{offer.kitchen} · {offer.type}</small><h3>{offer.title}</h3><span>{offer.calories} kcal · {offer.protein}g protein</span></div></div>{step === 1 ? <div className="form-stack"><label>Họ tên người nhận<input defaultValue="Nguyễn Minh Anh" /></label><div className="form-grid"><label>Số điện thoại<input defaultValue="090 123 4567" /></label><label>Khung giờ giao<select defaultValue="12:00 – 12:30"><option>11:30 – 12:00</option><option>12:00 – 12:30</option><option>12:30 – 13:00</option></select></label></div><label>Địa chỉ giao<input defaultValue="227 Nguyễn Văn Cừ, Quận 5, TP.HCM" /></label><label>Dị ứng hoặc ghi chú<input defaultValue="Không có" /></label><div className="quantity-line"><span>Số lượng</span><div><button onClick={() => setQuantity((v) => Math.max(1, v - 1))}><Minus size={16} /></button><strong>{quantity}</strong><button onClick={() => setQuantity((v) => v + 1)}><Plus size={16} /></button></div></div><div className="independent-note"><ShieldCheck size={18} /><span>Đơn bếp độc lập với NutriPlan Subscription. Bạn không bị đăng ký thêm dịch vụ.</span></div></div> : <div className="payment-demo"><div className="payment-demo__icon"><PackageCheck /></div><h3>Thanh toán mô phỏng</h3><p>MVP sử dụng luồng thanh toán demo. Không có khoản tiền thật nào được thu.</p><div className="price-breakdown"><span>Tạm tính <strong>{formatCurrency(offer.price * quantity)}</strong></span><span>Phí giao <strong>{formatCurrency(0)}</strong></span><span className="price-breakdown__total">Tổng cộng <strong>{formatCurrency(offer.price * quantity)}</strong></span></div>{subscribed && <div className="plus-note"><Sparkles size={17} /> Khi giao thành công, món sẽ tự động vào Meal Log.</div>}</div>}<div className="modal-actions"><button className="button button--outline" onClick={() => step === 1 ? onClose() : setStep(1)}>{step === 1 ? "Hủy" : "Quay lại"}</button><button className="button button--dark" onClick={() => step === 1 ? setStep(2) : onComplete()}>{step === 1 ? "Tiếp tục" : "Xác nhận đặt món"} <ArrowRight size={17} /></button></div></Modal>;
}

function ProfileModal({ value, onClose, onSave }: { value: Profile; onClose: () => void; onSave: (value: Profile) => void }) {
  const [form, setForm] = useState(value);
  const update = <K extends keyof Profile>(key: K, next: Profile[K]) => setForm((current) => ({ ...current, [key]: next }));
  return <Modal onClose={onClose}><form onSubmit={(event) => { event.preventDefault(); onSave(form); }}><div className="modal-header"><div><span className="section-kicker">HỒ SƠ DINH DƯỠNG</span><h2>Cập nhật chỉ số</h2></div><button type="button" className="modal-close" onClick={onClose}><X size={19} /></button></div><div className="form-stack"><label>Họ tên<input value={form.name} onChange={(e) => update("name", e.target.value)} required /></label><div className="form-grid"><label>Giới tính<select value={form.gender} onChange={(e) => update("gender", e.target.value as Profile["gender"])}><option value="female">Nữ</option><option value="male">Nam</option></select></label><label>Tuổi<input type="number" value={form.age} onChange={(e) => update("age", Number(e.target.value))} min={16} max={80} /></label></div><div className="form-grid"><label>Chiều cao (cm)<input type="number" value={form.height} onChange={(e) => update("height", Number(e.target.value))} /></label><label>Cân nặng (kg)<input type="number" value={form.weight} onChange={(e) => update("weight", Number(e.target.value))} /></label></div><label>Mức vận động<select value={form.activity} onChange={(e) => update("activity", Number(e.target.value))}><option value={1.2}>Ít vận động</option><option value={1.375}>Nhẹ · 1–3 buổi/tuần</option><option value={1.55}>Vừa · 3–5 buổi/tuần</option><option value={1.725}>Cao · 6–7 buổi/tuần</option></select></label><label>Mục tiêu<select value={form.goal} onChange={(e) => update("goal", e.target.value as Profile["goal"])}><option value="lose">Giảm mỡ lành mạnh</option><option value="maintain">Duy trì cân nặng</option><option value="gain">Tăng cơ</option></select></label><label>Dị ứng thực phẩm<input value={form.allergies} onChange={(e) => update("allergies", e.target.value)} /></label><div className="medical-note"><ShieldCheck size={18} /><span>Kết quả chỉ hỗ trợ lập kế hoạch, không thay thế tư vấn y khoa.</span></div></div><div className="modal-actions"><button type="button" className="button button--outline" onClick={onClose}>Hủy</button><button className="button button--dark" type="submit">Lưu và tính lại</button></div></form></Modal>;
}

function SubscriptionModal({ onClose, onActivate }: { onClose: () => void; onActivate: () => void }) {
  return <Modal onClose={onClose}><div className="subscription-modal"><button className="modal-close subscription-modal__close" onClick={onClose}><X size={19} /></button><div className="subscription-modal__mark"><Sparkles /></div><span className="section-kicker">NUTRIPLAN PLUS</span><h2>Ăn đúng kế hoạch,<br />nhẹ đầu mỗi ngày.</h2><p>Mở khóa bộ công cụ giúp bạn biến mục tiêu thành thói quen thực tế.</p><div className="benefit-list"><div><CheckCircle2 /><span><strong>Thực đơn 7 ngày</strong><small>Recipe, định lượng và dinh dưỡng chi tiết</small></span></div><div><CheckCircle2 /><span><strong>Meal Log & báo cáo</strong><small>Theo dõi mức độ tuân thủ mỗi ngày</small></span></div><div><CheckCircle2 /><span><strong>Meal Scan Beta</strong><small>Ước tính món từ ảnh, bạn luôn là người xác nhận</small></span></div></div><div className="subscription-price"><div><strong>49.000đ</strong><span>/ tháng sau dùng thử</span></div><small>Hủy bất kỳ lúc nào · Không bao gồm tiền món bếp</small></div><button className="button button--cream button--full" onClick={onActivate}>Bắt đầu dùng thử 7 ngày <ArrowRight size={18} /></button><small className="demo-caption">Bản MVP mô phỏng — không phát sinh thanh toán thật.</small></div></Modal>;
}

function ImageAnalysisModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: (entry: JournalEntry) => void }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(false);
  const [portion, setPortion] = useState(1);
  const onFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    setAnalyzing(true);
    setResult(false);
    window.setTimeout(() => { setAnalyzing(false); setResult(true); }, 1500);
  };
  const entry: JournalEntry = { id: `scan-${Date.now()}`, name: "Cơm gà rau củ (ước tính)", slot: "Bữa được quét", calories: Math.round(568 * portion), protein: Math.round(41 * portion), carbs: Math.round(64 * portion), fat: Math.round(17 * portion), source: "Ảnh ước tính", time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }), image: preview || undefined };
  return <Modal onClose={onClose}><div className="modal-header"><div><span className="section-kicker">MEAL SCAN BETA</span><h2>Phân tích ảnh món ăn</h2></div><button className="modal-close" onClick={onClose}><X size={19} /></button></div>{!preview ? <label className="upload-zone"><input type="file" accept="image/*" onChange={onFile} /><span className="upload-zone__icon"><ImagePlus size={28} /></span><h3>Tải ảnh bữa ăn hôm nay</h3><p>Ảnh rõ, đủ sáng và chụp từ trên xuống sẽ cho kết quả tốt hơn.</p><span className="button button--outline">Chọn ảnh</span></label> : <div className="analysis-workspace"><div className="analysis-image"><Image src={preview} alt="Món ăn cần phân tích" fill sizes="(max-width: 580px) 100vw, 280px" unoptimized />{analyzing && <div className="analysis-loading"><WandSparkles size={25} /><strong>Đang nhận diện món...</strong><span>So khớp với thư viện dinh dưỡng</span></div>}</div>{result && <div className="analysis-result"><div className="confidence"><span>Độ tin cậy</span><strong>82%</strong></div><label>Tên món<input defaultValue="Cơm gà rau củ" /></label><div className="quantity-line"><span>Khẩu phần ước tính</span><div><button onClick={() => setPortion((v) => Math.max(0.5, v - 0.25))}><Minus size={16} /></button><strong>{portion} phần</strong><button onClick={() => setPortion((v) => Math.min(2, v + 0.25))}><Plus size={16} /></button></div></div><div className="nutrition-strip nutrition-strip--compact"><Metric label="Kcal" value={`${entry.calories}`} unit="" /><Metric label="Đạm" value={`${entry.protein}`} unit="g" /><Metric label="Carbs" value={`${entry.carbs}`} unit="g" /><Metric label="Béo" value={`${entry.fat}`} unit="g" /></div><div className="estimate-note"><Sparkles size={17} /><span>Đây là số liệu ước tính. Hãy sửa món hoặc khẩu phần trước khi xác nhận.</span></div></div>}</div>}<div className="modal-actions"><button className="button button--outline" onClick={onClose}>Hủy</button>{result && <button className="button button--dark" onClick={() => onConfirm(entry)}><Check size={17} /> Xác nhận và lưu</button>}</div></Modal>;
}

function Modal({ children, onClose, wide = false }: { children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return <div className="modal-backdrop" onMouseDown={onClose}><div className={`modal ${wide ? "modal--wide" : ""}`} onMouseDown={(event) => event.stopPropagation()}>{children}</div></div>;
}
