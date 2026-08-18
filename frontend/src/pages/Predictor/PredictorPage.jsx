import { useState } from 'react';
import ProtectedRoute from '@/routes/ProtectedRoute';
import { usePredictContest } from '../../features/predictor/hooks/usePredictor';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function PredictorPage() {
  const [rating, setRating] = useState(1500);
  const [rank, setRank] = useState(5000);
  const [parts, setParts] = useState(20000);
  const [res, setRes] = useState(null);
  
  const predictContest = usePredictContest();
  
  const predict = async () => {
    try { 
      const result = await predictContest.mutateAsync({
        currentRating: Number(rating), 
        predictedRank: Number(rank), 
        participants: Number(parts)
      }); 
      setRes(result); 
    } catch {}
  };
  return (
    <ProtectedRoute>
      <main className="max-w-7xl mx-auto px-6 md:px-12 py-10">
        <p className="text-overline">M9 · contest predictor</p>
        <h1 className="font-heading text-3xl lg:text-5xl tracking-tight mt-2">Project your rating delta.</h1>
        <p className="text-muted-foreground mt-2 text-sm">Elo-based projection for LeetCode-style contests.</p>
        <div className="mt-8 grid lg:grid-cols-2 gap-6">
          <div className="ps-card space-y-4">
            {[['Current rating',rating,setRating],['Predicted rank',rank,setRank],['Participants',parts,setParts]].map(([l,v,s],i) => (
              <div key={i}><label className="text-overline">{l}</label>
                <input type="number" value={v} onChange={e=>s(e.target.value)} className="input-field mt-1.5" data-testid={`pred-${i}`}/></div>
            ))}
            <button onClick={predict} disabled={predictContest.isPending} className="btn-primary w-full" data-testid="predict-btn">
              {predictContest.isPending ? 'Predicting...' : 'Predict'}
            </button>
          </div>
          <div className="ps-card" data-testid="predict-result">
            {!res ? <div className="text-muted-foreground text-sm">Fill the form and click Predict.</div> :
              <><p className="text-overline">projection</p>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div><p className="text-overline">delta</p><div className={`font-heading text-4xl mt-1 ${res.delta>0?'text-emerald-600':'text-rose-600'}`}>{res.delta>0?'+':''}{res.delta}{res.delta>0?<TrendingUp size={18} className="inline ml-1"/>:<TrendingDown size={18} className="inline ml-1"/>}</div></div>
                <div><p className="text-overline">new rating</p><div className="font-heading text-4xl mt-1">{res.new_rating}</div></div>
                <div><p className="text-overline">percentile</p><div className="font-heading text-2xl mt-1 font-mono-display">{res.percentile}%</div></div>
                <div><p className="text-overline">performance</p><div className="font-heading text-2xl mt-1 font-mono-display">{res.performance}</div></div>
              </div></>
            }
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
