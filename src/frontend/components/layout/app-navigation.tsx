"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
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
  LogIn,
  Menu,
  Settings,
  Sparkles
} from "lucide-react";
import type { Profile, View } from "@/types/app";
import { createClient } from "@/lib/supabase/client";

const viewLabels: Record<View, string> = {
  home: "Tổng quan",
  plan: "Thực đơn",
  kitchens: "Bếp đối tác",
  journal: "Nhật ký",
  settings: "Cài đặt"
};

export function AppNavigation({
  children,
  view,
  profile,
  subscribed,
  mobileOpen,
  onNavigate,
  onOpenMobile,
  onCloseMobile,
  onOpenProfile,
  onSubscribe
}: {
  children: ReactNode;
  view: View;
  profile: Profile;
  subscribed: boolean;
  mobileOpen: boolean;
  onNavigate: (view: View) => void;
  onOpenMobile: () => void;
  onCloseMobile: () => void;
  onOpenProfile: () => void;
  onSubscribe: () => void;
}) {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let active = true;
    try {
      const supabase = createClient();
      void supabase.auth.getUser().then(({ data }: { data: { user: User | null } }) => {
        if (active) setSignedIn(Boolean(data.user));
      });
      const { data } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
        if (active) setSignedIn(Boolean(session?.user));
      });
      return () => {
        active = false;
        data.subscription.unsubscribe();
      };
    } catch {
      return () => {
        active = false;
      };
    }
  }, []);

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
          <NavButton active={view === "settings"} icon={<Settings size={19} />} label="Cài đặt" onClick={() => onNavigate("settings")} />
        </nav>
        <div className="sidebar__spacer" />
        <div className={`membership-card ${subscribed ? "membership-card--active" : ""}`}>
          <div className="membership-card__icon">{subscribed ? <Check size={17} /> : <Sparkles size={17} />}</div>
          <strong>{subscribed ? "NutriPlan Plus" : "Mở khóa kế hoạch"}</strong>
          <p>{subscribed ? "Đang dùng thử · còn 7 ngày" : "Recipe chi tiết, nhật ký và phân tích ảnh."}</p>
          {!subscribed && <button className="button button--dark button--small" onClick={onSubscribe}>Dùng thử miễn phí</button>}
        </div>
        <button className="user-chip" onClick={onOpenProfile}>
          <span className="avatar">MA</span>
          <span><strong>{profile.name}</strong><small>{subscribed ? "Thành viên Plus" : "Tài khoản miễn phí"}</small></span>
          <ChevronDown size={16} />
        </button>
      </aside>

      {mobileOpen && <button className="mobile-backdrop" aria-label="Đóng menu" onClick={onCloseMobile} />}

      <main className="main-area">
        <header className="topbar">
          <button className="icon-button topbar__menu" aria-label="Mở menu" onClick={onOpenMobile}><Menu size={21} /></button>
          <div className="topbar__crumb"><span>NutriPlan</span><span>/</span><strong>{viewLabels[view]}</strong></div>
          <div className="topbar__actions">
            <button className="icon-button" aria-label="Thông báo"><Bell size={19} /><span className="notification-dot" /></button>
            {signedIn ? (
              <button className="profile-button" onClick={onOpenProfile}><CircleUserRound size={19} /> Hồ sơ <ChevronDown size={15} /></button>
            ) : (
              <Link className="profile-button profile-button--link" href="/login"><LogIn size={18} /> Đăng nhập</Link>
            )}
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
