import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, Trophy, Brain, Code2, Check, BookOpen, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const FEATURES = [
  { icon: BarChart3, title: 'Unified Analytics', desc: 'All your LeetCode stats — solved counts, contest ratings, difficulty mix, streaks — in one focused view.' },
  { icon: Trophy, title: 'College Leaderboard', desc: 'Compete with peers from your college and department. Climb a normalized universal score.' },
  { icon: Brain, title: 'AI Mentor', desc: 'A persistent assistant that learns from your submission history and proposes a focus plan.', badge: 'new' },
  { icon: Code2, title: 'Mock Interviews', desc: 'Monaco-based editor with timed rounds, post-session feedback, and a portable score report.', badge: 'new' },
  { icon: BookOpen, title: 'Knowledge Base', desc: 'Upload your notes, PDFs, docs. Ask questions and get cited answers from your material.', badge: 'new' },
  { icon: Target, title: 'Streak Engine', desc: 'Track daily consistency with a visual heatmap. Build momentum, stay accountable.', badge: 'new' },
];

const STEPS = [
  { n: '01', title: 'Create your profile', desc: 'Sign up with your college, department, and LeetCode handle.' },
  { n: '02', title: 'Sync your progress', desc: 'We aggregate your public LeetCode data into one calm dashboard.' },
  { n: '03', title: 'Compete & improve', desc: 'Track your weekly delta, climb the leaderboard, and earn badges.' },
];

const NUMBERS = [
  { k: '1,500+', l: 'Problems analyzed per student' },
  { k: '30-day', l: 'Activity heatmap' },
  { k: '12+', l: 'Achievement badges' },
  { k: '1 click', l: 'LeetCode sync' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-50 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 md:px-12 pt-16 md:pt-24 pb-20 md:pb-28 relative">
          <div className="grid lg:grid-cols-12 gap-10 items-end">
            <div className="lg:col-span-7 fade-up">
              <div className="text-overline mb-5">For engineering students · v1.0 beta</div>
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl tracking-tight text-foreground leading-[1.05]">
                One workspace for every<br className="hidden md:block" />
                placement preparation goal.
              </h1>
              <p className="mt-6 max-w-xl text-muted-foreground text-lg leading-relaxed">
                PrepSphere unifies your LeetCode analytics, college leaderboards, AI mentorship, and interview practice — so you stop juggling tabs and start making real progress.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/signup">
                  <Button size="lg" className="bg-primary text-primary-foreground rounded-md px-6 h-12">
                    Start preparing <ArrowRight size={16} strokeWidth={1.75} />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="rounded-md h-12">
                    I already have an account
                  </Button>
                </Link>
              </div>
              <div className="mt-8 flex items-center gap-5 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Check size={14} className="text-emerald-500" /> No credit card</span>
                <span className="inline-flex items-center gap-1"><Check size={14} className="text-emerald-500" /> Free for students</span>
                <span className="inline-flex items-center gap-1"><Check size={14} className="text-emerald-500" /> Real LeetCode data</span>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden fade-up" style={{ animationDelay: '120ms' }}>
                <div className="border-b border-border px-5 py-3 flex items-center justify-between">
                  <div className="text-overline">prepsphere.dashboard</div>
                  <div className="flex gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                  </div>
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <div className="text-overline">total solved</div>
                    <div className="font-heading text-4xl text-foreground mt-1">847</div>
                    <div className="text-xs text-muted-foreground mt-1">+12 this week</div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-md border border-border p-3">
                      <div className="text-[10px] text-muted-foreground font-mono-display uppercase">Easy</div>
                      <div className="text-lg font-semibold text-emerald-500">412</div>
                    </div>
                    <div className="rounded-md border border-border p-3">
                      <div className="text-[10px] text-muted-foreground font-mono-display uppercase">Med</div>
                      <div className="text-lg font-semibold text-amber-500">358</div>
                    </div>
                    <div className="rounded-md border border-border p-3">
                      <div className="text-[10px] text-muted-foreground font-mono-display uppercase">Hard</div>
                      <div className="text-lg font-semibold text-rose-500">77</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-overline mb-2">last 30 days</div>
                    <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(15, minmax(0,1fr))' }}>
                      {Array.from({ length: 30 }).map((_, i) => {
                        const lvl = [0, 1, 2, 3, 4][Math.floor(Math.random() * 5)];
                        return <div key={i} className={`heat-cell ${lvl ? 'heat-' + lvl : ''}`} />;
                      })}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div className="text-overline">rating</div>
                    <div className="font-mono-display text-foreground">1,894</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS STRIP */}
      <section className="border-y border-border bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {NUMBERS.map((n) => (
            <div key={n.l}>
              <div className="font-heading text-3xl text-foreground">{n.k}</div>
              <div className="text-overline mt-1">{n.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="max-w-7xl mx-auto px-6 md:px-12 py-20 md:py-28">
        <div className="max-w-2xl">
          <div className="text-overline">Capabilities</div>
          <h2 className="font-heading text-3xl lg:text-4xl tracking-tight mt-3 text-foreground">
            Built for the way you actually prepare.
          </h2>
          <p className="text-muted-foreground mt-4">
            Stop switching between five tabs. PrepSphere brings the workflow under one roof — calm, structured, and focused on outcomes.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-12">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-card border border-border rounded-md p-7 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="flex items-start gap-4">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground shrink-0">
                  <f.icon size={18} strokeWidth={1.5} />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading text-xl text-foreground">{f.title}</h3>
                    {f.badge && (
                      <span className="text-[10px] font-mono-display uppercase tracking-widest bg-success/20 text-success px-2 py-0.5 rounded">
                        {f.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-2 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="bg-muted/30 border-y border-border">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-20 md:py-28">
          <div className="grid lg:grid-cols-3 gap-12">
            <div>
              <div className="text-overline">Workflow</div>
              <h2 className="font-heading text-3xl lg:text-4xl tracking-tight mt-3 text-foreground">
                Three steps. Zero friction.
              </h2>
              <p className="text-muted-foreground mt-4">
                From signup to your first synced dashboard in under sixty seconds.
              </p>
            </div>
            <div className="lg:col-span-2 grid sm:grid-cols-3 gap-5">
              {STEPS.map((s) => (
                <div key={s.n} className="bg-card border border-border rounded-md p-6">
                  <div className="font-mono-display text-muted-foreground">{s.n}</div>
                  <h3 className="font-heading text-lg text-foreground mt-3">{s.title}</h3>
                  <p className="text-muted-foreground text-sm mt-2 leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-20 md:py-24 grid md:grid-cols-2 gap-8 items-center">
          <h2 className="font-heading text-3xl lg:text-5xl tracking-tight">
            Ready to stop juggling tabs?
          </h2>
          <div className="md:text-right">
            <p className="text-primary-foreground/70 mb-6">
              Join the beta and bring your placement prep into one calm workspace.
            </p>
            <Link to="/signup">
              <Button size="lg" className="bg-background text-foreground hover:bg-background/90 rounded-md px-7 h-12">
                Create your account <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
