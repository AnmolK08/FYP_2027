import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Medal } from 'lucide-react';

export default function LeaderboardTable({ rows, loading }) {
  if (loading) {
    return (
      <div className="p-10 text-center text-muted-foreground font-mono-display text-sm" data-testid="leaderboard-loading">
        loading...
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="p-12 text-center text-muted-foreground" data-testid="leaderboard-empty">
        <div className="font-heading text-foreground text-lg">No students match this view.</div>
        <div className="text-sm mt-1">Try a different scope or sort.</div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" data-testid="leaderboard-table">
        <thead className="bg-muted border-b border-border sticky top-0">
          <tr className="text-left text-overline">
            <th className="px-5 py-3 w-16">Rank</th>
            <th className="px-5 py-3">Student</th>
            <th className="px-5 py-3 hidden md:table-cell">College - Dept</th>
            <th className="px-5 py-3 text-right">Solved</th>
            <th className="px-5 py-3 text-right hidden sm:table-cell">E/M/H</th>
            <th className="px-5 py-3 text-right">Rating</th>
            <th className="px-5 py-3 text-right">Score</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.user_id}
              data-testid={`row-${r.user_id}`}
              className={`border-b border-border last:border-0 hover:bg-muted/50 ${r.is_me ? 'bg-amber-50/40 dark:bg-amber-900/10' : ''}`}
            >
              <td className="px-5 py-4">
                <div className="flex items-center gap-2">
                  {r.rank <= 3 ? (
                    <Medal
                      size={14}
                      className={
                        r.rank === 1
                          ? 'text-amber-500'
                          : r.rank === 2
                          ? 'text-slate-400'
                          : 'text-amber-700'
                      }
                    />
                  ) : null}
                  <span className="font-mono-display text-muted-foreground">#{r.rank}</span>
                </div>
              </td>
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 border border-border">
                    <AvatarImage src={r.avatar} alt={r.name} />
                    <AvatarFallback>{r.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-foreground">
                      {r.name}
                      {r.is_me && (
                        <span className="ml-2 text-[10px] uppercase font-mono-display tracking-widest text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-1.5 py-0.5 rounded">
                          you
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono-display">{r.leetcode_username}</div>
                  </div>
                </div>
              </td>
              <td className="px-5 py-4 hidden md:table-cell">
                <div className="text-foreground">{r.college || '-'}</div>
                <div className="text-xs text-muted-foreground">{r.department || '-'}</div>
              </td>
              <td className="px-5 py-4 text-right font-mono-display font-medium text-foreground">{r.total_solved}</td>
              <td className="px-5 py-4 text-right hidden sm:table-cell font-mono-display text-xs">
                <span className="text-emerald-600 dark:text-emerald-400">{r.easy}</span>
                <span className="text-muted-foreground mx-1">-</span>
                <span className="text-amber-600 dark:text-amber-400">{r.medium}</span>
                <span className="text-muted-foreground mx-1">-</span>
                <span className="text-rose-600 dark:text-rose-400">{r.hard}</span>
              </td>
              <td className="px-5 py-4 text-right font-mono-display text-foreground">
                {Math.round(r.contest_rating)}
              </td>
              <td className="px-5 py-4 text-right font-mono-display font-semibold text-foreground">
                {Math.round(r.universal_score)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
