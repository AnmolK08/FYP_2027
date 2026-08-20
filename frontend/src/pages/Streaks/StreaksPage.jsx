import { useMemo } from 'react';
import ProtectedRoute from '@/routes/ProtectedRoute';
import { useCheckIn, useStreakSummary } from '../../features/profile/hooks/useUserStats';
import { Button } from '@/components/ui/button';
import { Flame, Target, Check, Trophy } from 'lucide-react';
import { toast } from 'sonner';

export default function StreaksPage() {
  const { data, isLoading: loading } = useStreakSummary();
  const checkIn = useCheckIn();

const calendar = useMemo(() => {
  const heatmap = data?.heatmap || [];
  if (!heatmap.length) return { weeks: [], months: [] };

  // 1. Pad the front so the grid starts on a Sunday (col-major, 7 rows)
  const firstDate = new Date(`${heatmap[0].date}T00:00:00Z`);
  const leadingEmptyDays = firstDate.getUTCDay(); // 0 = Sun ... 6 = Sat
  const cells = [
    ...Array.from({ length: leadingEmptyDays }, () => null),
    ...heatmap,
  ];
  while (cells.length % 7 !== 0) cells.push(null); // pad the tail too

  // 2. Chunk into week-columns (7 cells each, top-to-bottom = Sun-Sat)
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  // 3. One label per week-column, LeetCode-style:
  //    - a column gets labeled if it contains the 1st of a month
  //    - the very first column is always labeled too (it's a partial
  //      month at the start of the range and would otherwise be skipped,
  //      since it usually doesn't contain a literal "1st")
  const months = weeks.map((week, weekIndex) => {
    const realCells = week.filter(Boolean);
    if (!realCells.length) return '';

    const firstOfMonthCell = realCells.find(
      (cell) => new Date(`${cell.date}T00:00:00Z`).getUTCDate() === 1
    );

    if (!firstOfMonthCell && weekIndex !== 0) return '';

    const labelSourceCell = firstOfMonthCell || realCells[0];
    const date = new Date(`${labelSourceCell.date}T00:00:00Z`);
    return date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
  });

  return { weeks, months };
}, [data?.heatmap]);

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
  const checkedToday = data?.heatmap?.some((c) => c.date === today && c.active);

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
              <div className="min-w-max" data-testid="streak-heatmap">
                <div className="flex gap-1">
                  <div className="grid grid-rows-7 gap-[3px] w-7 pr-1 text-[9px] leading-[10px] text-muted-foreground">
                    <span />
                    <span>Mon</span>
                    <span />
                    <span>Wed</span>
                    <span />
                    <span>Fri</span>
                    <span />
                  </div>
                  <div className="flex gap-[3px]">
                    {calendar.weeks.map((week, weekIndex) => (
                      <div key={weekIndex} className={`flex flex-col${calendar.months[weekIndex] && weekIndex > 0 ? ' ml-[6px]' : ''}`}>
                        <div className="grid grid-rows-7 gap-[3px]">
                          {week.map((cell, dayIndex) => (
                            <div
                              key={`${weekIndex}-${dayIndex}`}
                              className={`cell ${cell ? cell.count >= 10 ? 'cell-4' : cell.count >= 5 ? 'cell-3' : cell.count >= 2 ? 'cell-2' : cell.count > 0 ? 'cell-1' : cell.active ? 'cell-4' : '' : ''}`}
                              title={cell?.date || ''}
                            />
                          ))}
                        </div>
                        <div className="text-[10px] text-muted-foreground whitespace-nowrap mt-2 h-3">
                          {calendar.months[weekIndex]}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
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
