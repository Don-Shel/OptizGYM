import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Award,
  Edit3,
  Mail,
  Plus,
  Search,
  Trash2,
  Users,
  ChevronDown,
  ChevronUp,
  X,
  Loader2,
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import StatCard from '@/components/dashboard/StatCard';
import { useTrainers } from '@/hooks/api/useTrainers';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Trainer {
  id: string;
  fullName: string;
  email: string;
  specialty?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
}

type TrainerForm = {
  fullName: string;
  email: string;
  specialty: string;
  bio: string;
  avatarUrl: string;
};

const EMPTY_FORM: TrainerForm = {
  fullName: '',
  email: '',
  specialty: '',
  bio: '',
  avatarUrl: '',
};

const initials = (name: string) => name
  .split(' ')
  .filter(Boolean)
  .map((part) => part[0])
  .slice(0, 2)
  .join('')
  .toUpperCase() || 'TG';

const AdminTrainers = () => {
  const { useAllTrainers, useCreateTrainer, useUpdateTrainer, useDeleteTrainer } = useTrainers();
  const { data: trainers = [], isLoading, isError, refetch } = useAllTrainers();
  const createMutation = useCreateTrainer();
  const updateMutation = useUpdateTrainer();
  const deleteMutation = useDeleteTrainer();
  const [search, setSearch] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);
  const [form, setForm] = useState<TrainerForm>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredTrainers = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return (trainers as Trainer[]).filter((trainer) => !needle || [
      trainer.fullName,
      trainer.email,
      trainer.specialty,
      trainer.bio,
    ].filter(Boolean).join(' ').toLowerCase().includes(needle));
  }, [search, trainers]);

  const specialtyCount = useMemo(() => new Set(
    (trainers as Trainer[]).map((trainer) => trainer.specialty?.trim()).filter(Boolean),
  ).size, [trainers]);

  const openCreate = () => {
    setEditingTrainer(null);
    setForm(EMPTY_FORM);
    setEditorOpen(true);
  };

  const openEdit = (trainer: Trainer) => {
    setEditingTrainer(trainer);
    setForm({
      fullName: trainer.fullName || '',
      email: trainer.email || '',
      specialty: trainer.specialty || '',
      bio: trainer.bio || '',
      avatarUrl: trainer.avatarUrl || '',
    });
    setEditorOpen(true);
  };

  const closeEditor = () => {
    if (createMutation.isPending || updateMutation.isPending) return;
    setEditorOpen(false);
    setEditingTrainer(null);
    setForm(EMPTY_FORM);
  };

  const updateField = (field: keyof TrainerForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fullName = form.fullName.trim();
    const email = form.email.trim().toLowerCase();
    if (fullName.length < 2) {
      toast.error('Enter the trainer’s full name.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error('Enter a valid trainer email address.');
      return;
    }
    if (form.avatarUrl.trim()) {
      try {
        new URL(form.avatarUrl.trim());
      } catch {
        toast.error('Avatar URL must be a valid URL.');
        return;
      }
    }

    const payload = {
      fullName,
      email,
      specialty: form.specialty.trim(),
      bio: form.bio.trim(),
      avatarUrl: form.avatarUrl.trim(),
    };

    try {
      if (editingTrainer) {
        await updateMutation.mutateAsync({ id: editingTrainer.id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      closeEditor();
    } catch {
      // The mutation hook surfaces the API validation or server error via toast.
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      setDeleteId(null);
    } catch {
      // Keep the confirmation dialog open when the delete fails.
    }
  };

  return (
    <DashboardLayout title="Trainers" subtitle="Manage the coaching team shown across OptizGYM">
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Total Trainers" value={(trainers as Trainer[]).length} icon={Users} accent index={0} />
        <StatCard title="Specialties" value={specialtyCount} subtitle="Distinct coaching areas" icon={Award} index={1} />
        <StatCard title="Profile Ready" value={(trainers as Trainer[]).filter((trainer) => trainer.bio && trainer.specialty).length} subtitle="Bio and specialty added" icon={Award} index={2} />
        <StatCard title="Search Results" value={filteredTrainers.length} subtitle={search ? 'Matching current search' : 'All active trainers'} icon={Search} index={3} />
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, email, or specialty…"
            className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm text-foreground outline-none transition focus:border-primary/60"
          />
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
        >
          <Plus className="h-4 w-4" /> Add trainer
        </button>
      </div>

      {isLoading ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-border bg-card">
          <Loader2 className="mb-3 h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading trainers…</p>
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-destructive/30 bg-card p-10 text-center">
          <p className="font-semibold text-foreground">Couldn’t load trainers</p>
          <p className="mt-1 text-sm text-muted-foreground">Check your admin session and try again.</p>
          <button onClick={() => refetch()} className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Try again</button>
        </div>
      ) : filteredTrainers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Users className="h-5 w-5" /></div>
          <p className="mt-4 font-semibold text-foreground">{search ? 'No trainers match your search' : 'Your trainer roster is empty'}</p>
          <p className="mt-1 text-sm text-muted-foreground">{search ? 'Try another name, email, or specialty.' : 'Add your first trainer to populate the public trainer portal.'}</p>
          {!search && <button onClick={openCreate} className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Add first trainer</button>}
        </div>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-border bg-card px-5">
          <div className="hidden border-b border-border/60 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground lg:grid lg:grid-cols-[minmax(0,1.6fr)_minmax(220px,1fr)_minmax(230px,1fr)] lg:items-center lg:gap-4">
            <span>Trainer</span><span>Contact</span><span className="text-right">Actions</span>
          </div>
          <div className="divide-y divide-border/60">
            {filteredTrainers.map((trainer, index) => {
              const isExpanded = expandedId === trainer.id;
              return (
                <motion.article key={trainer.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
                  <div className="flex flex-col gap-4 py-4 lg:grid lg:grid-cols-[minmax(0,1.6fr)_minmax(220px,1fr)_minmax(230px,1fr)] lg:items-center lg:gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      {trainer.avatarUrl ? (
                        <img src={trainer.avatarUrl} alt={trainer.fullName} className="h-12 w-12 shrink-0 rounded-full border-2 border-primary/20 object-cover" />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{initials(trainer.fullName)}</div>
                      )}
                      <div className="min-w-0">
                        <h2 className="truncate text-sm font-semibold text-foreground">{trainer.fullName}</h2>
                        <p className="truncate text-xs font-semibold text-primary">{trainer.specialty || 'Performance coach'}</p>
                      </div>
                    </div>
                    <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground"><Mail className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{trainer.email}</span></div>
                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      <button onClick={() => setExpandedId(isExpanded ? null : trainer.id)} aria-expanded={isExpanded} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-2 text-[11px] font-semibold text-foreground transition hover:border-primary/40 hover:text-primary">{isExpanded ? 'Hide details' : 'View details'}{isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}</button>
                      <button onClick={() => openEdit(trainer)} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-2 text-[11px] font-semibold text-foreground transition hover:bg-accent"><Edit3 className="h-3.5 w-3.5" /> Edit</button>
                      <button onClick={() => setDeleteId(trainer.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/25 px-2.5 py-2 text-[11px] font-semibold text-destructive transition hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /> Remove</button>
                    </div>
                  </div>
                  {isExpanded && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
                      <div className="mb-4 grid gap-5 rounded-xl bg-background/60 p-4 sm:grid-cols-2">
                        <div><p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Email</p><p className="mt-1 break-all text-sm text-foreground">{trainer.email}</p></div>
                        <div><p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Specialty</p><p className="mt-1 text-sm text-foreground">{trainer.specialty || 'Performance coach'}</p></div>
                        <div className="sm:col-span-2"><p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Public bio</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{trainer.bio || 'No public bio added yet.'}</p></div>
                      </div>
                    </motion.div>
                  )}
                </motion.article>
              );
            })}
          </div>
        </section>
      )}

      <Dialog open={editorOpen} onOpenChange={(open) => !open && closeEditor()}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto border-border bg-card p-6">
          <DialogHeader className="mb-5">
            <DialogTitle className="text-base font-bold text-foreground">{editingTrainer ? 'Edit trainer' : 'Add trainer'}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">These details appear on the public trainer page and in class booking experiences.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 sm:col-span-2"><span className="text-xs font-semibold text-muted-foreground">Full name</span><input required value={form.fullName} onChange={(event) => updateField('fullName', event.target.value)} placeholder="e.g. Amara Wanjiku" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/60" /></label>
              <label className="space-y-1.5 sm:col-span-2"><span className="text-xs font-semibold text-muted-foreground">Email address</span><input required type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} placeholder="trainer@optizgym.com" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/60" /></label>
              <label className="space-y-1.5 sm:col-span-2"><span className="text-xs font-semibold text-muted-foreground">Specialty</span><input value={form.specialty} onChange={(event) => updateField('specialty', event.target.value)} placeholder="Strength & conditioning" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/60" /></label>
              <label className="space-y-1.5 sm:col-span-2"><span className="text-xs font-semibold text-muted-foreground">Bio</span><textarea rows={4} value={form.bio} onChange={(event) => updateField('bio', event.target.value)} placeholder="Share the trainer’s coaching approach and experience…" className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm leading-6 text-foreground outline-none focus:border-primary/60" /></label>
              <label className="space-y-1.5 sm:col-span-2"><span className="text-xs font-semibold text-muted-foreground">Avatar URL <span className="font-normal">(optional)</span></span><input type="url" value={form.avatarUrl} onChange={(event) => updateField('avatarUrl', event.target.value)} placeholder="https://…" className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/60" /></label>
            </div>
            <div className="flex gap-3 pt-2"><button type="button" onClick={closeEditor} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground transition hover:bg-accent">Cancel</button><button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">{createMutation.isPending || updateMutation.isPending ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Saving…</span> : editingTrainer ? 'Save changes' : 'Create trainer'}</button></div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="max-w-sm border-destructive/30 bg-card p-6">
          <DialogHeader className="mb-4"><DialogTitle className="text-base font-bold text-foreground">Remove trainer?</DialogTitle><DialogDescription className="text-sm text-muted-foreground">The trainer will be removed from the active roster. Existing classes keep their legacy trainer label.</DialogDescription></DialogHeader>
          <div className="mt-2 flex gap-3"><button onClick={() => setDeleteId(null)} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground transition hover:bg-accent">Cancel</button><button onClick={handleDelete} disabled={deleteMutation.isPending} className="flex-1 rounded-xl bg-destructive py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60">{deleteMutation.isPending ? 'Removing…' : 'Remove trainer'}</button></div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminTrainers;
