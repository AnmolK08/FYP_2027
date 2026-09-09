import React from 'react';
import { Flame, Trophy, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../../components/ui/button';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function MonthlyCalendar({
  year,
  month,
  calendar = [],
  summary = {},
  onMonthChange,
}) {
  const handlePrevMonth = () => {
    let nextMonth = month - 1;
    let nextYear = year;
    if (nextMonth < 1) {
      nextMonth = 12;
      nextYear -= 1;
    }
    onMonthChange(nextMonth, nextYear);
  };

  const handleNextMonth = () => {
    let nextMonth = month + 1;
    let nextYear = year;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    onMonthChange(nextMonth, nextYear);
  };

  const firstDayOfMonth = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const emptyDaysBefore = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const getHeatmapColor = (day) => {
    if (!day.hasRoutine) return 'bg-muted/30 border-border/60 text-muted-foreground';
    const p = day.completionPercentage;
    if (p === 100) return 'bg-emerald-100 text-emerald-800 border-emerald-400 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700';
    if (p >= 75) return 'bg-primary/20 text-primary border-primary/40';
    if (p >= 50) return 'bg-primary/10 text-primary border-primary/25';
    if (p > 0) return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
    return 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800';
  };

  return (
    <div className="space-y-5">
      {/* Month Navigation & Streak Badges */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevMonth}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h3 className="font-heading text-lg text-foreground flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
            <span>
              {MONTH_NAMES[month - 1]} {year}
            </span>
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextMonth}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Streak Badges */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700 text-xs font-semibold font-mono-display">
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            <span>Current: {summary.currentStreak || 0}d streak</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700 text-xs font-semibold font-mono-display">
            <Trophy className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Best: {summary.longestStreak || 0}d</span>
          </div>
        </div>
      </div>

      {/* Monthly Heatmap Grid */}
      <div className="p-4 rounded-md bg-card border border-border shadow-sm">
        {/* Day Header */}
        <div className="grid grid-cols-7 gap-1.5 text-center text-[10px] font-mono-display uppercase tracking-widest text-muted-foreground pb-2 border-b border-border mb-2">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Calendar Day Cells */}
        <div className="grid grid-cols-7 gap-1.5">
          {emptyDaysBefore.map((_, i) => (
            <div key={`empty-${i}`} className="h-14 rounded-md bg-muted/20 border border-transparent" />
          ))}

          {calendar.map((day) => {
            const colorClass = getHeatmapColor(day);
            return (
              <div
                key={day.date}
                className={`relative group h-14 rounded-md p-1.5 border flex flex-col justify-between transition-colors cursor-default ${colorClass}`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono-display">
                  <span className="font-semibold">{day.day}</span>
                  {day.hasRoutine && (
                    <span className="text-[10px] font-semibold">
                      {Math.round(day.completionPercentage)}%
                    </span>
                  )}
                </div>

                {day.hasRoutine && (
                  <div className="text-[10px] font-mono-display text-right opacity-80">
                    {day.completedTasks}/{day.totalTasks}
                  </div>
                )}

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-20 w-36 p-2 rounded-md bg-popover border border-border text-popover-foreground text-[11px] shadow-md pointer-events-none text-center">
                  <p className="font-semibold text-foreground">{day.date}</p>
                  {day.hasRoutine ? (
                    <p className="text-primary font-mono-display mt-0.5">
                      {day.completedTasks} / {day.totalTasks} done ({Math.round(day.completionPercentage)}%)
                    </p>
                  ) : (
                    <p className="text-muted-foreground italic mt-0.5">No routine tracked</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-3 text-xs text-muted-foreground pt-1">
        <span>Less active</span>
        <div className="flex items-center gap-1">
          <div className="w-3.5 h-3.5 rounded-sm bg-muted/40 border border-border" title="No routine" />
          <div className="w-3.5 h-3.5 rounded-sm bg-amber-100 border border-amber-300 dark:bg-amber-950/40" title="1-49%" />
          <div className="w-3.5 h-3.5 rounded-sm bg-primary/10 border border-primary/25" title="50-74%" />
          <div className="w-3.5 h-3.5 rounded-sm bg-primary/20 border border-primary/40" title="75-99%" />
          <div className="w-3.5 h-3.5 rounded-sm bg-emerald-100 border border-emerald-400 dark:bg-emerald-950/60" title="100%" />
        </div>
        <span>100% Crushed</span>
      </div>
    </div>
  );
}
