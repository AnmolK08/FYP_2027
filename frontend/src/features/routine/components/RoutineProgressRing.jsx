import React from 'react';
import { Trophy, Flame, Sparkles } from 'lucide-react';

export function RoutineProgressRing({
  percentage = 0,
  completedCount = 0,
  totalCount = 0,
  size = 130,
  strokeWidth = 9,
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safePercent = Math.min(100, Math.max(0, percentage));
  const offset = circumference - (safePercent / 100) * circumference;

  let motivation = 'Ready to begin your routine';
  let MotivationIcon = Sparkles;
  let iconClass = 'text-primary';

  if (safePercent === 100) {
    motivation = 'All daily habits completed!';
    MotivationIcon = Trophy;
    iconClass = 'text-amber-500';
  } else if (safePercent >= 70) {
    motivation = 'Almost finished, strong momentum!';
    MotivationIcon = Flame;
    iconClass = 'text-orange-500';
  } else if (safePercent > 0) {
    motivation = 'Making steady progress today';
    MotivationIcon = Sparkles;
    iconClass = 'text-primary';
  }

  return (
    <div className="ps-card flex flex-col sm:flex-row items-center gap-6">
      {/* Radial Ring */}
      <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
        <svg className="w-full h-full -rotate-90 transform" viewBox={`0 0 ${size} ${size}`}>
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
          />

          {/* Animated Progress Fill */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="hsl(var(--primary))"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Percentage Display */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="font-heading text-2xl text-foreground font-mono-display">
            {Math.round(safePercent)}%
          </span>
          <span className="text-[9px] font-mono-display uppercase tracking-widest text-muted-foreground">
            Done
          </span>
        </div>
      </div>

      {/* Stats and Description */}
      <div className="flex-1 text-center sm:text-left space-y-1">
        <div className="flex items-center justify-center sm:justify-start gap-1.5 text-overline">
          <MotivationIcon className={`w-3.5 h-3.5 ${iconClass}`} />
          <span>Daily Goal</span>
        </div>

        <h3 className="font-heading text-xl text-foreground">
          {completedCount} of {totalCount} habits completed
        </h3>

        <p className="text-sm text-muted-foreground">
          {motivation}
        </p>

        {/* Progress Bar for Quick Scan */}
        <div className="pt-2 w-full max-w-md">
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${safePercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
