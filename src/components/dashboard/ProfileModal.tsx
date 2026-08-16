import { useEffect, useState } from 'react';
import { CheckCircle2, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useMembers } from '@/hooks/api/useMembers';
import type { User } from '@/contexts/AuthContext';

interface ProfileModalProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProfileModal = ({ user, open, onOpenChange }: ProfileModalProps) => {
  const { useUpdateProfile } = useMembers();
  const updateProfile = useUpdateProfile();
  const [fullName, setFullName] = useState(user.fullName || '');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (!open) return;
    setFullName(user.fullName || '');
    setPhone(user.phone || '');
  }, [open, user.fullName, user.phone]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateProfile.mutate(
      { fullName, phone },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-[1000] max-h-[90vh] max-w-lg overflow-y-auto border-border bg-card p-0">
        <div className="border-b border-border bg-gradient-to-br from-primary/15 via-primary/5 to-transparent px-6 pb-6 pt-7">
          <DialogHeader>
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <UserRound className="h-7 w-7" />
            </div>
            <DialogTitle className="text-xl font-bold text-foreground">Profile & settings</DialogTitle>
            <DialogDescription className="text-sm leading-6 text-muted-foreground">Keep your member profile current so class bookings and gym updates reach you correctly.</DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <section className="space-y-4">
            <div className="flex items-center gap-2"><UserRound className="h-4 w-4 text-primary" /><h3 className="text-sm font-semibold text-foreground">Personal information</h3></div>
            <label className="block space-y-1.5"><span className="text-xs font-semibold text-muted-foreground">Full name</span><input required minLength={2} value={fullName} onChange={(event) => setFullName(event.target.value)} className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/60" /></label>
            <label className="block space-y-1.5"><span className="text-xs font-semibold text-muted-foreground">Email address</span><div className="relative"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={user.email} readOnly className="w-full cursor-not-allowed rounded-xl border border-border bg-muted/40 py-3 pl-10 pr-4 text-sm text-muted-foreground outline-none" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Auth managed</span></div></label>
            <label className="block space-y-1.5"><span className="text-xs font-semibold text-muted-foreground">Phone number <span className="font-normal">(optional)</span></span><input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+254 700 000 000" className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary/60" /></label>
          </section>

          <section className="space-y-3 rounded-2xl border border-border bg-background/50 p-4">
            <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /><h3 className="text-sm font-semibold text-foreground">Account settings</h3></div>
            <div className="grid gap-3 sm:grid-cols-2"><div><p className="text-[11px] text-muted-foreground">Email verification</p><p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-foreground">{user.isEmailVerified ? <><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Verified</> : 'Pending verification'}</p></div><div><p className="text-[11px] text-muted-foreground">Membership</p><p className="mt-1 text-sm font-medium capitalize text-foreground">{user.plan} · {user.membershipStatus}</p></div></div>
            <p className="text-xs leading-5 text-muted-foreground">Your email, membership, and access role are protected account settings. Contact gym support if you need to change them.</p>
          </section>

          <div className="flex gap-3"><button type="button" onClick={() => onOpenChange(false)} className="flex-1 rounded-xl border border-border py-3 text-sm font-medium text-foreground transition hover:bg-accent">Cancel</button><button type="submit" disabled={updateProfile.isPending} className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">{updateProfile.isPending ? 'Saving…' : 'Save profile'}</button></div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;
