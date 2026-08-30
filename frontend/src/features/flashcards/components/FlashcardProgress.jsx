import React from 'react';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Flame, Award, BarChart3 } from 'lucide-react';

export default function FlashcardProgress({
  currentIndex = 0,
  totalCards = 0,
  sessionStats = { again: 0, hard: 0, good: 0, easy: 0 },
}) {
  const percentage = totalCards > 0 ? Math.round(((currentIndex + 1) / totalCards) * 100) : 0;
  const totalReviewed =
    sessionStats.again + sessionStats.hard + sessionStats.good + sessionStats.easy;

  return (
    <div className="w-full max-w-2xl mx-auto mb-6 bg-card/60 backdrop-blur-sm border border-border rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4 mb-2.5">
        <div className="flex items-center gap-2">
          <BarChart3 size={16} className="text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Session Progress
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono-display text-xs">
          <span className="text-foreground font-semibold">
            {totalCards > 0 ? currentIndex + 1 : 0}
          </span>
          <span className="text-muted-foreground">/</span>
          <span className="text-muted-foreground">{totalCards}</span>
          <span className="text-primary font-medium ml-1">({percentage}%)</span>
        </div>
      </div>

      {/* Progress Bar */}
      <Progress value={percentage} className="h-2 bg-muted rounded-full" />

      {/* Spaced-Repetition Review Badges */}
      {totalReviewed > 0 && (
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-border/50 text-[11px] font-mono-display">
          <span className="text-muted-foreground">Responses:</span>
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1 text-rose-500">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              Again: {sessionStats.again}
            </span>
            <span className="flex items-center gap-1 text-amber-500">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Hard: {sessionStats.hard}
            </span>
            <span className="flex items-center gap-1 text-blue-500">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Good: {sessionStats.good}
            </span>
            <span className="flex items-center gap-1 text-emerald-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Easy: {sessionStats.easy}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
