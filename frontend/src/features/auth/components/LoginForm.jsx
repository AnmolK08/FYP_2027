import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '../hooks/useAuth';

export default function LoginForm() {
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
  );
}
