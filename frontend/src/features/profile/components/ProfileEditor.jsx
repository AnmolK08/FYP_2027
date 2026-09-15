import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Check, AlertCircle } from 'lucide-react';
import { useUpdateProfile, useUpdateLucyUsername } from '../hooks/useUserStats';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

export default function ProfileEditor({ profile, onSaved, open, onOpenChange }) {
  const [form, setForm] = useState({
    name: profile?.name || '',
    college: profile?.college || '',
    department: profile?.department || '',
    leetcodeUsername: profile?.leetcodeUsername || '',
    lucyUsername: profile?.lucyUsername || '',
  });
  const [usernameError, setUsernameError] = useState('');
  const [saving, setSaving] = useState(false);

  const updateProfileMutation = useUpdateProfile();
  const updateLucyUsernameMutation = useUpdateLucyUsername();

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        college: profile.college || '',
        department: profile.department || '',
        leetcodeUsername: profile.leetcodeUsername || '',
        lucyUsername: profile.lucyUsername || '',
      });
      setUsernameError('');
    }
  }, [profile]);

  const handleUsernameChange = (e) => {
    const val = e.target.value.toLowerCase().replace(/\s+/g, '');
    setForm((prev) => ({ ...prev, lucyUsername: val }));
    setUsernameError('');

    if (val && !USERNAME_REGEX.test(val)) {
      if (val.length < 3) {
        setUsernameError('Username must be at least 3 characters');
      } else if (val.length > 20) {
        setUsernameError('Username must be at most 20 characters');
      } else {
        setUsernameError('Only lowercase letters (a-z), numbers (0-9), and underscores (_) allowed');
      }
    }
  };

  const save = async () => {
    // Validate lucyUsername if changed
    const usernameChanged = form.lucyUsername !== (profile?.lucyUsername || '');
    if (usernameChanged) {
      if (!USERNAME_REGEX.test(form.lucyUsername)) {
        setUsernameError('Username must be 3-20 lowercase alphanumeric characters or underscores');
        return;
      }
    }

    setSaving(true);
    setUsernameError('');

    try {
      // 1. If lucyUsername changed, update via dedicated authenticated API
      if (usernameChanged) {
        await updateLucyUsernameMutation.mutateAsync(form.lucyUsername);
      }

      // 2. Update general profile info (name, college, dept, leetcodeUsername)
      await updateProfileMutation.mutateAsync({
        name: form.name,
        college: form.college,
        department: form.department,
        leetcodeUsername: form.leetcodeUsername,
      });

      onOpenChange(false);
      onSaved?.();
    } catch (e) {
      const msg = e.message || 'Update failed';
      if (e.status === 409 || msg.toLowerCase().includes('already taken') || msg.toLowerCase().includes('conflict')) {
        setUsernameError(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  if (!open) return null;

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999 }}
      data-testid="profile-editor-dialog"
    >
      {/* Backdrop */}
      <div
        style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)' }}
        onClick={() => onOpenChange(false)}
      />
      {/* Dialog */}
      <div
        style={{
          position: 'fixed',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10000,
          width: '100%',
          maxWidth: '28rem',
        }}
        className="border border-border bg-card rounded-lg p-6 shadow-2xl"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 text-muted-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="mb-4">
          <h2 className="font-heading text-lg text-foreground">Edit profile</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Update your details - changes are visible on the leaderboard.
          </p>
        </div>

        {/* Fields */}
        <div className="grid gap-3">
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-muted-foreground text-xs font-mono-display uppercase tracking-widest">
                Lucy Username
              </Label>
              <span className="text-[11px] text-muted-foreground font-mono-display">
                /u/{form.lucyUsername || '...'}
              </span>
            </div>
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono-display text-sm select-none">
                @
              </span>
              <Input
                value={form.lucyUsername}
                onChange={handleUsernameChange}
                data-testid="edit-lucy-username"
                className={`pl-8 h-10 font-mono-display ${usernameError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                placeholder="username"
              />
            </div>
            {usernameError ? (
              <p className="text-xs text-destructive mt-1 font-medium flex items-center gap-1">
                <AlertCircle size={12} /> {usernameError}
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground mt-1">
                3–20 lowercase letters, numbers, or underscores. Sets your public profile URL.
              </p>
            )}
          </div>
          <Field label="Name" v={form.name} onChange={set('name')} tid="edit-name" />
          <Field label="College" v={form.college} onChange={set('college')} tid="edit-college" />
          <Field label="Department" v={form.department} onChange={set('department')} tid="edit-department" />
          <Field label="LeetCode Handle" v={form.leetcodeUsername} onChange={set('leetcodeUsername')} mono tid="edit-leetcode" />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 mt-5">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving} data-testid="save-profile" className="bg-primary text-primary-foreground">
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function Field({ label, v, onChange, mono, tid }) {
  return (
    <div>
      <Label className="text-muted-foreground text-xs font-mono-display uppercase tracking-widest">{label}</Label>
      <Input
        value={v}
        onChange={onChange}
        data-testid={tid}
        className={`mt-1.5 h-10 ${mono ? 'font-mono-display' : ''}`}
      />
    </div>
  );
}
