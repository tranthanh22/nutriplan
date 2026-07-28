"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import {
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  ChefHat,
  ChevronDown,
  CircleUserRound,
  Home,
  Leaf,
  Menu,
  Sparkles
} from "lucide-react";
import type { Profile, View } from "@/types/app";
import { AccountMenu } from "@/components/layout/account-menu";

const viewLabels: Record<View, string> = {
  home: "Tổng quan",
  plan: "Thực đơn",
  kitchens: "Bếp đối tác",
  journal: "Nhật ký"
};

export function AppNavigation({
  children,
  view,
  profile,
  subscribed,
  mobileOpen,
  loadingProfile = false,
  onNavigate,
  onOpenMobile,
  onCloseMobile,
  onOpenProfile,
  onSubscribe,
  onLogout
}: {
  children: ReactNode;
  view: View;
  profile: Profile;
  subscribed: boolean;
  mobileOpen: boolean;
  loadingProfile?: boolean;
  onNavigate: (view: View) => void;
  onOpenMobile: () => void;
  onCloseMobile: () => void;
  onOpenProfile: () => void;
  onSubscribe: () => void;
  onLogout: () => void;
}) {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  return (
    <>
      <aside className={`sidebar ${mobileOpen ? "sidebar--open" : ""}`}>
        <div className="brand" onClick={() => onNavigate("home")} role="button" tabIndex={0}>
          <span className="brand__mark"><Leaf size={21} strokeWidth={2.5} /></span>
          <span>NutriPlan</span>
        </div>
        <nav className="nav-list" aria-label="Điều hướng chính">
          <NavButton active={view === "home"} icon={<Home size={19} />} label="Tổng quan" onClick={() => onNavigate("home")} />
          <NavButton active={view === "plan"} icon={<CalendarDays size={19} />} label="Thực đơn của tôi" onClick={() => onNavigate("plan")} />
          <NavButton active={view === "kitchens"} icon={<ChefHat size={19} />} label="Bếp đối tác" onClick={() => onNavigate("kitchens")} />
          <NavButton active={view === "journal"} icon={<BarChart3 size={19} />} label="Nhật ký dinh dưỡng" onClick={() => onNavigate("journal")} />
        </nav>
        <div className="sidebar__spacer" />
        <div className={`membership-card ${subscribed ? "membership-card--active" : ""}`}>
          <div className="membership-card__icon">{subscribed ? <Check size={17} /> : <Sparkles size={17} />}</div>
          <strong>{subscribed ? "NutriPlan Plus" : "Mở khóa kế hoạch"}</strong>
          <p>{subscribed ? "Đang dùng thử · còn 7 ngày" : "Recipe chi tiết, nhật ký và phân tích ảnh."}</p>
          {!subscribed && <button className="button button--dark button--small" onClick={onSubscribe}>Dùng thử miễn phí</button>}
        </div>

        {/* User chip — opens account menu */}
        <div className="user-chip-wrapper">
          {loadingProfile ? (
            <div className="user-chip user-chip--skeleton">
              <div className="avatar-skeleton ob-skeleton-pulse" />
              <div className="user-info-skeleton">
                <div className="skeleton-line skeleton-line--title ob-skeleton-pulse" />
                <div className="skeleton-line skeleton-line--sub ob-skeleton-pulse" />
              </div>
            </div>
          ) : (
            <button
              className="user-chip"
              onClick={() => setAccountMenuOpen((prev) => !prev)}
              aria-haspopup="menu"
              aria-expanded={accountMenuOpen}
            >
              <span className="avatar">
                {profile.name
                  ? profile.name.trim().split(/\s+/).map((n) => n[0]).join("").slice(0, 2).toUpperCase()
                  : "NP"}
              </span>
              <span><strong>{profile.name}</strong><small>{subscribed ? "Thành viên Plus" : "Tài khoản miễn phí"}</small></span>
              <ChevronDown
                size={16}
                style={{
                  transition: "transform 0.2s",
                  transform: accountMenuOpen ? "rotate(180deg)" : "rotate(0deg)"
                }}
              />
            </button>
          )}

          {accountMenuOpen && (
            <AccountMenu
              onOpenProfile={onOpenProfile}
              onLogout={onLogout}
              onClose={() => setAccountMenuOpen(false)}
            />
          )}
        </div>
      </aside>

      {mobileOpen && <button className="mobile-backdrop" aria-label="Đóng menu" onClick={onCloseMobile} />}

      <main className="main-area">
        <header className="topbar">
          <button className="icon-button topbar__menu" aria-label="Mở menu" onClick={onOpenMobile}><Menu size={21} /></button>
          <div className="topbar__crumb"><span>NutriPlan</span><span>/</span><strong>{viewLabels[view]}</strong></div>
          <div className="topbar__actions">
            <button className="icon-button" aria-label="Thông báo"><Bell size={19} /><span className="notification-dot" /></button>
            <button className="profile-button" onClick={() => setAccountMenuOpen((prev) => !prev)}><CircleUserRound size={19} /> Hồ sơ <ChevronDown size={15} /></button>
          </div>
        </header>
        {children}
      </main>
    </>
  );
}

function NavButton({
  active,
  icon,
  label,
  onClick
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return <button className={`nav-button ${active ? "nav-button--active" : ""}`} onClick={onClick}>{icon}<span>{label}</span></button>;
}
