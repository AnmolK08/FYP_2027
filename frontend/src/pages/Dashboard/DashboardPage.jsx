import { useMemo } from 'react';
import { useAuth } from '../../features/auth/hooks/useAuth';
import ProtectedRoute from '@/routes/ProtectedRoute';
import { useSyncLeetCode } from '../../features/profile/hooks/useUserStats';
import { useDashboard } from '../../features/dashboard/hooks/useDashboard';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
  RefreshCw, Trophy, Award, Flame, Crown, Medal, Target, Mountain,
  Shield, Star, Zap, Swords, ExternalLink,
} from 'lucide-react';
import ProfileEditor from '../../features/profile/components/ProfileEditor';

const BADGE_ICONS = {
  Trophy, Award, Flame, Crown, Medal, Target, Mountain, Shield, Star, Zap, Swords,
};

const TIER_STYLES = {
  bronze: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
  silver: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-600',
  gold: 'bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700',
  platinum: 'bg-primary/10 text-primary border-primary/30',
};

const DEMO_STATS = {
  total_solved: 847,
  easy: 412,
  medium: 358,
  hard: 77,
  contest_rating: 1894,
  contests_attended: 24,
  global_ranking: 12543,
  streak: 19,
  active_days: 22,
  universal_score: 2847,
  rating_history: [
    { contest: 'Weekly Contest 350', timestamp: 1688342400, rating: 1510, ranking: 8432 },
    { contest: 'Weekly Contest 352', timestamp: 1689552000, rating: 1548, ranking: 7891 },
    { contest: 'Biweekly Contest 110', timestamp: 1690156800, rating: 1602, ranking: 6543 },
    { contest: 'Weekly Contest 356', timestamp: 1691971200, rating: 1573, ranking: 7102 },
    { contest: 'Weekly Contest 358', timestamp: 1693180800, rating: 1645, ranking: 5874 },
    { contest: 'Biweekly Contest 113', timestamp: 1694390400, rating: 1701, ranking: 4932 },
    { contest: 'Weekly Contest 362', timestamp: 1695600000, rating: 1689, ranking: 5210 },
    { contest: 'Weekly Contest 365', timestamp: 1697414400, rating: 1756, ranking: 4102 },
    { contest: 'Biweekly Contest 116', timestamp: 1698624000, rating: 1798, ranking: 3654 },
    { contest: 'Weekly Contest 370', timestamp: 1700438400, rating: 1834, ranking: 3201 },
    { contest: 'Weekly Contest 373', timestamp: 1702252800, rating: 1812, ranking: 3502 },
    { contest: 'Weekly Contest 376', timestamp: 1704067200, rating: 1894, ranking: 2987 },
  ],
};

export default function DashboardPage() {
  const { user, profile, refreshProfile } = useAuth();
  const { data: dashboardData, isLoading: statsLoading } = useDashboard();
  const syncLeetCode = useSyncLeetCode();

  const stats = dashboardData?.stats;

  const syncing = syncLeetCode.isPending;

  const handleSync = async () => {
    if (!profile?.leetcodeUsername) {
      toast.error('Set your LeetCode username in your profile first');
      return;
    }
    try {
      await syncLeetCode.mutateAsync();
      toast.success('LeetCode profile sync queued. Data will update shortly.');
    } catch (e) {
      toast.error('Sync failed');
    }
  };

  const displayStats = useMemo(() => {
    if (!stats) return DEMO_STATS;
    return {
      total_solved: stats.totalSolved ?? 0,
      easy: stats.easy ?? 0,
      medium: stats.medium ?? 0,
      hard: stats.hard ?? 0,
      contest_rating: stats.contestRating ?? 0,
      contests_attended: stats.contestsAttended ?? 0,
      global_ranking: stats.globalRanking ?? 0,
      streak: stats.streak ?? 0,
      active_days: stats.activeDays ?? 0,
      universal_score: stats.universalScore ?? 0,
      rating_history: stats.ratingHistory ?? [],
    };
  }, [stats]);

  const badges = useMemo(() => {
    const s = displayStats;
    const b = [];
    if (s.total_solved >= 50) b.push({ name: 'First 50', icon: 'Trophy', tier: 'bronze' });
    if (s.total_solved >= 200) b.push({ name: 'Problem Hunter', icon: 'Target', tier: 'silver' });
    if (s.total_solved >= 500) b.push({ name: '500 Club', icon: 'Medal', tier: 'gold' });
    if (s.total_solved >= 1000) b.push({ name: 'Quad-Digit Coder', icon: 'Crown', tier: 'platinum' });
    if (s.hard >= 50) b.push({ name: 'Hard Mode', icon: 'Flame', tier: 'gold' });
    if (s.hard >= 150) b.push({ name: 'Iron Will', icon: 'Mountain', tier: 'platinum' });
    if (s.contest_rating >= 1600) b.push({ name: 'Contest Regular', icon: 'Award', tier: 'silver' });
    if (s.contest_rating >= 1900) b.push({ name: 'Knight', icon: 'Shield', tier: 'gold' });
    if (s.contest_rating >= 2200) b.push({ name: 'Guardian', icon: 'Star', tier: 'platinum' });
    if (s.streak >= 7) b.push({ name: 'Week Streak', icon: 'Zap', tier: 'bronze' });
    if (s.streak >= 30) b.push({ name: '30-Day Grind', icon: 'Flame', tier: 'gold' });
    if (s.contests_attended >= 10) b.push({ name: 'Contest Veteran', icon: 'Swords', tier: 'silver' });
    return b;
  }, [displayStats]);

  const heatmapData = useMemo(() => {
    const cal = stats?.submissionCalendar || {};
    // Build a lookup map keyed by YYYY-MM-DD for reliable matching
    const dayMap = {};
    for (const [ts, count] of Object.entries(cal)) {
      const d = new Date(Number(ts) * 1000);
      const dayKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      dayMap[dayKey] = (dayMap[dayKey] || 0) + count;
    }
    const cells = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
      const dayKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      cells.push({
        date: d.toLocaleDateString(),
        count: dayMap[dayKey] || 0,
      });
    }
    return cells;
  }, [stats]);

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 md:py-14">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div>
              <div className="text-overline">Welcome back</div>
              <h1 className="font-heading text-3xl lg:text-5xl tracking-tight text-foreground mt-2">
                {profile?.name?.split(' ')[0] || 'Student'}&apos;s Sphere
              </h1>
              <p className="text-muted-foreground mt-2 text-sm">
                <span className="font-mono-display">{profile?.leetcodeUsername || 'no leetcode handle'}</span>
                {profile?.college && <span> - {profile.college}</span>}
                {profile?.department && <span> - {profile.department}</span>}
              </p>
            </div>
            <div className="flex gap-2">
              <ProfileEditor profile={profile} onSaved={() => { refreshProfile(); }} />
              <Button onClick={handleSync} disabled={syncing} data-testid="sync-leetcode" className="bg-primary text-primary-foreground">
                <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} />
                {syncing ? 'Syncing...' : 'Sync LeetCode'}
              </Button>
            </div>
          </div>

          {statsLoading ? (
            <div className="mt-12 text-muted-foreground font-mono-display text-sm" data-testid="dashboard-loading">
              loading stats...
            </div>
          ) : (
            <>
              <section className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-10" data-testid="metrics-row">
                <Metric label="Total Solved" value={displayStats.total_solved} sub={`#${displayStats.global_ranking?.toLocaleString() || '-'} global`} />
                <Metric label="Contest Rating" value={displayStats.contest_rating?.toFixed(0) || 0} sub={`${displayStats.contests_attended || 0} contests`} mono />
                <Metric label="Current Streak" value={`${displayStats.streak || 0}d`} sub={`${displayStats.active_days || 0} active days in 30d`} />
                <Metric label="Universal Score" value={Math.round(displayStats.universal_score || 0)} sub="solved + rating" />
              </section>

              <section className="grid lg:grid-cols-5 gap-5 mt-6">
                <Card title="Difficulty Breakdown" subtitle="Easy / Medium / Hard" testid="card-difficulty" className="lg:col-span-2">
                  <div className="grid grid-cols-5 gap-4 items-center">
                    <div className="col-span-3 h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Easy', value: displayStats.easy, color: '#10B981' },
                              { name: 'Medium', value: displayStats.medium, color: '#F59E0B' },
                              { name: 'Hard', value: displayStats.hard, color: '#F43F5E' },
                            ]}
                            dataKey="value"
                            innerRadius={50}
                            outerRadius={80}
                            strokeWidth={2}
                            stroke="#fff"
                            paddingAngle={2}
                          >
                            {['#10B981', '#F59E0B', '#F43F5E'].map((c, i) => (
                              <Cell key={i} fill={c} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              background: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: 6,
                              color: 'hsl(var(--foreground))',
                              fontSize: 12,
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="col-span-2 space-y-3">
                      <Row label="Easy" value={displayStats.easy} color="#10B981" />
                      <Row label="Medium" value={displayStats.medium} color="#F59E0B" />
                      <Row label="Hard" value={displayStats.hard} color="#F43F5E" />
                    </div>
                  </div>
                </Card>

                <Card title="Rating Trend" subtitle={`${displayStats.contests_attended || 0} contests attended`} testid="card-rating" className="lg:col-span-3">
                  {displayStats.rating_history && displayStats.rating_history.length > 0 ? (
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={displayStats.rating_history.map((entry) => ({
                            ...entry,
                            date: new Date(entry.timestamp * 1000).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
                          }))}
                          margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="ratingGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                            axisLine={{ stroke: 'hsl(var(--border))' }}
                            tickLine={false}
                            interval="preserveStartEnd"
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                            axisLine={false}
                            tickLine={false}
                            domain={['dataMin - 50', 'dataMax + 50']}
                          />
                          <Tooltip
                            contentStyle={{
                              background: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: 8,
                              color: 'hsl(var(--foreground))',
                              fontSize: 12,
                              padding: '8px 12px',
                            }}
                            formatter={(value) => [`${value}`, 'Rating']}
                            labelFormatter={(label, payload) => {
                              const entry = payload?.[0]?.payload;
                              return entry?.contest || label;
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="rating"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            fill="url(#ratingGradient)"
                            dot={{ r: 3, fill: 'hsl(var(--primary))', strokeWidth: 0 }}
                            activeDot={{ r: 5, fill: 'hsl(var(--primary))', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-56 grid place-items-center text-muted-foreground text-sm font-mono-display">
                      no contest data yet
                    </div>
                  )}
                </Card>
              </section>

              <section className="grid lg:grid-cols-5 gap-5 mt-6">
                <Card title="30-Day Activity" subtitle="Submissions per day" testid="card-heatmap" className="lg:col-span-3">
                  <div data-testid="heatmap">
                    <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(15, minmax(0,1fr))' }}>
                      {heatmapData.map((c, i) => {
                        const lvl = c.count > 0 ? Math.min(Math.ceil(c.count / 2), 4) : 0;
                        return (
                          <div
                            key={i}
                            title={`${c.date} - ${c.count} submission${c.count === 1 ? '' : 's'}`}
                            className={`heat-cell ${lvl ? 'heat-' + lvl : ''}`}
                            data-testid={`heat-cell-${i}`}
                          />
                        );
                      })}
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-mono-display">less</span>
                      <div className="flex gap-1">
                        <div className="heat-cell" />
                        <div className="heat-cell heat-1" />
                        <div className="heat-cell heat-2" />
                        <div className="heat-cell heat-3" />
                        <div className="heat-cell heat-4" />
                      </div>
                      <span className="font-mono-display">more</span>
                    </div>
                  </div>
                </Card>
                <Card title="Badges" subtitle={`${badges.length} earned`} testid="card-badges" className="lg:col-span-2">
                  {badges.length === 0 ? (
                    <div className="h-32 grid place-items-center text-muted-foreground text-sm">
                      No badges yet - start solving!
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3" data-testid="badge-list">
                      {badges.map((b) => {
                        const Icon = BADGE_ICONS[b.icon] || Award;
                        return (
                          <div
                            key={b.name}
                            className={`border rounded-md px-3 py-2.5 flex items-center gap-2.5 ${TIER_STYLES[b.tier] || TIER_STYLES.silver}`}
                          >
                            <Icon size={18} strokeWidth={1.5} />
                            <div>
                              <div className="text-sm font-medium leading-tight">{b.name}</div>
                              <div className="text-[10px] uppercase font-mono-display tracking-widest opacity-70">{b.tier}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </section>

              <section className="mt-6 bg-card border border-border rounded-md p-6 flex flex-col md:flex-row md:items-center gap-5">
                <img
                  src={profile?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.name || 'User'}`}
                  alt=""
                  className="h-14 w-14 rounded-full border border-border"
                />
                <div className="flex-1">
                  <div className="font-heading text-xl text-foreground">{profile?.name}</div>
                  <div className="text-sm text-muted-foreground">{user?.email}</div>
                </div>
                {profile?.leetcodeUsername && (
                  <a
                    href={`https://leetcode.com/${profile.leetcodeUsername}/`}
                    target="_blank"
                    rel="noreferrer"
                    data-testid="open-leetcode"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink size={14} /> View on LeetCode
                  </a>
                )}
              </section>
            </>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}

function Metric({ label, value, sub, mono }) {
  return (
    <div className="bg-card border border-border rounded-md p-6" data-testid={`metric-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="text-overline">{label}</div>
      <div className={`font-heading text-3xl text-foreground mt-2 ${mono ? 'font-mono-display' : ''}`}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1 font-mono-display">{sub}</div>}
    </div>
  );
}

function Card({ title, subtitle, children, testid, className = '' }) {
  return (
    <div className={`bg-card border border-border rounded-md p-6 shadow-sm ${className}`} data-testid={testid}>
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <div className="font-heading text-lg text-foreground">{title}</div>
          {subtitle && <div className="text-overline mt-0.5">{subtitle}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

function Row({ label, value, color }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="inline-flex items-center gap-2 text-muted-foreground">
        <span className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
        {label}
      </span>
      <span className="font-mono-display text-foreground">{value}</span>
    </div>
  );
}
