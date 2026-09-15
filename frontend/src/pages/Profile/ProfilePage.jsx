import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePublicProfile } from '../../features/profile/hooks/usePublicProfile';
import Sidebar from '../../components/Sidebar';
import { toast } from 'sonner';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
  Trophy, Award, Flame, Crown, Medal, Target, Mountain,
  Shield, Star, Zap, Swords, ExternalLink, ArrowLeft, UserX,
  Copy, Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  total_solved: 0,
  easy: 0,
  medium: 0,
  hard: 0,
  contest_rating: 0,
  contests_attended: 0,
  global_ranking: 0,
  streak: 0,
  active_days: 0,
  universal_score: 0,
  rating_history: [],
};

export default function ProfilePage() {
  const { username } = useParams();
  const { data: profileData, isLoading, error } = usePublicProfile(username);
  const [copied, setCopied] = useState(false);

  const profileUser = profileData?.user;
  const stats = profileData?.stats;

  const handleCopyLink = () => {
    const handle = profileUser?.lucyUsername || username;
    const url = `${window.location.origin}/u/${handle}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success(`Profile link copied: /u/${handle}`);
    setTimeout(() => setCopied(false), 2000);
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
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <main className="min-h-screen bg-background">
          <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 md:py-14">
            {error || (!isLoading && !profileUser) ? (
              <div className="py-20 flex flex-col items-center justify-center text-center">
                <div className="h-16 w-16 rounded-full bg-muted/60 flex items-center justify-center mb-4 text-muted-foreground">
                  <UserX size={32} />
                </div>
                <h1 className="font-heading text-2xl text-foreground">Student Not Found</h1>
                <p className="text-muted-foreground text-sm mt-2 max-w-md">
                  We couldn&apos;t find a public profile matching <span className="font-mono-display text-foreground font-medium">&quot;{username}&quot;</span>. The student may not have set up their handle yet or may have updated it.
                </p>
                <Link to="/leaderboard" className="mt-6">
                  <Button variant="outline" size="sm" className="gap-2">
                    <ArrowLeft size={14} /> Explore Leaderboard
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
                  <div>
                    <div className="text-overline h-4 flex items-center">
                      <Link
                        to="/leaderboard"
                        className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
                      >
                        <ArrowLeft size={12} /> Back to Leaderboard
                      </Link>
                    </div>
                    <h1 className="font-heading text-3xl lg:text-5xl tracking-tight text-foreground mt-2">
                      {profileUser?.name?.split(' ')[0] || username || 'Student'}&apos;s Sphere
                    </h1>
                    <div className="text-muted-foreground mt-2 text-sm flex flex-wrap items-center gap-2">
                      <span className="font-mono-display font-medium text-foreground bg-muted/80 px-2 py-0.5 rounded border border-border">
                        @{profileUser?.lucyUsername || username}
                      </span>
                      {profileUser?.college && <span>• {profileUser.college}</span>}
                      {profileUser?.department && <span> - {profileUser.department}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 h-9">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyLink}
                      className="gap-2 h-9 font-mono-display text-xs"
                    >
                      {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      {copied ? 'Copied Link' : 'Share /u/' + (profileUser?.lucyUsername || username)}
                    </Button>
                    {profileUser?.leetcodeUsername && (
                      <a
                        href={`https://leetcode.com/${profileUser.leetcodeUsername}/`}
                        target="_blank"
                        rel="noreferrer"
                        data-testid="external-leetcode-btn"
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md border border-border bg-card text-foreground text-sm font-medium hover:bg-muted transition-colors h-9"
                      >
                        <ExternalLink size={14} /> LeetCode
                      </a>
                    )}
                  </div>
                </div>

                {isLoading ? (
                  <div className="mt-12 text-muted-foreground font-mono-display text-sm" data-testid="profile-loading">
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
                        src={profileUser?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${profileUser?.name || 'User'}`}
                        alt=""
                        className="h-14 w-14 rounded-full border border-border"
                      />
                      <div className="flex-1">
                        <div className="font-heading text-xl text-foreground">{profileUser?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {profileUser?.college && <span>{profileUser.college}</span>}
                          {profileUser?.department && <span> • {profileUser.department}</span>}
                          {!profileUser?.college && !profileUser?.department && (
                            <span>{profileUser?.email || 'Student'}</span>
                          )}
                        </div>
                      </div>
                      {profileUser?.leetcodeUsername && (
                        <a
                          href={`https://leetcode.com/${profileUser.leetcodeUsername}/`}
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
              </>
            )}
          </div>
        </main>
      </main>
    </div>
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
