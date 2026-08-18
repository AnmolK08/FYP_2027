import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';

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

export default function RegisterForm() {
  const { signUp } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    college: '',
    department: '',
    leetcodeUsername: '',
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
        form.leetcodeUsername
      );
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Signup failed');
    }
    setLoading(false);
  };

  return (
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
        id="leetcodeUsername"
        label="LeetCode Handle (optional)"
        testid="signup-leetcode"
        mono
        value={form.leetcodeUsername}
        onChange={update('leetcodeUsername')}
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
  );
}
