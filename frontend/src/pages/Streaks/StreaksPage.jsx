import { useMemo } from 'react';
import ProtectedRoute from '@/routes/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useActivity, useCheckIn } from '../../features/profile/hooks/useUserStats';
import { Button } from '@/components/ui/button';
import { Flame, Target, Check, Trophy } from 'lucide-react';
import { toast } from 'sonner';

export default function StreaksPage() {
  const { profile } = useAuth();
  const { data: activities = [], isLoading: loading } = useActivity();
  const checkIn = useCheckIn();

  const data = useMemo(() => {
    const days = activities.map((a) => a.date);
    const daySet = new Set(days);

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (daySet.has(todayStr)) {
      currentStreak = 1;
      let d = new Date(today);
      d.setDate(d.getDate() - 1);
      while (daySet.has(d.toISOString().split('T')[0])) {
        currentStreak++;
        d.setDate(d.getDate() - 1);
      }
    } else {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      if (daySet.has(yesterdayStr)) {
        currentStreak = 1;
        let d = new Date(yesterday);
        d.setDate(d.getDate() - 1);
        while (daySet.has(d.toISOString().split('T')[0])) {
          currentStreak++;
          d.setDate(d.getDate() - 1);
        }
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let run = 0;
    let prevDate = null;

    for (const d of days.sort()) {
      if (prevDate) {
        const prev = new Date(prevDate);
        const curr = new Date(d);
        const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays === 1) {
          run++;
        } else {
          run = 1;
        }
      } else {
        run = 1;
      }
      longestStreak = Math.max(longestStreak, run);
      prevDate = d;
    }

    // Generate heatmap for past 365 days
    const heatmap = [];
    for (let i = 364; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      heatmap.push({ date: dStr, active: daySet.has(dStr) });
    }

    return {
      current_streak: currentStreak,
      longest_streak: longestStreak,
      total_active_days: days.length,
      daily_goal: profile?.daily_goal || 3,
      heatmap,
    };
  }, [activities, profile?.daily_goal]);

  const handleCheckin = async () => {
    try {
      await checkIn.mutateAsync();
      toast.success('Checked in for today!');
    } catch (e) {
      toast.error('Check-in failed');
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <main className="min-h-screen bg-background">
          <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 text-muted-foreground">
            Loading...
          </div>
        </main>
      </ProtectedRoute>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const checkedToday = data.heatmap.some((c) => c.date === today && c.active);

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
          <p className="text-overline">M10 - Consistency Engine</p>
          <h1 className="font-heading text-4xl mt-2 text-foreground">Show up daily. The rest follows.</h1>
          <p className="text-muted-foreground mt-1 max-w-xl">
            Your streak grows when you sync LeetCode or check in. Skip a day and it resets - gently.
          </p>

          {/* Stats cards */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="ps-card p-6">
              <Flame size={18} className="text-orange-500" />
              <p className="text-overline mt-2">Current streak</p>
              <div className="font-heading text-6xl mt-1 text-foreground" data-testid="current-streak">
                {data.current_streak}
              </div>
              <div className="text-xs text-muted-foreground font-mono-display mt-1">days in a row</div>
            </div>
            <div className="ps-card p-6">
              <Trophy size={18} className="text-amber-500" />
              <p className="text-overline mt-2">Longest</p>
              <div className="font-heading text-6xl mt-1 text-foreground">{data.longest_streak}</div>
            </div>
            <div className="ps-card p-6">
              <Check size={18} className="text-emerald-500" />
              <p className="text-overline mt-2">Total active</p>
              <div className="font-heading text-6xl mt-1 text-foreground">{data.total_active_days}</div>
            </div>
            <div className="ps-card p-6">
              <Target size={18} className="text-blue-500" />
              <p className="text-overline mt-2">Daily goal</p>
              <div className="font-heading text-6xl mt-1 text-foreground">{data.daily_goal}</div>
              <div className="text-xs text-muted-foreground mt-1">problems / day</div>
            </div>
          </div>

          {/* Check-in button */}
          <div className="mt-8">
            <Button
              data-testid="checkin-button"
              disabled={checkIn.isPending || checkedToday}
              onClick={handleCheckin}
              className={checkedToday ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground'}
            >
              <Check size={14} />{' '}
              {checkedToday ? 'Checked in today' : checkIn.isPending ? 'Saving...' : 'Check in for today'}
            </Button>
          </div>

          {/* Heatmap */}
          <div className="ps-card p-6 mt-10">
            <div className="flex items-center justify-between">
              <p className="text-overline">365-day heatmap</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>less</span>
                <div className="flex gap-1">
                  <div className="cell" />
                  <div className="cell cell-1" />
                  <div className="cell cell-2" />
                  <div className="cell cell-3" />
                  <div className="cell cell-4" />
                </div>
                <span>more</span>
              </div>
            </div>
            <div className="mt-5 overflow-x-auto">
              <div
                className="grid grid-rows-7 grid-flow-col gap-[3px]"
                style={{ gridAutoColumns: '11px' }}
                data-testid="streak-heatmap"
              >
                {data.heatmap.map((c, i) => (
                  <div
                    key={i}
                    className={`cell ${c.active ? 'cell-4' : ''}`}
                    title={c.date}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="mt-10 ps-card-soft p-6">
            <p className="text-overline mb-3">Consistency tips</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <Check size={14} className="text-emerald-500 mt-1 shrink-0" />
                <span>Set a realistic daily goal (3-5 problems is a good start)</span>
              </li>
              <li className="flex gap-2">
                <Check size={14} className="text-emerald-500 mt-1 shrink-0" />
                <span>Check in every day, even if you only solve one problem</span>
              </li>
              <li className="flex gap-2">
                <Check size={14} className="text-emerald-500 mt-1 shrink-0" />
                <span>Use the AI Mentor to identify weak areas and focus your practice</span>
              </li>
              <li className="flex gap-2">
                <Check size={14} className="text-emerald-500 mt-1 shrink-0" />
                <span>Track contest participation - ratings boost your universal score</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
