import { useEffect, useState } from 'react';
import api from '../lib/api';
import ProtectedRoute from '../components/ProtectedRoute';
import { ExternalLink, Search } from 'lucide-react';

const DIFFS = ['','Easy','Medium','Hard'];
const TAGS = ['','Array','String','Hash Table','Dynamic Programming','Graph','Tree','Stack','Heap','Binary Search','Two Pointers'];

export default function Problems() {
  const [data, setData] = useState({ problems: [], total: 0 });
  const [diff, setDiff] = useState(''); const [tag, setTag] = useState(''); const [q, setQ] = useState('');
  useEffect(() => { (async () => {
    const data = await api.getProblems(diff, tag, q); setData(data);
  })(); }, [diff, tag, q]);
  return (
    <ProtectedRoute>
      <main className="max-w-7xl mx-auto px-6 md:px-12 py-10">
        <p className="text-overline">M4 · DSA bank</p>
        <h1 className="font-heading text-3xl lg:text-5xl tracking-tight mt-2">Curated problems. Filter and grind.</h1>
        <div className="ps-card mt-8 flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search problems…" className="input-field pl-9" data-testid="problems-search"/></div>
          <select value={diff} onChange={e=>setDiff(e.target.value)} className="input-field md:w-40" data-testid="problems-diff">{DIFFS.map(d => <option key={d} value={d}>{d||'All difficulty'}</option>)}</select>
          <select value={tag} onChange={e=>setTag(e.target.value)} className="input-field md:w-48" data-testid="problems-tag">{TAGS.map(t => <option key={t} value={t}>{t||'All tags'}</option>)}</select>
        </div>
        <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.problems.map(p => (
            <a key={p.id} href={p.url} target="_blank" rel="noreferrer" data-testid={`problem-${p.id}`} className="ps-card hover:shadow-md transition">
              <div className="flex justify-between items-start"><div className="font-heading text-lg">{p.title}</div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${p.difficulty==='Easy'?'bg-emerald-100 text-emerald-700':p.difficulty==='Medium'?'bg-amber-100 text-amber-700':'bg-rose-100 text-rose-700'}`}>{p.difficulty}</span></div>
              <div className="flex flex-wrap gap-1 mt-3">{p.tags.map(t => <span key={t} className="text-[10px] font-mono-display bg-muted px-1.5 py-0.5 rounded">{t}</span>)}</div>
              <div className="mt-4 text-sm text-muted-foreground inline-flex items-center gap-1"><ExternalLink size={12}/> Solve on LeetCode</div>
            </a>
          ))}
        </div>
        <div className="mt-4 text-xs text-muted-foreground font-mono-display">{data.total} problems</div>
      </main>
    </ProtectedRoute>
  );
}
