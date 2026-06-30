import { useEffect, useState } from 'react';
import api from '../lib/api';
import ProtectedRoute from '../components/ProtectedRoute';
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';

export default function FlashCards() {
  const [cards, setCards] = useState([]);
  const [i, setI] = useState(0); const [show, setShow] = useState(false);
  useEffect(() => { api.getFlashcards().then(r => setCards(r.cards)).catch(()=>{}); }, []);
  if (!cards.length) return <ProtectedRoute><div className="max-w-7xl mx-auto px-6 py-16 text-muted-foreground">Loading…</div></ProtectedRoute>;
  const c = cards[i];
  return (
    <ProtectedRoute>
      <main className="max-w-3xl mx-auto px-6 md:px-12 py-10">
        <p className="text-overline">M11 · revision flashcards</p>
        <h1 className="font-heading text-3xl lg:text-5xl tracking-tight mt-2">Drill the fundamentals.</h1>
        <p className="text-muted-foreground mt-2 text-sm">Tap to reveal answer. Loop daily for retention.</p>
        <div className="mt-8 ps-card min-h-[300px] flex flex-col" data-testid="flashcard">
          <div className="text-overline">Card {i+1} / {cards.length}</div>
          <div className="flex-1 grid place-items-center text-center my-8">
            {!show ? <div><div className="font-heading text-2xl">{c.q}</div>
              <button onClick={()=>setShow(true)} className="btn-ghost mt-6" data-testid="reveal-btn"><Eye size={14}/> Reveal answer</button></div> :
              <div><div className="text-overline mb-3">answer</div><div className="text-lg leading-relaxed">{c.a}</div></div>}
          </div>
          <div className="flex justify-between mt-4">
            <button onClick={()=>{setI((i-1+cards.length)%cards.length); setShow(false);}} className="btn-ghost" data-testid="prev-card"><ChevronLeft size={14}/> Prev</button>
            <button onClick={()=>{setI((i+1)%cards.length); setShow(false);}} className="btn-primary" data-testid="next-card">Next <ChevronRight size={14}/></button>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
