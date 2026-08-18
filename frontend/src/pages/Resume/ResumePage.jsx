import { useState } from 'react';
import ProtectedRoute from '@/routes/ProtectedRoute';
import { useResumeRoles, useScoreResume } from '../../features/resume/hooks/useResume';
import { FileText, CheckCircle, AlertCircle } from 'lucide-react';

export default function ResumePage() {
  const [text, setText] = useState('');
  const [role, setRole] = useState('Software Engineer');
  const [result, setResult] = useState(null);
  
  const { data: roles = ['Software Engineer'] } = useResumeRoles();
  const scoreResume = useScoreResume();
  
  const score = async () => {
    try { 
      const res = await scoreResume.mutateAsync({ text, targetRole: role }); 
      setResult(res); 
    } catch (e) {}
  };
  
  return (
    <ProtectedRoute>
      <main className="max-w-7xl mx-auto px-6 md:px-12 py-10">
        <p className="text-overline">M6 · resume ATS</p>
        <h1 className="font-heading text-3xl lg:text-5xl tracking-tight mt-2">Beat the bot. Land the call.</h1>
        <p className="text-muted-foreground mt-2 text-sm max-w-xl">Paste your resume text. We score keyword coverage against the target role and surface gaps.</p>
        <div className="mt-8 grid lg:grid-cols-2 gap-6">
          <div className="ps-card">
            <div className="flex justify-between items-center"><p className="text-overline">resume text</p>
              <select value={role} onChange={e=>setRole(e.target.value)} className="input-field w-auto h-9" data-testid="resume-role">
                {roles.map(r => <option key={r}>{r}</option>)}
              </select></div>
            <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Paste your resume text here…" data-testid="resume-text" className="w-full h-[400px] mt-3 p-3 border border-border rounded font-mono text-xs bg-background resize-none focus:outline-none"/>
            <button onClick={score} disabled={!text.trim()||scoreResume.isPending} data-testid="resume-score" className="btn-primary mt-3"><FileText size={14}/>{scoreResume.isPending?'Scoring…':'Score my resume'}</button>
          </div>
          <div className="ps-card" data-testid="resume-result">
            {!result ? <div className="text-muted-foreground text-sm">Paste your resume and click Score to see ATS feedback.</div> :
             <><p className="text-overline">ats score</p>
              <div className="font-heading text-6xl mt-1" data-testid="ats-score">{result.score}<span className="text-2xl text-muted-foreground">/100</span></div>
              <div className="text-xs text-muted-foreground font-mono-display mt-1">{result.word_count} words · target: {result.role}</div>
              <div className="mt-6"><p className="text-overline">matched keywords ({result.matched.length})</p>
                <div className="flex flex-wrap gap-1.5 mt-2">{result.matched.map(k => <span key={k} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-mono-display"><CheckCircle size={10} className="inline mr-1"/>{k}</span>)}</div></div>
              <div className="mt-6"><p className="text-overline">missing keywords ({result.missing.length})</p>
                <div className="flex flex-wrap gap-1.5 mt-2">{result.missing.map(k => <span key={k} className="text-xs bg-rose-100 text-rose-700 px-2 py-1 rounded font-mono-display"><AlertCircle size={10} className="inline mr-1"/>{k}</span>)}</div></div>
              {result.issues.length>0 && <div className="mt-6"><p className="text-overline">issues</p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">{result.issues.map((i,k) => <li key={k}>· {i}</li>)}</ul></div>}
             </>}
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
