"use client";

import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export type MenuCalendarDay = {
  date: string;
  itemCount: number;
  completedCount: number;
  kitchenCount?: number;
};

const weekDays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

function parseDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function localTodayKey() {
  const today = new Date();
  const year = today.getFullYear();
  const month = `${today.getMonth() + 1}`.padStart(2, "0");
  const day = `${today.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function calendarCells(month: string) {
  const firstDay = parseDate(month);
  const startOffset = (firstDay.getUTCDay() + 6) % 7;
  const monthEnd = new Date(firstDay);
  monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1);
  monthEnd.setUTCDate(0);
  const cellCount = Math.ceil((startOffset + monthEnd.getUTCDate()) / 7) * 7;
  const gridStart = new Date(firstDay);
  gridStart.setUTCDate(gridStart.getUTCDate() - startOffset);

  return Array.from({ length: cellCount }, (_, index) => {
    const date = new Date(gridStart);
    date.setUTCDate(date.getUTCDate() + index);
    return dateKey(date);
  });
}

export function MenuCalendar({
  month,
  source,
  days,
  selectedDate,
  onMonthChange,
  onSelectDate
}: {
  month: string;
  source: "personal" | "kitchen";
  days: MenuCalendarDay[];
  selectedDate: string;
  onMonthChange: (offset: number) => void;
  onSelectDate: (date: string) => void;
}) {
  const dayMap = new Map(days.map((day) => [day.date, day]));
  const cells = calendarCells(month);
  const monthPrefix = month.slice(0, 7);
  const today = localTodayKey();
  const monthLabel = new Intl.DateTimeFormat("vi-VN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(parseDate(month));

  return (
    <section className="menu-calendar" aria-label="Lịch thực đơn">
      <header className="menu-calendar__header">
        <div>
          <span className="menu-calendar__icon"><CalendarDays size={21} /></span>
          <div>
            <span className="section-kicker">LỊCH THỰC ĐƠN</span>
            <h2>{monthLabel}</h2>
          </div>
        </div>
        <div className="menu-calendar__controls">
          <button type="button" aria-label="Tháng trước" onClick={() => onMonthChange(-1)}>
            <ChevronLeft size={20} />
          </button>
          <button type="button" onClick={() => onMonthChange(0)}>Hôm nay</button>
          <button type="button" aria-label="Tháng sau" onClick={() => onMonthChange(1)}>
            <ChevronRight size={20} />
          </button>
        </div>
      </header>

      <div className="menu-calendar__weekdays" aria-hidden="true">
        {weekDays.map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="menu-calendar__grid">
        {cells.map((date) => {
          const data = dayMap.get(date);
          const outside = !date.startsWith(monthPrefix);
          const selected = date === selectedDate;
          const completed = Boolean(data && data.itemCount > 0 && data.completedCount === data.itemCount);
          return (
            <button
              type="button"
              key={date}
              className={[
                "menu-calendar__day",
                outside ? "menu-calendar__day--outside" : "",
                data ? `menu-calendar__day--${source}` : "",
                selected ? "menu-calendar__day--selected" : ""
              ].filter(Boolean).join(" ")}
              disabled={outside}
              aria-pressed={selected}
              aria-label={
                data
                  ? `${date}: ${data.itemCount} ${source === "personal" ? "mục thực đơn cá nhân" : "suất từ bếp"}. Xem chi tiết.`
                  : `${date}: Chưa có thực đơn`
              }
              onClick={() => onSelectDate(date)}
            >
              <span className="menu-calendar__date">
                {Number(date.slice(-2))}
                {date === today ? <small>Hôm nay</small> : null}
              </span>
              {data ? (
                <span className="menu-calendar__event">
                  <strong>
                    {source === "personal"
                      ? `${data.itemCount} mục thực đơn`
                      : `${data.itemCount} suất từ bếp`}
                  </strong>
                  <small>
                    {completed ? (
                      <><CheckCircle2 size={12} /> Đã ăn đủ</>
                    ) : source === "personal" ? (
                      `${data.completedCount}/${data.itemCount} đã ăn`
                    ) : (
                      `${data.kitchenCount ?? 0} bếp phục vụ`
                    )}
                  </small>
                </span>
              ) : (
                <span className="menu-calendar__no-event">Chưa có thực đơn</span>
              )}
            </button>
          );
        })}
      </div>
      <footer className="menu-calendar__legend">
        <span><i className={`menu-calendar__dot menu-calendar__dot--${source}`} /> Ngày có {source === "personal" ? "thực đơn cá nhân" : "lịch ăn từ bếp"}</span>
        <span><CheckCircle2 size={14} /> Đã xác nhận đủ bữa</span>
      </footer>
    </section>
  );
}
