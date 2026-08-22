import { useState } from 'react';
import ProtectedRoute from '@/routes/ProtectedRoute';
import { useLeaderboard, useMyLeaderboardRank } from '../../features/leaderboard/hooks/useLeaderboard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LeaderboardTable from '../../features/leaderboard/components/LeaderboardTable';

export default function LeaderboardPage() {
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading: loading } = useLeaderboard(page, limit);
  const { data: myRank } = useMyLeaderboardRank();

  const rows = data?.users || [];
  const totalPages = data?.totalPages || 1;
  const totalUsers = data?.total || 0;

  // Only show podium on the first page
  const podium = page === 1 ? rows.slice(0, 3) : [];

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 md:py-14">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div>
              <div className="text-overline">Compete</div>
              <h1 className="font-heading text-3xl lg:text-5xl tracking-tight text-foreground mt-2">
                Leaderboard
              </h1>
              <p className="text-muted-foreground mt-2 text-sm">
                Universal Score = Easy x 1 + Medium x 3 + Hard x 6 + Contest Rating x 0.5
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-overline">{totalUsers} students</span>
              {myRank && (
                <div className="text-sm font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-800">
                  My Rank: #{myRank.rank}
                </div>
              )}
            </div>
          </div>

          {podium.length === 3 && (
            <section className="mt-8 grid grid-cols-3 gap-4" data-testid="podium">
              <PodiumCard row={podium[1]} place={2} />
              <PodiumCard row={podium[0]} place={1} featured />
              <PodiumCard row={podium[2]} place={3} />
            </section>
          )}

          <section className="mt-6 bg-card border border-border rounded-md overflow-hidden">
            <LeaderboardTable rows={rows} loading={loading} />
            
            {/* Pagination Controls */}
            {!loading && totalPages > 1 && (
              <div className="p-4 border-t border-border flex items-center justify-between">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft size={16} className="mr-1" /> Previous
                </Button>
                <div className="text-sm text-muted-foreground font-mono-display">
                  Page {page} of {totalPages}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>
            )}
          </section>
        </div>
      </main>
    </ProtectedRoute>
  );
}

function PodiumCard({ row, place, featured }) {
  if (!row) return <div />;
  const tone =
    place === 1
      ? 'border-amber-300 bg-amber-50/40 dark:border-amber-700 dark:bg-amber-900/20'
      : place === 2
      ? 'border-slate-300 bg-slate-50/60 dark:border-slate-600 dark:bg-slate-800/20'
      : 'border-amber-200 bg-amber-50/30 dark:border-amber-800 dark:bg-amber-900/10';
  return (
    <div
      className={`border ${tone} rounded-md p-5 flex flex-col items-center text-center ${featured ? 'md:scale-[1.04]' : 'opacity-95'}`}
      data-testid={`podium-${place}`}
    >
      <div className="flex items-center gap-1 text-overline">
        {place === 1 && <Trophy size={14} className="text-amber-500" />} #{place}
      </div>
      <Avatar className="h-14 w-14 border border-border mt-3">
        <AvatarImage src={row.avatar} alt={row.name} />
        <AvatarFallback>{row.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="font-heading text-foreground mt-2">{row.name}</div>
      <div className="text-xs text-muted-foreground font-mono-display">{row.leetcodeUsername || '-'}</div>
      <div className="text-xs text-muted-foreground mt-1">{row.college}</div>
      <div className="mt-3 font-heading text-2xl text-foreground">{Math.round(row.universalScore || 0)}</div>
      <div className="text-xs text-muted-foreground font-mono-display mt-1">
        Rating {Math.round(row.contestRating || 0)}
      </div>
    </div>
  );
}
