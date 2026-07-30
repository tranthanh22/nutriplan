"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  CalendarCheck2,
  Check,
  ChefHat,
  HeartPulse,
  Leaf,
  Menu,
  Sparkles,
  X
} from "lucide-react";
import { useState } from "react";

const steps = [
  {
    icon: HeartPulse,
    number: "01",
    title: "Tạo hồ sơ dinh dưỡng",
    description:
      "Nhập chiều cao, cân nặng, mức vận động và mục tiêu sức khỏe."
  },
  {
    icon: BrainCircuit,
    number: "02",
    title: "Nhận phân tích AI",
    description:
      "NutriPlan tính BMR, TDEE, calorie, macro và giải thích dữ liệu của bạn."
  },
  {
    icon: CalendarCheck2,
    number: "03",
    title: "Theo thực đơn cá nhân",
    description:
      "Nhận kế hoạch theo ngày, đổi món tương đương và ghi nhận bữa đã ăn."
  },
  {
    icon: ChefHat,
    number: "04",
    title: "Đặt món từ bếp đối tác",
    description:
      "Chọn món lẻ hoặc gói 7, 30, 120 ngày mà không bắt buộc mua Plus."
  }
] as const;

const sampleMeals = [
  {
    name: "Cháo yến mạch hoa quả",
    image: "/images/figma/oatmeal-fruit.jpg",
    calories: 320,
    protein: 12,
    tag: "Bữa sáng"
  },
  {
    name: "Cơm gà nướng rau củ",
    image: "/images/figma/chicken-vegetable-bowl.jpg",
    calories: 480,
    protein: 35,
    tag: "Giàu protein"
  },
  {
    name: "Salad gà áp chảo",
    image: "/images/figma/chicken-salad.jpg",
    calories: 420,
    protein: 40,
    tag: "Ít tinh bột"
  },
  {
    name: "Cá hồi nướng rau xanh",
    image: "/images/figma/grilled-salmon.jpg",
    calories: 490,
    protein: 36,
    tag: "Omega-3"
  }
] as const;

export function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <main className="landing-page">
      <header className="landing-header">
        <div className="landing-container landing-header__inner">
          <Link className="landing-brand" href="/">
            <span>
              <Leaf size={20} />
            </span>
            NutriPlan
          </Link>
          <nav className="landing-nav" aria-label="Điều hướng trang giới thiệu">
            <a href="#how">Cách hoạt động</a>
            <a href="#menu">Thực đơn mẫu</a>
            <a href="#plans">Gói dịch vụ</a>
          </nav>
          <div className="landing-auth-actions">
            <Link className="landing-login-link" href="/login">
              Đăng nhập
            </Link>
            <Link className="button button--primary" href="/register">
              Đăng ký miễn phí
            </Link>
          </div>
          <button
            className="landing-mobile-toggle"
            type="button"
            aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
        {mobileOpen ? (
          <div className="landing-mobile-menu">
            <a href="#how" onClick={() => setMobileOpen(false)}>
              Cách hoạt động
            </a>
            <a href="#menu" onClick={() => setMobileOpen(false)}>
              Thực đơn mẫu
            </a>
            <a href="#plans" onClick={() => setMobileOpen(false)}>
              Gói dịch vụ
            </a>
            <Link href="/login">Đăng nhập</Link>
            <Link className="button button--primary" href="/register">
              Đăng ký miễn phí
            </Link>
          </div>
        ) : null}
      </header>

      <section className="landing-hero">
        <div className="landing-container landing-hero__grid">
          <div className="landing-hero__copy">
            <span className="landing-pill">
              <Sparkles size={15} /> Dinh dưỡng cá nhân hóa bằng dữ liệu
            </span>
            <h1>
              Ăn đúng mục tiêu,
              <span> nhẹ đầu mỗi ngày.</span>
            </h1>
            <p>
              NutriPlan phân tích chỉ số sức khỏe, xây thực đơn phù hợp và kết
              nối bạn với các bếp ăn đã xác minh.
            </p>
            <div className="landing-hero__actions">
              <Link className="button button--primary" href="/register">
                Bắt đầu miễn phí <ArrowRight size={17} />
              </Link>
              <Link className="button button--outline" href="/login">
                Tôi đã có tài khoản
              </Link>
            </div>
            <div className="landing-proof">
              <div>
                <strong>20+</strong>
                <span>bếp đối tác</span>
              </div>
              <div>
                <strong>4</strong>
                <span>loại gói linh hoạt</span>
              </div>
              <div>
                <strong>24/7</strong>
                <span>trợ lý dinh dưỡng</span>
              </div>
            </div>
          </div>
          <div className="landing-hero__visual">
            <div className="landing-hero__image">
              <Image
                src="/images/figma/chicken-vegetable-bowl.jpg"
                alt="Suất ăn cân bằng của NutriPlan"
                fill
                priority
                sizes="(max-width: 760px) 94vw, 48vw"
              />
            </div>
            <div className="landing-floating-card landing-floating-card--top">
              <span>
                <BrainCircuit size={19} />
              </span>
              <div>
                <strong>AI Health Insight</strong>
                <small>Hiểu rõ dữ liệu của bạn</small>
              </div>
            </div>
            <div className="landing-floating-card landing-floating-card--bottom">
              <span>
                <Check size={19} />
              </span>
              <div>
                <strong>480 kcal · 35g protein</strong>
                <small>Cân bằng theo mục tiêu hôm nay</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section landing-section--white" id="how">
        <div className="landing-container">
          <div className="landing-section__heading">
            <span>ĐƠN GIẢN VÀ MINH BẠCH</span>
            <h2>Bắt đầu chỉ với 4 bước</h2>
            <p>Mỗi chức năng đều dựa trên dữ liệu và lựa chọn của bạn.</p>
          </div>
          <div className="landing-step-grid">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <article key={step.number}>
                  <div className="landing-step__icon">
                    <Icon size={22} />
                  </div>
                  <strong>{step.number}</strong>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="landing-section" id="menu">
        <div className="landing-container">
          <div className="landing-section__heading landing-section__heading--row">
            <div>
              <span>THỰC ĐƠN MẪU</span>
              <h2>Món ngon, macro rõ ràng</h2>
            </div>
            <Link href="/register">
              Tạo thực đơn của tôi <ArrowRight size={16} />
            </Link>
          </div>
          <div className="landing-meal-grid">
            {sampleMeals.map((meal) => (
              <article key={meal.name}>
                <div>
                  <Image
                    src={meal.image}
                    alt={meal.name}
                    fill
                    sizes="(max-width: 620px) 92vw, (max-width: 1000px) 45vw, 24vw"
                  />
                </div>
                <section>
                  <span>{meal.tag}</span>
                  <h3>{meal.name}</h3>
                  <p>
                    <strong>{meal.calories}</strong> kcal ·{" "}
                    <strong>{meal.protein}g</strong> protein
                  </p>
                </section>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section landing-section--plans" id="plans">
        <div className="landing-container landing-plans">
          <div>
            <span className="landing-pill landing-pill--light">
              NUTRIPLAN PLUS
            </span>
            <h2>Mở khóa kế hoạch và theo dõi chuyên sâu</h2>
            <p>
              Gói 7 ngày, 1 tháng và 3 tháng. Bạn vẫn có thể mua món từ bếp đối
              tác mà không cần Plus.
            </p>
          </div>
          <ul>
            <li>
              <Check size={17} /> Xem recipe và định lượng chi tiết
            </li>
            <li>
              <Check size={17} /> AI Insight và nhật ký dinh dưỡng
            </li>
            <li>
              <Check size={17} /> Phân tích ảnh món ăn
            </li>
          </ul>
          <Link className="button button--cream" href="/register">
            Tạo tài khoản <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-container">
          <Link className="landing-brand landing-brand--footer" href="/">
            <span>
              <Leaf size={20} />
            </span>
            NutriPlan
          </Link>
          <p>
            Công cụ hỗ trợ lập kế hoạch dinh dưỡng, không thay thế chẩn đoán
            hoặc tư vấn y khoa.
          </p>
          <small>© 2026 NutriPlan</small>
        </div>
      </footer>
    </main>
  );
}
