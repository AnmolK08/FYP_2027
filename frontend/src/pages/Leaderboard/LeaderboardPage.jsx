import { useMemo, useState } from 'react';
import ProtectedRoute from '@/routes/ProtectedRoute';
import { useLeaderboard } from '../../features/leaderboard/hooks/useLeaderboard';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Search, ArrowUpDown } from 'lucide-react';
import LeaderboardTable from '../../features/leaderboard/components/LeaderboardTable';

const SCOPE_OPTIONS = [
  { v: 'global', label: 'Global' },
  { v: 'college', label: 'My College' },
  { v: 'department', label: 'My Dept' },
];

const SORT_OPTIONS = [
  { v: 'universal_score', label: 'Universal Score' },
  { v: 'total_solved', label: 'Total Solved' },
  { v: 'contest_rating', label: 'Contest Rating' },
  { v: 'hard', label: 'Hard Solved' },
];

export default function LeaderboardPage() {
  const [scope, setScope] = useState('global');
  const [sort, setSort] = useState('universal_score');
  const [search, setSearch] = useState('');

  const { data: rows = [], isLoading: loading } = useLeaderboard(scope);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.leetcode_username?.toLowerCase().includes(q) ||
        r.college?.toLowerCase().includes(q) ||
        r.department?.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const sortedFiltered = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => (b[sort] || 0) - (a[sort] || 0));
    sorted.forEach((r, i) => { r.rank = i + 1; });
    return sorted;
  }, [filtered, sort]);

  const podium = sortedFiltered.slice(0, 3);

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
            <div className="flex items-center gap-3">
              <span className="text-overline">{rows.length} students</span>
            </div>
          </div>

          <div className="mt-8 bg-card border border-border rounded-md p-4 flex flex-col lg:flex-row lg:items-center gap-3">
            <Tabs value={scope} onValueChange={(v) => setScope(v)} className="w-full lg:w-auto">
              <TabsList className="bg-muted">
                {SCOPE_OPTIONS.map((o) => (
                  <TabsTrigger
                    key={o.v}
                    value={o.v}
                    data-testid={`scope-${o.v}`}
                    className="data-[state=active]:bg-background data-[state=active]:text-foreground"
                  >
                    {o.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="flex-1 relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, handle, or college..."
                data-testid="leaderboard-search"
                className="pl-9 h-10"
              />
            </div>

            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-[200px] h-10" data-testid="leaderboard-sort">
                <ArrowUpDown size={14} className="text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((o) => (
                  <SelectItem key={o.v} value={o.v}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {podium.length === 3 && (
            <section className="mt-8 grid grid-cols-3 gap-4" data-testid="podium">
              <PodiumCard row={podium[1]} place={2} />
              <PodiumCard row={podium[0]} place={1} featured />
              <PodiumCard row={podium[2]} place={3} />
            </section>
          )}

          <section className="mt-6 bg-card border border-border rounded-md overflow-hidden">
            <LeaderboardTable sortedFiltered={sortedFiltered} loading={loading} />
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
      <div className="text-xs text-muted-foreground font-mono-display">{row.leetcode_username}</div>
      <div className="text-xs text-muted-foreground mt-1">{row.college}</div>
      <div className="mt-3 font-heading text-2xl text-foreground">{Math.round(row.universal_score)}</div>
      <div className="text-overline">score</div>
    </div>
  );
}
