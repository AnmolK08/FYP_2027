import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Settings2 } from 'lucide-react';
import { useUpdateProfile } from '../hooks/useUserStats';

export default function ProfileEditor({ profile, onSaved }) {
  const [open, setOpen] = useState(false);
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
      setOpen(false);
      onSaved?.();
    } catch (e) {
      toast.error('Update failed');
    } finally {
      setSaving(false);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" data-testid="open-profile-editor">
          <Settings2 size={15} strokeWidth={1.5} /> Edit profile
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card" data-testid="profile-editor-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading">Edit profile</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Update your details - changes are visible on the leaderboard.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <Field label="Name" v={form.name} onChange={set('name')} tid="edit-name" />
          <Field label="College" v={form.college} onChange={set('college')} tid="edit-college" />
          <Field label="Department" v={form.department} onChange={set('department')} tid="edit-department" />
          <Field label="LeetCode Handle" v={form.leetcodeUsername} onChange={set('leetcodeUsername')} mono tid="edit-leetcode" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving} data-testid="save-profile" className="bg-primary text-primary-foreground">
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
