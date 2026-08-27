import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { useUpdateProfile } from '../hooks/useUserStats';
import { createPortal } from 'react-dom';

export default function ProfileEditor({ profile, onSaved, open, onOpenChange }) {
  const [form, setForm] = useState({
    name: profile?.name || '',
    college: profile?.college || '',
    department: profile?.department || '',
    leetcodeUsername: profile?.leetcodeUsername || '',
  });
  const [saving, setSaving] = useState(false);

  const updateProfileMutation = useUpdateProfile();

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        college: profile.college || '',
        department: profile.department || '',
        leetcodeUsername: profile.leetcodeUsername || '',
      });
    }
  }, [profile]);

  const save = async () => {
    setSaving(true);
    try {
      await updateProfileMutation.mutateAsync(form);
      toast.success('Profile updated');
      onOpenChange(false);
      onSaved?.();
    } catch (e) {
      toast.error('Update failed');
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
