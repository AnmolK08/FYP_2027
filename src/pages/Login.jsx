import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { Sparkles, ArrowLeft } from 'lucide-react';

export default function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signIn(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-primary text-primary-foreground p-12 relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-10" />
        <Link to="/" className="relative inline-flex items-center gap-2 text-sm text-primary-foreground/70 hover:text-primary-foreground">
          <ArrowLeft size={16} /> back to home
        </Link>
        <div className="relative">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-background text-foreground mb-6">
            <Sparkles size={18} strokeWidth={1.75} />
          </div>
          <h1 className="font-heading text-4xl tracking-tight">Welcome back.</h1>
          <p className="text-primary-foreground/70 mt-3 max-w-sm">
            Sign in to sync your LeetCode progress and pick up exactly where you left off.
          </p>
        </div>
        <div className="relative text-overline text-primary-foreground/50">PrepSphere for engineering students</div>
      </div>

      <div className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-6 flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Sparkles size={16} strokeWidth={1.75} />
            </span>
            <span className="font-heading text-lg">PrepSphere</span>
          </div>
          <h2 className="font-heading text-3xl text-foreground">Sign in</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Enter your email and password to continue.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4" data-testid="login-form">
            <div>
              <Label htmlFor="email" className="text-muted-foreground text-xs font-mono-display uppercase tracking-widest">
                Email
              </Label>
              <Input
                id="email"
                data-testid="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 h-11"
                placeholder="you@college.edu"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-muted-foreground text-xs font-mono-display uppercase tracking-widest">
                Password
              </Label>
              <Input
                id="password"
                data-testid="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 h-11"
                placeholder="..."
              />
            </div>
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2" data-testid="login-error">
                {error}
              </div>
            )}
            <Button
              type="submit"
              disabled={loading}
              data-testid="login-submit"
              className="w-full h-11 bg-primary text-primary-foreground"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-6 text-sm text-muted-foreground">
            New to PrepSphere?{' '}
            <Link to="/signup" data-testid="goto-signup" className="text-foreground font-medium underline-offset-4 hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
