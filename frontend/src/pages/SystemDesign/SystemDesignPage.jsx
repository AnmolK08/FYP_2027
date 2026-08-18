import ProtectedRoute from '@/routes/ProtectedRoute';
import { useSdTopics } from '../../features/system-design/hooks/useSystemDesign';

export default function SystemDesignPage() {
  const { data: topics = [] } = useSdTopics();
  
  return (
    <ProtectedRoute>
      <main className="max-w-7xl mx-auto px-6 md:px-12 py-10">
        <p className="text-overline">M7 · system design</p>
        <h1 className="font-heading text-3xl lg:text-5xl tracking-tight mt-2">Curated HLD & LLD topics.</h1>
        <p className="text-muted-foreground mt-2 text-sm">Start easy. Work your way to the classics asked at FAANG.</p>
        <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topics.map(t => (
            <div key={t.id} className="ps-card hover:shadow-md transition" data-testid={`sd-${t.id}`}>
              <div className="flex justify-between items-start"><div className="font-heading text-lg">{t.title}</div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${t.level==='easy'?'bg-emerald-100 text-emerald-700':t.level==='medium'?'bg-amber-100 text-amber-700':'bg-rose-100 text-rose-700'}`}>{t.level}</span></div>
              <div className="flex flex-wrap gap-1 mt-3">{t.tags.map(tg => <span key={tg} className="text-[10px] font-mono-display bg-muted px-1.5 py-0.5 rounded">{tg}</span>)}</div>
            </div>
          ))}
        </div>
      </main>
    </ProtectedRoute>
  );
}
