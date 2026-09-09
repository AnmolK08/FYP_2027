import React from 'react';
import { Sparkles, AlertTriangle, CheckCircle2, TrendingUp, Sun, Moon } from 'lucide-react';
import { Badge } from '../../../components/ui/badge';
import { Card, CardContent } from '../../../components/ui/card';

export function SuggestionsPanel({ suggestions = [], metrics = {} }) {
  if (!suggestions || suggestions.length === 0) {
    return (
      <div className="ps-card text-center py-8">
        <Sparkles className="w-6 h-6 text-primary mx-auto mb-2 opacity-70" />
        <p className="text-muted-foreground text-sm">
          Keep tracking your daily routine to receive personalized schedule insights and recommendations.
        </p>
      </div>
    );
  }

  const getIcon = (type) => {
    switch (type) {
      case 'OPTIMIZATION':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'STREAK':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'INSIGHT':
        return <TrendingUp className="w-4 h-4 text-primary" />;
      default:
        return <Sparkles className="w-4 h-4 text-primary" />;
    }
  };

  const getBadgeStyle = (impact) => {
    switch (impact) {
      case 'high':
        return 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700';
      case 'positive':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700';
      default:
        return 'bg-secondary text-secondary-foreground border-border';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-muted text-foreground border border-border">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-heading text-lg text-foreground">Smart Routine Insights</h3>
            <p className="text-xs text-muted-foreground">
              Pattern detection based on your recent habit completions
            </p>
          </div>
        </div>

        {metrics.timeBuckets && (
          <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground font-mono-display">
            {metrics.timeBuckets.morning?.rate !== null && (
              <span className="flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                Morning: {metrics.timeBuckets.morning.rate}%
              </span>
            )}
            {metrics.timeBuckets.evening?.rate !== null && (
              <span className="flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5 text-indigo-500" />
                Evening: {metrics.timeBuckets.evening.rate}%
              </span>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {suggestions.map((sugg) => (
          <div
            key={sugg.id}
            className="p-4 rounded-md bg-card border border-border hover:bg-muted/30 transition-colors flex flex-col justify-between space-y-2.5 shadow-sm"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {getIcon(sugg.type)}
                  <span className="text-xs font-semibold text-foreground truncate">
                    {sugg.title}
                  </span>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded border uppercase font-mono-display font-medium ${getBadgeStyle(
                    sugg.impact
                  )}`}
                >
                  {sugg.badge || 'Insight'}
                </span>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {sugg.message}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
