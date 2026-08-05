"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import {
  BarChart3,
  CalendarDays,
  Check,
  ChefHat,
  ChevronDown,
  ClipboardList,
  Home,
  Leaf,
  LogIn,
  Menu,
  Settings,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import type { AppRole, Profile, View } from "@/types/app";
import { createClient } from "@/lib/supabase/client";
import type { CurrentSubscription } from "@/features/settings/settings-api";

export function AppNavigation({
  children,
  view,
  profile,
  role,
  subscribed,
  subscription,
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
  role: AppRole | null;
  subscribed: boolean;
  subscription: CurrentSubscription;
  mobileOpen: boolean;
  onNavigate: (view: View) => void;
  onOpenMobile: () => void;
  onCloseMobile: () => void;
  onOpenProfile: () => void;
  onSubscribe: () => void;
}) {
  const [signedIn, setSignedIn] = useState(false);
  const initials = profile.name === "Bạn"
    ? "NP"
    : profile.name
        .trim()
        .split(/\s+/)
        .slice(-2)
        .map((part) => part[0]?.toLocaleUpperCase("vi"))
        .join("");
  const remainingDays = subscribed && subscription?.current_period_end
    ? Math.max(1, Math.ceil((new Date(subscription.current_period_end).getTime() - Date.now()) / 86_400_000))
    : 0;
  const membershipDescription = subscribed
    ? subscription?.provider === "internal_trial"
      ? `Đang dùng thử · còn ${remainingDays} ngày`
      : `Plus đang hoạt động · còn ${remainingDays} ngày`
    : "Recipe chi tiết, nhật ký và phân tích ảnh.";

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
          <span className="brand__mark"><Leaf size={24} strokeWidth={2.5} /></span>
          <span>NutriPlan</span>
        </div>
        <nav className="nav-list" aria-label="Điều hướng chính">
          <NavButton active={view === "home"} icon={<Home size={21} />} label="Tổng quan" onClick={() => onNavigate("home")} />
          <NavButton active={view === "plan"} icon={<CalendarDays size={21} />} label="Thực đơn của tôi" onClick={() => onNavigate("plan")} />
          <NavButton active={view === "kitchens"} icon={<ChefHat size={21} />} label="Bếp đối tác" onClick={() => onNavigate("kitchens")} />
          <NavButton active={view === "journal"} icon={<BarChart3 size={21} />} label="Nhật ký dinh dưỡng" onClick={() => onNavigate("journal")} />
          {(role === "kitchen_staff" || role === "admin") ? <NavButton active={view === "kitchen-management"} icon={<ClipboardList size={21} />} label="Quản lý nhà bếp" onClick={() => onNavigate("kitchen-management")} /> : null}
          {role === "admin" ? <NavButton active={view === "admin"} icon={<ShieldCheck size={21} />} label="Quản trị hệ thống" onClick={() => onNavigate("admin")} /> : null}
          <NavButton active={view === "settings"} icon={<Settings size={21} />} label="Cài đặt" onClick={() => onNavigate("settings")} />
        </nav>
        <div className="sidebar__spacer" />
        <div className={`membership-card ${subscribed ? "membership-card--active" : ""}`}>
          <div className="membership-card__icon">{subscribed ? <Check size={20} /> : <Sparkles size={20} />}</div>
          <strong>{subscribed ? "NutriPlan Plus" : "Mở khóa kế hoạch"}</strong>
          <p>{membershipDescription}</p>
          {!subscribed && <button className="button button--dark button--small" onClick={onSubscribe}>Dùng thử miễn phí</button>}
        </div>
        {signedIn ? (
          <button className="sidebar-profile" onClick={onOpenProfile}>
            <span className="sidebar-profile__avatar">{initials}</span>
            <span>
              <strong>{profile.name}</strong>
              <small>{subscribed ? "Thành viên Plus" : "Tài khoản miễn phí"}</small>
            </span>
            <ChevronDown size={18} />
          </button>
        ) : (
          <Link className="sidebar-profile sidebar-profile--login" href="/login">
            <span className="sidebar-profile__avatar"><LogIn size={20} /></span>
            <span><strong>Đăng nhập</strong><small>Mở hồ sơ cá nhân</small></span>
          </Link>
        )}
      </aside>

      {mobileOpen && <button className="mobile-backdrop" aria-label="Đóng menu" onClick={onCloseMobile} />}

      <button
        aria-expanded={mobileOpen}
        aria-label="Mở menu điều hướng"
        className="mobile-menu-fab"
        onClick={onOpenMobile}
      >
        <Menu size={23} />
      </button>

      <main className="main-area">
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
