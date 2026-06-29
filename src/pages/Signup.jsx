import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { Sparkles, ArrowLeft } from 'lucide-react';

export default function Signup() {
  const { signUp } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    college: '',
    department: '',
    leetcode_username: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signUp(
        form.email,
        form.password,
        form.name,
        form.college,
        form.department,
        form.leetcode_username
      );
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Signup failed');
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
          <h1 className="font-heading text-4xl tracking-tight">Begin your sphere.</h1>
          <p className="text-primary-foreground/70 mt-3 max-w-sm">
            A calm, focused workspace built for engineering students - one signup away.
          </p>
          <ul className="mt-8 space-y-3 text-primary-foreground/70 text-sm">
            <li>- Sync your LeetCode profile in one click</li>
            <li>- Track your college and department rank</li>
            <li>- Earn badges based on real activity</li>
          </ul>
        </div>
        <div className="relative text-overline text-primary-foreground/50">v1.0 beta</div>
      </div>

      <div className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-6 flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Sparkles size={16} strokeWidth={1.75} />
            </span>
            <span className="font-heading text-lg">PrepSphere</span>
          </div>
          <h2 className="font-heading text-3xl text-foreground">Create your account</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Tell us a bit about you. You can edit any of this later.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4" data-testid="signup-form">
            <FormField
              id="name"
              label="Full Name"
              testid="signup-name"
              required
              value={form.name}
              onChange={update('name')}
              placeholder="Aarav Mehta"
            />
            <FormField
              id="email"
              label="Email"
              testid="signup-email"
              required
              type="email"
              value={form.email}
              onChange={update('email')}
              placeholder="you@college.edu"
            />
            <FormField
              id="password"
              label="Password"
              testid="signup-password"
              required
              type="password"
              value={form.password}
              onChange={update('password')}
              placeholder="min. 6 characters"
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                id="college"
                label="College"
                testid="signup-college"
                value={form.college}
                onChange={update('college')}
                placeholder="IIT Bombay"
              />
              <FormField
                id="department"
                label="Department"
                testid="signup-department"
                value={form.department}
                onChange={update('department')}
                placeholder="Computer Science"
              />
            </div>
            <FormField
              id="leetcode_username"
              label="LeetCode Handle (optional)"
              testid="signup-leetcode"
              mono
              value={form.leetcode_username}
              onChange={update('leetcode_username')}
              placeholder="e.g. neetCode"
            />

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2" data-testid="signup-error">
                {error}
              </div>
            )}
            <Button
              type="submit"
              disabled={loading}
              data-testid="signup-submit"
              className="w-full h-11 bg-primary text-primary-foreground"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>

          <div className="mt-6 text-sm text-muted-foreground">
            Already with us?{' '}
            <Link to="/login" data-testid="goto-login" className="text-foreground font-medium underline-offset-4 hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormField({ id, label, testid, type = 'text', value, onChange, placeholder, required, mono }) {
  return (
    <div>
      <Label htmlFor={id} className="text-muted-foreground text-xs font-mono-display uppercase tracking-widest">
        {label}
      </Label>
      <Input
        id={id}
        data-testid={testid}
        type={type}
        required={required}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`mt-1.5 h-11 ${mono ? 'font-mono-display' : ''}`}
      />
    </div>
  );
}
