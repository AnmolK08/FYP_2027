import { useState, useEffect } from 'react';
import ProtectedRoute from '@/routes/ProtectedRoute';
import { useTracks } from '../../features/tracks/hooks/useTracks';
import { Map, Check } from 'lucide-react';

export default function TracksPage() {
  const { data: tracks = [], isLoading } = useTracks();
  const [sel, setSel] = useState(null);
  
  useEffect(() => {
    if (tracks.length > 0 && !sel) {
      setSel(tracks[0]);
    }
  }, [tracks, sel]);
  
  if (isLoading || !sel) {
    return (
      <ProtectedRoute>
        <div className="max-w-7xl mx-auto px-6 py-16 text-muted-foreground">Loading…</div>
      </ProtectedRoute>
    );
  }
  
  return (
    <ProtectedRoute>
      <main className="max-w-7xl mx-auto px-6 md:px-12 py-10 grid lg:grid-cols-4 gap-6">
        <aside className="lg:col-span-1">
          <p className="text-overline">M12 · learning tracks</p>
          <h1 className="font-heading text-2xl mt-1">Roadmaps</h1>
          <div className="mt-6 space-y-2">{tracks.map(t => (
            <button key={t.id} onClick={()=>setSel(t)} data-testid={`track-${t.id}`} className={`w-full text-left p-3 rounded ${sel.id===t.id?'bg-primary text-primary-foreground':'hover:bg-muted'}`}>
              <div className="text-sm font-medium">{t.title}</div><div className="text-xs opacity-70 font-mono-display">{t.weeks} weeks · {t.modules.length} modules</div>
            </button>
          ))}</div>
        </aside>
        <section className="lg:col-span-3 ps-card" data-testid="track-detail">
          <div className="flex items-center gap-2"><Map size={18}/><div className="font-heading text-2xl">{sel.title}</div></div>
          <p className="text-muted-foreground mt-2">{sel.description}</p>
          <div className="mt-8 space-y-3">{sel.modules.map(m => (
            <div key={m.w} className="flex items-center gap-4 p-3 border border-border rounded">
              <div className="font-mono-display text-xs bg-muted px-2 py-1 rounded">Week {m.w}</div>
              <div className="flex-1 text-sm">{m.title}</div>
              <Check size={14} className="text-muted-foreground"/>
            </div>
          ))}</div>
        </section>
      </main>
    </ProtectedRoute>
  );
}
