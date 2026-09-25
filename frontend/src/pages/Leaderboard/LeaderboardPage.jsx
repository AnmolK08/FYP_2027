import { useState } from 'react';
import { Link } from 'react-router-dom';
import ProtectedRoute from '@/routes/ProtectedRoute';
import {
  useLeaderboard,
  useMyLeaderboardRank,
  useNearbyUsers,
  LEADERBOARD_TYPES,
  LEADERBOARD_LABELS,
} from '../../features/leaderboard/hooks/useLeaderboard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, ChevronLeft, ChevronRight, Medal } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Score field by type
const scoreField = (row, type) => {
  if (type === 'leetcode')   return row.leetcodeScore   ?? row.score ?? 0;
  if (type === 'codeforces') return row.codeforcesScore ?? row.score ?? 0;
  return row.lucyScore ?? row.score ?? 0;
};

const scoreLabel = { lucy: 'Lucy Score', leetcode: 'LC Score', codeforces: 'CF Score' };

export default function LeaderboardPage() {
  const [type, setType] = useState('lucy');
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading: loading } = useLeaderboard(type, page, limit);
  const { data: myRank }             = useMyLeaderboardRank(type);
  const { data: nearby }             = useNearbyUsers(type, 2);

  // Reset to page 1 when the board type changes
  const handleTypeChange = (t) => {
    setType(t);
    setPage(1);
  };

  const rows       = data?.users      || [];
  const totalPages = data?.totalPages || 1;
  const totalUsers = data?.total      || 0;
  const podium     = page === 1 ? rows.slice(0, 3) : [];

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 md:py-14">

          {/* ── Header ── */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div>
              <div className="text-overline">Compete</div>
              <h1 className="font-heading text-3xl lg:text-5xl tracking-tight text-foreground mt-2">
                Leaderboard
              </h1>
              <p className="text-muted-foreground mt-2 text-sm">
                {type === 'lucy' && 'Lucy Score = LeetCode Score + Codeforces Score'}
                {type === 'leetcode' && 'LeetCode Score = Easy×1 + Medium×3 + Hard×6 + Rating×0.5'}
                {type === 'codeforces' && 'Codeforces Score = Solved × Difficulty Weight + Rating×0.5'}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-overline">{totalUsers} students</span>
              {myRank?.rank && (
                <div className="text-sm font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-800">
                  My Rank: #{myRank.rank} · {Math.round(myRank.score || 0)} pts
                </div>
              )}
            </div>
          </div>

          {/* ── Type switcher ── */}
          <div
            className="mt-6 inline-flex items-center gap-1 bg-muted border border-border rounded-lg p-1"
            role="tablist"
            aria-label="Leaderboard type"
          >
            {LEADERBOARD_TYPES.map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={type === t}
                onClick={() => handleTypeChange(t)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  type === t
                    ? 'bg-background text-foreground shadow-sm border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {LEADERBOARD_LABELS[t]}
              </button>
            ))}
          </div>

          {/* ── Podium (page 1 only) ── */}
          {podium.length === 3 && (
            <section className="mt-8 grid grid-cols-3 gap-4" data-testid="podium">
              <PodiumCard row={podium[1]} place={2} type={type} />
              <PodiumCard row={podium[0]} place={1} type={type} featured />
              <PodiumCard row={podium[2]} place={3} type={type} />
            </section>
          )}

          {/* ── Main table ── */}
          <section className="mt-6 bg-card border border-border rounded-md overflow-hidden">
            <LeaderboardTable rows={rows} loading={loading} type={type} />

            {!loading && totalPages > 1 && (
              <div className="p-4 border-t border-border flex items-center justify-between">
                <Button
                  variant="outline" size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft size={16} className="mr-1" /> Previous
                </Button>
                <div className="text-sm text-muted-foreground font-mono-display">
                  Page {page} of {totalPages}
                </div>
                <Button
                  variant="outline" size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>
            )}
          </section>

          {/* ── Nearby (only when off page 1) ── */}
          {page > 1 && nearby?.users?.length > 0 && (
            <section className="mt-6">
              <div className="text-overline mb-2">Around you</div>
              <div className="bg-card border border-border rounded-md overflow-hidden">
                <LeaderboardTable rows={nearby.users} loading={false} type={type} compact />
              </div>
            </section>
          )}

        </div>
      </main>
    </ProtectedRoute>
  );
}


function LeaderboardTable({ rows, loading, type, compact = false }) {
  if (loading) {
    return (
      <div className="p-10 text-center text-muted-foreground font-mono-display text-sm">
        loading...
      </div>
    );
  }
  if (!rows.length) {
    return (
      <div className="p-12 text-center text-muted-foreground">
        <div className="font-heading text-foreground text-lg">No students on this board yet.</div>
        <div className="text-sm mt-1">Sync your {LEADERBOARD_LABELS[type]} account to appear here.</div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted border-b border-border sticky top-0">
          <tr className="text-left text-overline">
            <th className="px-5 py-3 w-16">Rank</th>
            <th className="px-5 py-3">Student</th>
            {!compact && <th className="px-5 py-3 hidden md:table-cell">College – Dept</th>}
            {type === 'leetcode' && (
              <>
                <th className="px-5 py-3 text-right">Solved</th>
                <th className="px-5 py-3 text-right hidden sm:table-cell">E/M/H</th>
                <th className="px-5 py-3 text-right hidden sm:table-cell">LC Rating</th>
              </>
            )}
            {type === 'codeforces' && (
              <>
                <th className="px-5 py-3 text-right">CF Solved</th>
                <th className="px-5 py-3 text-right hidden sm:table-cell">CF Rating</th>
                <th className="px-5 py-3 text-right hidden sm:table-cell">Contests</th>
              </>
            )}
            {type === 'lucy' && (
              <>
                <th className="px-5 py-3 text-right hidden sm:table-cell">LC Rating</th>
                <th className="px-5 py-3 text-right">LC Solved</th>
                <th className="px-5 py-3 text-right hidden sm:table-cell">CF Rating</th>
                <th className="px-5 py-3 text-right">CF Solved</th>
              </>
            )}
            <th className="px-5 py-3 text-right">{scoreLabel[type]}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.userId}
              className={`border-b border-border last:border-0 hover:bg-muted/50 ${
                r.is_me ? 'bg-amber-50/40 dark:bg-amber-900/10' : ''
              }`}
            >
              <td className="px-5 py-4">
                <div className="flex items-center gap-2">
                  {r.rank <= 3 && (
                    <Medal
                      size={14}
                      className={
                        r.rank === 1 ? 'text-amber-500' :
                        r.rank === 2 ? 'text-slate-400' : 'text-amber-700'
                      }
                    />
                  )}
                  <span className="font-mono-display text-muted-foreground">#{r.rank}</span>
                </div>
              </td>

              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <Link to={`/u/${r.lucyUsername || r.leetcodeUsername || r.userId}`}>
                    <Avatar className="h-8 w-8 border border-border cursor-pointer">
                      <AvatarImage src={r.avatar} alt={r.name} />
                      <AvatarFallback>{(r.name || 'U').charAt(0)}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/u/${r.lucyUsername || r.leetcodeUsername || r.userId}`}
                        className="font-medium text-foreground hover:text-primary hover:underline"
                      >
                        {r.name}
                      </Link>
                      {r.is_me && (
                        <span className="text-[10px] uppercase font-mono-display tracking-widest text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-1.5 py-0.5 rounded">
                          you
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-mono-display text-muted-foreground">
                      @{r.lucyUsername || r.leetcodeUsername || r.codeforcesUsername || '-'}
                    </div>
                  </div>
                </div>
              </td>

              {!compact && (
                <td className="px-5 py-4 hidden md:table-cell">
                  <div className="text-foreground uppercase">{r.college || '–'}</div>
                  <div className="text-xs text-muted-foreground uppercase">{r.department || '–'}</div>
                </td>
              )}

              {/* LeetCode columns */}
              {type === 'leetcode' && (
                <>
                  <td className="px-5 py-4 text-right font-mono-display font-medium">
                    {r.lcTotalSolved ?? r.totalSolved ?? 0}
                  </td>
                  <td className="px-5 py-4 text-right font-mono-display text-xs hidden sm:table-cell">
                    <span className="text-emerald-600 dark:text-emerald-400">{r.lcEasy ?? r.easy ?? 0}</span>
                    <span className="text-muted-foreground mx-1">-</span>
                    <span className="text-amber-600 dark:text-amber-400">{r.lcMedium ?? r.medium ?? 0}</span>
                    <span className="text-muted-foreground mx-1">-</span>
                    <span className="text-rose-600 dark:text-rose-400">{r.lcHard ?? r.hard ?? 0}</span>
                  </td>
                  <td className="px-5 py-4 text-right font-mono-display hidden sm:table-cell">
                    {Math.round(r.lcContestRating ?? r.contestRating ?? 0)}
                  </td>
                </>
              )}

              {/* Codeforces columns */}
              {type === 'codeforces' && (
                <>
                  <td className="px-5 py-4 text-right font-mono-display font-medium">
                    {r.totalSolved ?? 0}
                  </td>
                  <td className="px-5 py-4 text-right font-mono-display hidden sm:table-cell">
                    {r.cfRating ?? 0}
                  </td>
                  <td className="px-5 py-4 text-right font-mono-display hidden sm:table-cell">
                    {r.contestsAttended ?? 0}
                  </td>
                </>
              )}

              {/* Lucy columns: LC Rating, LC Solved, CF Rating, CF Solved */}
              {type === 'lucy' && (
                <>
                  <td className="px-5 py-4 text-right font-mono-display hidden sm:table-cell">
                    {Math.round(r.lcContestRating ?? r.contestRating ?? 0)}
                  </td>
                  <td className="px-5 py-4 text-right font-mono-display font-medium">
                    {r.lcTotalSolved ?? r.totalSolved ?? 0}
                  </td>
                  <td className="px-5 py-4 text-right font-mono-display hidden sm:table-cell">
                    {r.cfRating ?? 0}
                  </td>
                  <td className="px-5 py-4 text-right font-mono-display font-medium">
                    {r.cfTotalSolved ?? r.cfSolved ?? 0}
                  </td>
                </>
              )}

              {/* Score */}
              <td className="px-5 py-4 text-right font-mono-display font-semibold text-foreground">
                {Math.round(scoreField(r, type))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


function PodiumCard({ row, place, type, featured }) {
  if (!row) return <div />;
  const tone =
    place === 1 ? 'border-amber-300 bg-amber-50/40 dark:border-amber-700 dark:bg-amber-900/20'
    : place === 2 ? 'border-slate-300 bg-slate-50/60 dark:border-slate-600 dark:bg-slate-800/20'
    : 'border-amber-200 bg-amber-50/30 dark:border-amber-800 dark:bg-amber-900/10';

  return (
    <div
      className={`border ${tone} rounded-md p-5 flex flex-col items-center text-center ${
        featured ? 'md:scale-[1.04]' : 'opacity-95'
      }`}
      data-testid={`podium-${place}`}
    >
      <div className="flex items-center gap-1 text-overline">
        {place === 1 && <Trophy size={14} className="text-amber-500" />}
        #{place}
      </div>
      <Link to={`/u/${row.lucyUsername || row.leetcodeUsername || row.userId}`} className="mt-3 hover:opacity-80">
        <Avatar className="h-14 w-14 border border-border cursor-pointer">
          <AvatarImage src={row.avatar} alt={row.name} />
          <AvatarFallback>{(row.name || 'U').charAt(0)}</AvatarFallback>
        </Avatar>
      </Link>
      <Link
        to={`/u/${row.lucyUsername || row.leetcodeUsername || row.userId}`}
        className="font-heading text-foreground mt-2 hover:text-primary hover:underline"
      >
        {row.name}
      </Link>
      <div className="text-xs text-muted-foreground font-mono-display mt-0.5">
        @{row.lucyUsername || row.leetcodeUsername || row.codeforcesUsername || '-'}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{row.college}</div>
      <div className="mt-3 font-heading text-2xl text-foreground">
        {Math.round(scoreField(row, type))}
      </div>
      <div className="text-xs text-muted-foreground font-mono-display mt-1">
        {scoreLabel[type]}
      </div>
    </div>
  );
}
