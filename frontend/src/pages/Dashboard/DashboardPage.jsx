import { useState, useMemo } from "react";
import { useAuth } from "../../features/auth/hooks/useAuth";
import ProtectedRoute from "@/routes/ProtectedRoute";
import { useSyncLeetCode } from "../../features/profile/hooks/useUserStats";
import { useSyncCodeforces } from "../../features/codeforces/hooks/useCodeforces";
import {
  useLeetcodeDashboard,
  useCodeforcesDashboard,
} from "../../features/dashboard/hooks/usePlatformDashboard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  RefreshCw,
  Trophy,
  Award,
  Flame,
  Crown,
  Medal,
  Target,
  Mountain,
  Shield,
  Star,
  Zap,
  Swords,
  ExternalLink,
  Settings2,
  Copy,
  Check,
  Code2,
  Cpu,
} from "lucide-react";
import ProfileEditor from "../../features/profile/components/ProfileEditor";

const BADGE_ICONS = {
  Trophy,
  Award,
  Flame,
  Crown,
  Medal,
  Target,
  Mountain,
  Shield,
  Star,
  Zap,
  Swords,
};

const TIER_STYLES = {
  bronze:
    "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700",
  silver:
    "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-600",
  gold: "bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700",
  platinum: "bg-primary/10 text-primary border-primary/30",
};

// CF rank colour matches the official Codeforces colour scheme
const CF_RANK_COLORS = {
  newbie: "text-slate-400",
  pupil: "text-green-500",
  specialist: "text-cyan-500",
  expert: "text-blue-500",
  "candidate master": "text-violet-500",
  master: "text-orange-400",
  "international master": "text-orange-500",
  grandmaster: "text-red-500",
  "international grandmaster": "text-red-600",
  "legendary grandmaster": "text-red-700",
};
const cfRankColor = (rank) =>
  CF_RANK_COLORS[rank?.toLowerCase?.()] || "text-muted-foreground";

export default function DashboardPage() {
  const { user, profile, refreshProfile } = useAuth();
  const [platform, setPlatform] = useState("leetcode");
  const [editOpen, setEditOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const syncLeetCode = useSyncLeetCode();
  const syncCodeforces = useSyncCodeforces();

  const { data: lcData, isLoading: lcLoading } = useLeetcodeDashboard();
  const { data: cfData, isLoading: cfLoading } = useCodeforcesDashboard();

  const isLoading = platform === "leetcode" ? lcLoading : cfLoading;

  const handleSync = async () => {
    if (platform === "leetcode") {
      if (!profile?.leetcodeUsername) {
        toast.error("Set your LeetCode username in your profile first");
        return;
      }
      try {
        await syncLeetCode.mutateAsync();
      } catch {
        /* toast handled in hook */
      }
    } else {
      if (!profile?.codeforcesUsername) {
        toast.error("Set your Codeforces handle in your profile first");
        return;
      }
      try {
        await syncCodeforces.mutateAsync();
      } catch {
        /* toast handled in hook */
      }
    }
  };

  const syncing =
    platform === "leetcode" ? syncLeetCode.isPending : syncCodeforces.isPending;

  const handleCopyLink = () => {
    const handle = profile?.lucyUsername || profile?.leetcodeUsername || "user";
    const url = `${window.location.origin}/u/${handle}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success(`Profile link copied: /u/${handle}`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 md:py-14">
          {/* ── Header ── */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div>
              <div className="text-overline h-4 flex items-center">
                Welcome back
              </div>
              <h1 className="font-heading text-3xl lg:text-5xl tracking-tight text-foreground mt-2">
                {profile?.name?.split(" ")[0] || "Student"}&apos;s Sphere
              </h1>
              <div className="text-muted-foreground mt-2 text-sm flex flex-wrap items-center gap-2">
                <span className="font-mono-display font-medium text-foreground bg-muted/80 px-2 py-0.5 rounded border border-border">
                  @
                  {profile?.lucyUsername ||
                    profile?.leetcodeUsername ||
                    "no handle"}
                </span>
                {profile?.college && <span>• {profile.college.toUpperCase()}</span>}
                {profile?.department && <span> - {profile.department}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2 h-9">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="gap-2 h-9 font-mono-display text-xs"
              >
                {copied ? (
                  <>
                    <Check size={14} className="text-emerald-500" /> Copied Link
                  </>
                ) : (
                  <>
                    <Copy size={14} /> Share /u/
                    {profile?.lucyUsername ||
                      profile?.leetcodeUsername ||
                      "user"}
                  </>
                )}
              </Button>
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                data-testid="open-profile-editor"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border bg-background text-foreground text-sm hover:bg-muted transition-colors h-9"
              >
                <Settings2 size={15} strokeWidth={1.5} /> Edit profile
              </button>
              <ProfileEditor
                profile={profile}
                onSaved={() => refreshProfile()}
                open={editOpen}
                onOpenChange={setEditOpen}
              />
              <Button
                size="sm"
                onClick={handleSync}
                disabled={syncing}
                data-testid="sync-platform"
                className="bg-primary text-primary-foreground h-9"
              >
                <RefreshCw
                  size={15}
                  className={syncing ? "animate-spin" : ""}
                />
                {syncing
                  ? "Syncing…"
                  : platform === "leetcode"
                    ? "Sync LeetCode"
                    : "Sync Codeforces"}
              </Button>
            </div>
          </div>

          {/* ── Platform switcher ── */}
          <div
            className="mt-6 inline-flex items-center gap-1 bg-muted border border-border rounded-lg p-1"
            role="tablist"
            aria-label="Platform view"
          >
            <PlatformTab
              active={platform === "leetcode"}
              onClick={() => setPlatform("leetcode")}
              icon={<Code2 size={14} />}
              label="LeetCode"
              connected={!!profile?.leetcodeUsername}
            />
            <PlatformTab
              active={platform === "codeforces"}
              onClick={() => setPlatform("codeforces")}
              icon={<Swords size={14} />}
              label="Codeforces"
              connected={!!profile?.codeforcesUsername}
            />
          </div>

          {/* ── Platform content ── */}
          {isLoading ? (
            <div
              className="mt-12 text-muted-foreground font-mono-display text-sm"
              data-testid="dashboard-loading"
            >
              loading stats…
            </div>
          ) : platform === "leetcode" ? (
            <LeetCodeView data={lcData} profile={profile} />
          ) : (
            <CodeforcesView data={cfData} profile={profile} />
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}

export function PlatformTab({ active, onClick, icon, label, connected, isPublic }) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${active
          ? "bg-background text-foreground shadow-sm border border-border"
          : "text-muted-foreground hover:text-foreground"
        }`}
    >
      {icon}
      {label}
      {!connected && !isPublic && (
        <span className="ml-1 text-[9px] uppercase font-mono-display tracking-widest text-muted-foreground border border-border rounded px-1">
          connect
        </span>
      )}
    </button>
  );
}

export function LeetCodeView({ data, profile, isPublic }) {
  const connected = data?.connected;
  const synced = data?.synced;
  const stats = data?.stats;

  const heatmapData = useMemo(() => {
    const cal = stats?.submissionCalendar || {};

    // Build a dateKey → count map from the raw Unix-timestamp calendar
    const dayMap = {};
    for (const [ts, count] of Object.entries(cal)) {
      const d = new Date(Number(ts) * 1000);
      const k = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
      dayMap[k] = (dayMap[k] || 0) + count;
    }

    // Generate exactly 365 days ending today (same window LeetCode uses)
    const cells = [];
    const now = new Date();
    for (let i = 364; i >= 0; i--) {
      const d = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i),
      );
      const k = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
      cells.push({
        dateKey: k,
        date: d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          timeZone: "UTC",
        }),
        month: d.getUTCMonth(),
        year: d.getUTCFullYear(),
        dayOfWeek: d.getUTCDay(), // 0 = Sun
        count: dayMap[k] || 0,
      });
    }
    return cells;
  }, [stats?.submissionCalendar]);

  // Not connected state
  if (!connected) {
    return (
      <ConnectPrompt
        platform="LeetCode"
        message={isPublic ? "This student hasn't connected their LeetCode account yet." : "Set your LeetCode handle in your profile to start tracking your progress."}
        testid="lc-connect-prompt"
        isPublic={isPublic}
      />
    );
  }

  // Connected but never synced
  if (!synced || !stats) {
    return (
      <SyncPrompt
        platform="LeetCode"
        message={isPublic ? "This student hasn't synced their stats yet." : "Click 'Sync LeetCode' to pull your stats for the first time."}
        testid="lc-sync-prompt"
        isPublic={isPublic}
      />
    );
  }

  const displayStats = {
    total_solved: stats.totalSolved || 0,
    easy: stats.easy || 0,
    medium: stats.medium || 0,
    hard: stats.hard || 0,
    contest_rating: stats.contestRating || 0,
    contests_attended: stats.contestsAttended || 0,
    global_ranking: stats.globalRanking || 0,
    streak: stats.streak || 0,
    active_days: stats.activeDays || 0,
    universal_score: stats.universalScore || 0,
    leetcode_score: stats.leetcodeScore || 0,
    rating_history: stats.ratingHistory || [],
  };

  const lcBadges = stats.badges || [];

  return (
    <>
      {/* Metrics row */}
      <section
        className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-10"
        data-testid="lc-metrics"
      >
        <Metric
          label="Total Solved"
          value={displayStats.total_solved}
          sub={`#${displayStats.global_ranking?.toLocaleString() || "-"} global`}
        />
        <Metric
          label="Contest Rating"
          value={displayStats.contest_rating?.toFixed(0) || 0}
          sub={`${displayStats.contests_attended} contests`}
          mono
        />
        <Metric
          label="Current Streak"
          value={`${displayStats.streak}d`}
          sub={`${displayStats.active_days} active days in 30d`}
        />
        <Metric
          label="LeetCode Score"
          value={Math.round(
            displayStats.leetcode_score || displayStats.universal_score,
          )}
          sub="lucy V1 score"
        />
      </section>

      {/* Charts row */}
      <section className="grid lg:grid-cols-5 gap-5 mt-6">
        <Card
          title="Difficulty Breakdown"
          subtitle="Easy / Medium / Hard"
          testid="lc-card-difficulty"
          className="lg:col-span-2"
        >
          <div className="grid grid-cols-5 gap-4 items-center">
            <div className="col-span-3 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      {
                        name: "Easy",
                        value: displayStats.easy,
                        color: "#10B981",
                      },
                      {
                        name: "Medium",
                        value: displayStats.medium,
                        color: "#F59E0B",
                      },
                      {
                        name: "Hard",
                        value: displayStats.hard,
                        color: "#F43F5E",
                      },
                    ]}
                    dataKey="value"
                    innerRadius={50}
                    outerRadius={80}
                    strokeWidth={2}
                    stroke="#fff"
                    paddingAngle={2}
                  >
                    {["#10B981", "#F59E0B", "#F43F5E"].map((c, i) => (
                      <Cell key={i} fill={c} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 6,
                      fontSize: 12,
                      color: "hsl(var(--foreground))",
                    }}
                    itemStyle={{ color: "hsl(var(--foreground))" }}
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

        <Card
          title="Rating Trend"
          subtitle={`${displayStats.contests_attended} contests attended`}
          testid="lc-card-rating"
          className="lg:col-span-3"
        >
          {displayStats.rating_history.length > 0 ? (
            <RatingChart
              history={displayStats.rating_history}
              gradientId="lcRatingGrad"
            />
          ) : (
            <EmptyChart label="no contest data yet" />
          )}
        </Card>
      </section>

      {/* Heatmap — full width */}
      <section className="mt-6">
        <Card
          title="Submission History"
          subtitle="Past 12 months"
          testid="lc-card-heatmap"
        >
          <YearHeatmap cells={heatmapData} />
        </Card>
      </section>

      {/* Badges */}
      <section className="mt-6">
        <Card
          title="Badges"
          subtitle={`${lcBadges.length} earned`}
          testid="lc-card-badges"
        >
          <BadgeGrid badges={lcBadges} />
        </Card>
      </section>

      {/* Profile footer */}
      <ProfileFooter profile={profile} stats={stats} platform="leetcode" />
    </>
  );
}

export function CodeforcesView({ data, profile, isPublic }) {
  const connected = data?.connected;
  const synced = data?.synced;
  const stats = data?.stats;

  if (!connected) {
    return (
      <ConnectPrompt
        platform="Codeforces"
        message={isPublic ? "This student hasn't connected their Codeforces account yet." : "Set your Codeforces handle in your profile to start tracking your competitive programming stats."}
        testid="cf-connect-prompt"
        isPublic={isPublic}
      />
    );
  }

  if (!synced || !stats) {
    return (
      <SyncPrompt
        platform="Codeforces"
        message={isPublic ? "This student hasn't synced their stats yet." : "Click 'Sync Codeforces' to pull your stats for the first time."}
        testid="cf-sync-prompt"
        isPublic={isPublic}
      />
    );
  }

  return (
    <>
      {/* Metrics row */}
      <section
        className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-10"
        data-testid="cf-metrics"
      >
        <Metric
          label="CF Rating"
          value={stats.rating || 0}
          sub={
            <span className={`font-medium ${cfRankColor(stats.rank)}`}>
              {stats.rank || "unrated"}
            </span>
          }
        />
        <Metric
          label="Max Rating"
          value={stats.maxRating || 0}
          sub={stats.maxRank || "–"}
          mono
        />
        <Metric
          label="Problems Solved"
          value={stats.totalSolved || 0}
          sub={`${stats.totalSubmissions || 0} submissions`}
        />
        <Metric
          label="Codeforces Score"
          value={Math.round(stats.codeforcesScore || 0)}
          sub="lucy V1 score"
        />
      </section>

      {/* Stats row */}
      <section className="grid grid-cols-2 md:grid-cols-3 gap-5 mt-6">
        <Metric
          label="Contests Attended"
          value={stats.contestsAttended || 0}
          sub="rated contests"
        />
        <Metric
          label="Contribution"
          value={stats.contribution || 0}
          sub="CF contribution"
          mono
        />
        <Metric
          label="Friend Of"
          value={stats.friendOfCount || 0}
          sub="users"
        />
      </section>

      {/* Rating trend */}
      <section className="grid lg:grid-cols-5 gap-5 mt-6">
        <Card
          title="Rating History"
          subtitle={`${stats.contestsAttended || 0} contests`}
          testid="cf-card-rating"
          className="lg:col-span-3"
        >
          {stats.ratingHistory?.length > 0 ? (
            <CFRatingChart history={stats.ratingHistory} />
          ) : (
            <EmptyChart label="no contest history yet" />
          )}
        </Card>

        <Card
          title="Top Tags"
          subtitle="by problems solved"
          testid="cf-card-tags"
          className="lg:col-span-2"
        >
          <TagList tags={stats.tagStats || []} />
        </Card>
      </section>

      {/* Rating-wise solved + Language */}
      <section className="grid lg:grid-cols-2 gap-5 mt-6">
        <Card
          title="Rating-wise Solved"
          subtitle="unique problems by difficulty"
          testid="cf-card-rating-wise"
        >
          <RatingWiseList buckets={stats.ratingWiseSolved || []} />
        </Card>
        <Card
          title="Language Usage"
          subtitle="by submission count"
          testid="cf-card-languages"
        >
          <LanguageList languages={stats.languageStats || []} />
        </Card>
      </section>

      {/* Profile footer */}
      <ProfileFooter profile={profile} stats={stats} platform="codeforces" />
    </>
  );
}

function ConnectPrompt({ platform, message, testid, isPublic }) {
  return (
    <div
      className="mt-14 flex flex-col items-center text-center gap-4"
      data-testid={testid}
    >
      <div className="h-16 w-16 rounded-full bg-muted border border-border flex items-center justify-center">
        {platform === "LeetCode" ? (
          <Code2 size={28} className="text-muted-foreground" />
        ) : (
          <Cpu size={28} className="text-muted-foreground" />
        )}
      </div>
      <div>
        <div className="font-heading text-xl text-foreground">
          {platform} not connected
        </div>
        <div className="text-sm text-muted-foreground mt-1 max-w-xs">
          {message}
        </div>
      </div>
      {!isPublic && (
        <div className="text-xs font-mono-display text-muted-foreground">
          Click <strong>Edit profile</strong> to add your handle.
        </div>
      )}
    </div>
  );
}

function SyncPrompt({ platform, message, testid, isPublic }) {
  return (
    <div
      className="mt-14 flex flex-col items-center text-center gap-4"
      data-testid={testid}
    >
      <div className="h-16 w-16 rounded-full bg-muted border border-border flex items-center justify-center">
        <RefreshCw size={28} className="text-muted-foreground" />
      </div>
      <div>
        <div className="font-heading text-xl text-foreground">
          {platform} not synced yet
        </div>
        <div className="text-sm text-muted-foreground mt-1 max-w-xs">
          {message}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, sub, mono }) {
  return (
    <div className="bg-card border border-border rounded-md p-6">
      <div className="text-overline">{label}</div>
      <div
        className={`font-heading text-3xl text-foreground mt-2 ${mono ? "font-mono-display" : ""}`}
      >
        {value}
      </div>
      {sub && (
        <div className="text-xs text-muted-foreground mt-1 font-mono-display">
          {sub}
        </div>
      )}
    </div>
  );
}

function Card({ title, subtitle, children, testid, className = "" }) {
  return (
    <div
      className={`bg-card border border-border rounded-md p-6 shadow-sm ${className}`}
      data-testid={testid}
    >
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
        <span
          className="h-2.5 w-2.5 rounded-sm"
          style={{ background: color }}
        />
        {label}
      </span>
      <span className="font-mono-display text-foreground">{value}</span>
    </div>
  );
}

function EmptyChart({ label }) {
  return (
    <div className="h-56 grid place-items-center text-muted-foreground text-sm font-mono-display">
      {label}
    </div>
  );
}

function RatingChart({ history, gradientId = "ratingGrad" }) {
  const data = history.map((e) => ({
    ...e,
    date: new Date(
      (e.timestamp || e.ratingUpdateTimeSeconds || 0) * 1000,
    ).toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
  }));
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="hsl(var(--primary))"
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor="hsl(var(--primary))"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={{ stroke: "hsl(var(--border))" }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            axisLine={false}
            tickLine={false}
            domain={["dataMin - 50", "dataMax + 50"]}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
              padding: "8px 12px",
            }}
            formatter={(v) => [`${v}`, "Rating"]}
            labelFormatter={(l, p) =>
              p?.[0]?.payload?.contest || p?.[0]?.payload?.contestName || l
            }
          />
          <Area
            type="monotone"
            dataKey="rating"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={{ r: 3, fill: "hsl(var(--primary))", strokeWidth: 0 }}
            activeDot={{
              r: 5,
              fill: "hsl(var(--primary))",
              stroke: "hsl(var(--background))",
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function CFRatingChart({ history }) {
  // CF ratingHistory timestamps come as ISO strings; convert to seconds for RatingChart
  const data = history.map((e) => ({
    rating: e.newRating,
    contest: e.contestName,
    timestamp: new Date(e.timestamp).getTime() / 1000,
    date: new Date(e.timestamp).toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    }),
  }));
  return <RatingChart history={data} gradientId="cfRatingGrad" />;
}

function YearHeatmap({ cells }) {
  const [tooltip, setTooltip] = useState(null); // { text, x, y } — fixed viewport coords

  const CELL = 13;
  const GAP = 2;
  const MONTH_GAP = 6; // the visual gap between months

  // Pad the front so the grid starts on a Sunday
  const firstDow = cells[0]?.dayOfWeek ?? 0;
  const padded = [...Array.from({ length: firstDow }, () => null), ...cells];

  const columns = [];
  let currentColumn = new Array(7).fill(null);
  let currentNewMonth = false;
  let currentLabel = null;
  let prevMonth = null;
  let dayIndex = 0;

  padded.forEach((cell) => {
    if (cell) {
      const currMonth = cell.month;
      if (prevMonth === null) {
        prevMonth = currMonth;
        const d = new Date(Date.UTC(cell.year, cell.month, 1));
        currentLabel = d.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
      } else if (currMonth !== prevMonth) {
        if (dayIndex > 0) {
          columns.push({ cells: currentColumn, newMonth: currentNewMonth, label: currentLabel });
          currentColumn = new Array(7).fill(null);
        }
        currentNewMonth = true;
        const d = new Date(Date.UTC(cell.year, cell.month, 1));
        currentLabel = d.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
        prevMonth = currMonth;
      }
    }
    
    currentColumn[dayIndex] = cell;
    dayIndex++;
    
    if (dayIndex === 7) {
      columns.push({ cells: currentColumn, newMonth: currentNewMonth, label: currentLabel });
      currentColumn = new Array(7).fill(null);
      currentNewMonth = false;
      currentLabel = null;
      dayIndex = 0;
    }
  });

  if (dayIndex > 0) {
    columns.push({ cells: currentColumn, newMonth: currentNewMonth, label: currentLabel });
  }

  // 6-level intensity (0 = empty, 1–5 = increasing green)
  const level = (count) => {
    if (count === 0) return 0;
    if (count === 1) return 1;
    if (count <= 3) return 2;
    if (count <= 6) return 3;
    if (count <= 10) return 4;
    return 5;
  };

  const totalSubmissions = cells.reduce((s, c) => s + c.count, 0);
  const activeDays = cells.filter((c) => c.count > 0).length;

  return (
    <div className="w-full overflow-x-auto year-heatmap-root select-none">
      <div style={{ display: "inline-block", minWidth: "100%", paddingLeft: "20px", paddingRight: "20px" }}>
        {/* Month label row — mirrors the exact margin logic of the cell grid */}
        <div className="flex items-end" style={{ gap: 0, marginBottom: 4 }}>
          {columns.map((col, ci) => {
            const { label, newMonth } = col;
            return (
              <div
                key={ci}
                className="shrink-0"
                style={{
                  width: CELL,
                  marginLeft: ci === 0 ? 0 : newMonth ? GAP + MONTH_GAP : GAP,
                }}
              >
                {label && (
                  <span
                    className="text-[10px] font-mono-display text-muted-foreground"
                    style={{ whiteSpace: "nowrap", display: "block" }}
                  >
                    {label}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Cell columns */}
        <div className="flex items-start" style={{ gap: 0 }}>
          {columns.map((col, ci) => {
            const { newMonth, cells: weekCells } = col;
            return (
              <div
                key={ci}
                className="flex flex-col shrink-0"
                style={{
                  gap: GAP,
                  marginLeft: ci === 0 ? 0 : newMonth ? GAP + MONTH_GAP : GAP,
                }}
              >
                {weekCells.map((cell, di) => {
                  if (!cell) {
                    return (
                      <div
                        key={`p-${ci}-${di}`}
                        style={{ width: CELL, height: CELL }}
                      />
                    );
                  }
                  const lvl = level(cell.count);
                  const tooltipText =
                    cell.count === 0
                      ? `0 submissions on ${cell.date}`
                      : `${cell.count} submission${cell.count === 1 ? "" : "s"} on ${cell.date}`;

                  return (
                    <div
                      key={cell.dateKey}
                      className={`heat-cell${lvl ? ` heat-${lvl}` : ""} cursor-default transition-opacity hover:opacity-80`}
                      style={{ width: CELL, height: CELL, borderRadius: 3 }}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setTooltip({
                          text: tooltipText,
                          x: rect.left + CELL / 2,
                          y: rect.top - 10,
                        });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Summary + legend */}
        <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="font-mono-display">
            {activeDays} active days · {totalSubmissions} submissions in the
            last year
          </span>
          <div className="flex items-center gap-1.5">
            <span className="font-mono-display">less</span>
            {[0, 1, 2, 3, 4, 5].map((l) => (
              <div
                key={l}
                className={`heat-cell${l ? ` heat-${l}` : ""}`}
                style={{ width: CELL, height: CELL, borderRadius: 3 }}
              />
            ))}
            <span className="font-mono-display">more</span>
          </div>
        </div>
      </div>

      {/* Tooltip — fixed so overflow-x-auto can't clip it */}
      {tooltip && (
        <div
          className="pointer-events-none fixed whitespace-nowrap font-mono-display text-[12px] font-medium"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: "translate(-50%, -100%)",
            background: "rgba(22,27,34,0.97)",
            color: "#fff",
            padding: "6px 12px",
            borderRadius: 6,
            boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
            zIndex: 9999,
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}

function Heatmap({ cells }) {
  return (
    <>
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: "repeat(15,minmax(0,1fr))" }}
      >
        {cells.map((c, i) => {
          const lvl = c.count > 0 ? Math.min(Math.ceil(c.count / 2), 4) : 0;
          return (
            <div
              key={i}
              title={`${c.date} — ${c.count} submission${c.count === 1 ? "" : "s"}`}
              className={`heat-cell ${lvl ? "heat-" + lvl : ""}`}
            />
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-mono-display">less</span>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((l) => (
            <div key={l} className={`heat-cell ${l ? "heat-" + l : ""}`} />
          ))}
        </div>
        <span className="font-mono-display">more</span>
      </div>
    </>
  );
}

function BadgeGrid({ badges }) {
  const [hoveredId, setHoveredId] = useState(null);
  const [showAll, setShowAll] = useState(false);

  if (!badges.length) {
    return (
      <div className="h-32 grid place-items-center text-muted-foreground text-sm">
        No badges yet — start solving!
      </div>
    );
  }

  // Resolve icon URL — relative paths need the leetcode.com prefix
  const resolveIcon = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `https://leetcode.com${url}`;
  };

  // Category → subtle background tint
  const categoryStyle = (cat) => {
    switch (cat?.toUpperCase()) {
      case 'SUBMISSION': return 'border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10';
      case 'ANNUAL': return 'border-violet-500/30 bg-violet-500/5 dark:bg-violet-500/10';
      case 'DCC': return 'border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10';
      default: return 'border-border bg-muted/30';
    }
  };

  const sortedBadges = [...badges].sort((a, b) => {
    const dateA = a.creationDate ? new Date(a.creationDate).getTime() : 0;
    const dateB = b.creationDate ? new Date(b.creationDate).getTime() : 0;
    return dateB - dateA;
  });

  const displayedBadges = showAll ? sortedBadges : sortedBadges.slice(0, 5);
  const hasMore = sortedBadges.length > 5;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {displayedBadges.map((badge) => {
        const iconUrl = resolveIcon(badge.medal?.config?.iconGif || badge.icon);
        const staticUrl = resolveIcon(badge.icon);
        const isHovered = hoveredId === badge.id;

        return (
          <div
            key={badge.id}
            className={`relative border rounded-lg p-3 flex flex-col items-center gap-2 cursor-default transition-all duration-150 hover:scale-105 hover:shadow-md ${categoryStyle(badge.category)}`}
            onMouseEnter={() => setHoveredId(badge.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            {/* Badge icon — show the gif on hover, static image otherwise */}
            <div className="w-12 h-12 flex items-center justify-center">
              <img
                src={isHovered && iconUrl ? iconUrl : staticUrl}
                alt={badge.displayName}
                className="w-12 h-12 object-contain"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>

            <div className="text-center">
              <div className="text-[11px] font-medium text-foreground leading-tight line-clamp-2">
                {badge.displayName}
              </div>
              {badge.creationDate && (
                <div className="text-[10px] text-muted-foreground font-mono-display mt-0.5">
                  {new Date(badge.creationDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              )}
            </div>
          </div>
        );
      })}
      {!showAll && hasMore && (
        <div
          onClick={() => setShowAll(true)}
          className="relative border border-dashed border-border rounded-lg p-3 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-150 hover:bg-muted/50"
        >
          <div className="text-muted-foreground text-sm font-medium">
            +{badges.length - 5} More
          </div>
        </div>
      )}
      {showAll && hasMore && (
        <div
          onClick={() => setShowAll(false)}
          className="relative border border-dashed border-border rounded-lg p-3 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-150 hover:bg-muted/50"
        >
          <div className="text-muted-foreground text-sm font-medium">
            Show Less
          </div>
        </div>
      )}
    </div>
  );
}

function TagList({ tags }) {
  const top = tags.slice(0, 8);
  if (!top.length)
    return (
      <div className="text-sm text-muted-foreground">No tag data yet.</div>
    );
  const max = top[0]?.solved || 1;
  return (
    <div className="space-y-2">
      {top.map((t) => (
        <div key={t.tag} className="flex items-center gap-3">
          <div className="text-xs text-muted-foreground w-28 truncate">
            {t.tag}
          </div>
          <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-primary h-full rounded-full"
              style={{ width: `${(t.solved / max) * 100}%` }}
            />
          </div>
          <div className="text-xs font-mono-display text-muted-foreground w-6 text-right">
            {t.solved}
          </div>
        </div>
      ))}
    </div>
  );
}

function RatingWiseList({ buckets }) {
  if (!buckets.length)
    return (
      <div className="text-sm text-muted-foreground">No rating data yet.</div>
    );
  const max = Math.max(...buckets.map((b) => b.count), 1);

  // Colour per CF rating bracket — matches official CF colour scheme
  const bucketColor = (rating) => {
    if (rating >= 2400) return { bar: "bg-red-600", label: "text-red-500" };
    if (rating >= 2100)
      return { bar: "bg-orange-500", label: "text-orange-400" };
    if (rating >= 1900)
      return { bar: "bg-violet-500", label: "text-violet-400" };
    if (rating >= 1600) return { bar: "bg-blue-500", label: "text-blue-400" };
    if (rating >= 1400) return { bar: "bg-cyan-500", label: "text-cyan-400" };
    if (rating >= 1200) return { bar: "bg-green-500", label: "text-green-400" };
    return { bar: "bg-slate-400", label: "text-slate-400" };
  };

  return (
    <div className="space-y-2">
      {buckets.map((b) => {
        const { bar, label } = bucketColor(b.rating);
        return (
          <div key={b.rating} className="flex items-center gap-3">
            <div
              className={`text-xs font-mono-display w-12 text-right shrink-0 ${label}`}
            >
              {b.rating}
            </div>
            <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
              <div
                className={`${bar} h-full rounded-full transition-all`}
                style={{ width: `${(b.count / max) * 100}%` }}
              />
            </div>
            <div className="text-xs font-mono-display text-muted-foreground w-6 text-right shrink-0">
              {b.count}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LanguageList({ languages }) {
  const top = languages.slice(0, 6);
  if (!top.length)
    return (
      <div className="text-sm text-muted-foreground">No language data yet.</div>
    );
  const max = top[0]?.count || 1;
  return (
    <div className="space-y-2">
      {top.map((l) => (
        <div key={l.language} className="flex items-center gap-3">
          <div className="text-xs text-muted-foreground w-28 truncate">
            {l.language}
          </div>
          <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full"
              style={{ width: `${(l.count / max) * 100}%` }}
            />
          </div>
          <div className="text-xs font-mono-display text-muted-foreground w-8 text-right">
            {l.count}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProfileFooter({ profile, stats, platform }) {
  const handle =
    platform === "leetcode"
      ? profile?.leetcodeUsername
      : stats?.handle || profile?.codeforcesUsername;
  const url =
    platform === "leetcode"
      ? `https://leetcode.com/${handle}/`
      : `https://codeforces.com/profile/${handle}`;
  const label =
    platform === "leetcode" ? "View on LeetCode" : "View on Codeforces";
  const avatar = stats?.avatar?.startsWith("https://userpic.codeforces.org/")
    ? `https://codeforces.com/${stats.avatar.replace("https://", "")}`
    : stats?.avatar ||
    profile?.avatar ||
    `https://api.dicebear.com/7.x/initials/svg?seed=${profile?.name || "U"}`;
  return (
    <section className="mt-6 bg-card border border-border rounded-md p-6 flex flex-col md:flex-row md:items-center gap-5">
      <img
        src={avatar}
        alt=""
        className="h-14 w-14 rounded-full border border-border"
      />
      <div className="flex-1">
        <div className="font-heading text-xl text-foreground">
          {profile?.name}
        </div>
        <div className="text-sm text-muted-foreground">
          {profile?.email || ""}
        </div>
      </div>
      {handle && (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ExternalLink size={14} /> {label}
        </a>
      )}
    </section>
  );
}

function computeLeetcodeBadges(s) {
  const b = [];
  if (s.total_solved >= 50)
    b.push({ name: "First 50", icon: "Trophy", tier: "bronze" });
  if (s.total_solved >= 200)
    b.push({ name: "Problem Hunter", icon: "Target", tier: "silver" });
  if (s.total_solved >= 500)
    b.push({ name: "500 Club", icon: "Medal", tier: "gold" });
  if (s.total_solved >= 1000)
    b.push({ name: "Quad-Digit Coder", icon: "Crown", tier: "platinum" });
  if (s.hard >= 50) b.push({ name: "Hard Mode", icon: "Flame", tier: "gold" });
  if (s.hard >= 150)
    b.push({ name: "Iron Will", icon: "Mountain", tier: "platinum" });
  if (s.contest_rating >= 1600)
    b.push({ name: "Contest Regular", icon: "Award", tier: "silver" });
  if (s.contest_rating >= 1900)
    b.push({ name: "Knight", icon: "Shield", tier: "gold" });
  if (s.contest_rating >= 2200)
    b.push({ name: "Guardian", icon: "Star", tier: "platinum" });
  if (s.streak >= 7)
    b.push({ name: "Week Streak", icon: "Zap", tier: "bronze" });
  if (s.streak >= 30)
    b.push({ name: "30-Day Grind", icon: "Flame", tier: "gold" });
  if (s.contests_attended >= 10)
    b.push({ name: "Contest Veteran", icon: "Swords", tier: "silver" });
  return b;
}
