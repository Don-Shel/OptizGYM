import { useMemo, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import {
  Search, Filter, MoreHorizontal, Mail, Phone, Edit3, Trash2, Shield,
  Ban, CheckCircle, ChevronUp, ChevronDown, Loader2, Calendar, Plus,
  UserRound, UserCheck, X,
} from "lucide-react";
import { format } from "date-fns";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import { cn } from "@/lib/utils";
import { useMembers } from "@/hooks/api/useMembers";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";

type SortKey = "fullName" | "plan" | "membershipStatus" | "joinedAt";
type SortDir = "asc" | "desc";
type Member = {
  id: string;
  authUserId: string;
  email: string;
  fullName?: string | null;
  phone?: string | null;
  role?: "member" | "admin";
  plan: "free" | "basic" | "pro" | "elite";
  planBilling: "monthly" | "yearly";
  membershipStatus: "active" | "pending" | "expired" | "cancelled";
  isEmailVerified?: number | boolean;
  joinedAt?: string;
  expiresAt?: string | null;
};
type MemberForm = {
  authUserId: string;
  email: string;
  fullName: string;
  phone: string;
  plan: Member["plan"];
  planBilling: Member["planBilling"];
  membershipStatus: Member["membershipStatus"];
  role: "member" | "admin";
  isEmailVerified: boolean;
};
type MenuState = { id: string; top: number; left: number } | null;

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "bg-emerald-500/10 text-emerald-400" },
  expired: { label: "Expired", color: "bg-red-500/10 text-red-400" },
  pending: { label: "Pending", color: "bg-amber-500/10 text-amber-400" },
  cancelled: { label: "Cancelled", color: "bg-red-500/10 text-red-400" },
};
const PLAN_CONFIG: Record<string, string> = {
  free: "bg-muted text-muted-foreground",
  basic: "bg-muted text-muted-foreground",
  pro: "bg-primary/10 text-primary",
  elite: "bg-cyan-500/10 text-cyan-400",
};
const EMPTY_FORM: MemberForm = {
  authUserId: "", email: "", fullName: "", phone: "", plan: "free",
  planBilling: "monthly", membershipStatus: "pending", role: "member", isEmailVerified: false,
};

const initials = (name?: string | null) => name?.split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "M";
const isVerified = (member: Member) => member.isEmailVerified === true || member.isEmailVerified === 1;

const AdminMembers = () => {
  const {
    useAllMembers, useCreateMemberAdmin, useUpdateMember, useActivateMember,
    useSuspendMember, useRemoveMember,
  } = useMembers();
  const { data: members = [], isLoading, isError, refetch } = useAllMembers();
  const createMember = useCreateMemberAdmin();
  const updateMember = useUpdateMember();
  const activateMember = useActivateMember();
  const suspendMember = useSuspendMember();
  const removeMember = useRemoveMember();
  const rows = members as Member[];

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("joinedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selected, setSelected] = useState<Member | null>(null);
  const [menuOpen, setMenuOpen] = useState<MenuState>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [form, setForm] = useState<MemberForm>(EMPTY_FORM);

  const filtered = useMemo(() => rows.filter((member) => {
    if (statusFilter !== "all" && member.membershipStatus !== statusFilter) return false;
    if (planFilter !== "all" && member.plan !== planFilter) return false;
    if (search) {
      const needle = search.toLowerCase();
      if (!`${member.fullName || ""} ${member.email} ${member.phone || ""}`.toLowerCase().includes(needle)) return false;
    }
    return true;
  }).sort((a, b) => {
    let av: any = a[sortKey];
    let bv: any = b[sortKey];
    if (sortKey === "joinedAt") {
      av = av ? new Date(av).getTime() : 0;
      bv = bv ? new Date(bv).getTime() : 0;
    } else if (typeof av === "string") {
      av = av.toLowerCase();
      bv = String(bv || "").toLowerCase();
    }
    return sortDir === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  }), [rows, search, statusFilter, planFilter, sortKey, sortDir]);

  const openMenu = (event: React.MouseEvent<HTMLButtonElement>, id: string) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const menuWidth = 190;
    const menuHeight = 210;
    const top = rect.bottom + menuHeight > window.innerHeight ? Math.max(12, rect.top - menuHeight - 6) : rect.bottom + 6;
    const left = Math.min(Math.max(12, rect.right - menuWidth), window.innerWidth - menuWidth - 12);
    setMenuOpen(menuOpen?.id === id ? null : { id, top, left });
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((direction) => direction === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };
  const openCreate = () => { setEditingMember(null); setForm(EMPTY_FORM); setEditorOpen(true); };
  const openEdit = (member: Member) => {
    setEditingMember(member);
    setForm({
      authUserId: member.authUserId || "", email: member.email || "", fullName: member.fullName || "",
      phone: member.phone || "", plan: member.plan || "free", planBilling: member.planBilling || "monthly",
      membershipStatus: member.membershipStatus || "pending", role: member.role || "member", isEmailVerified: isVerified(member),
    });
    setEditorOpen(true);
  };
  const closeEditor = () => {
    if (createMember.isPending || updateMember.isPending) return;
    setEditorOpen(false);
    setEditingMember(null);
    setForm(EMPTY_FORM);
  };
  const updateField = (field: keyof MemberForm, value: string | boolean) => setForm((current) => ({ ...current, [field]: value } as MemberForm));

  const submitForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (form.fullName.trim().length < 2) return toast.error("Enter the member’s full name.");
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return toast.error("Enter a valid email address.");
    if (!editingMember && !form.authUserId.trim()) return toast.error("Enter the Neon Auth user ID for this profile.");

    if (editingMember) {
      updateMember.mutate({ id: editingMember.id, data: {
        fullName: form.fullName.trim(), phone: form.phone.trim(), plan: form.plan, planBilling: form.planBilling,
        membershipStatus: form.membershipStatus, role: form.role, isEmailVerified: form.isEmailVerified,
      } }, { onSuccess: () => { closeEditor(); setSelected(null); } });
    } else {
      createMember.mutate({
        authUserId: form.authUserId.trim(), email: form.email.trim().toLowerCase(), fullName: form.fullName.trim(),
        phone: form.phone.trim(), plan: form.plan, planBilling: form.planBilling,
        membershipStatus: form.membershipStatus, isEmailVerified: form.isEmailVerified,
      }, { onSuccess: closeEditor });
    }
  };

  const menuMember = menuOpen ? rows.find((member) => member.id === menuOpen.id) : null;
  const activeCount = rows.filter((member) => member.membershipStatus === "active").length;
  const pendingCount = rows.filter((member) => member.membershipStatus === "pending").length;

  const SortIcon = ({ k }: { k: SortKey }) => sortKey === k
    ? (sortDir === "asc" ? <ChevronUp className="h-3 w-3 text-primary" /> : <ChevronDown className="h-3 w-3 text-primary" />)
    : <ChevronUp className="h-3 w-3 text-muted-foreground/30" />;

  return (
    <DashboardLayout title="Members" subtitle="Manage profiles, access, and subscriptions without database edits">
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Total Members" value={rows.length} icon={Shield} accent index={0} />
        <StatCard title="Active" value={activeCount} icon={CheckCircle} index={1} />
        <StatCard title="Pending" value={pendingCount} icon={UserCheck} index={2} />
        <StatCard title="Visible Results" value={filtered.length} icon={Filter} index={3} />
      </div>

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search members by name, email, or phone…" className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm text-foreground outline-none transition focus:border-primary/50" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none"><option value="all">All Status</option><option value="active">Active</option><option value="pending">Pending</option><option value="expired">Expired</option><option value="cancelled">Cancelled</option></select>
          <select value={planFilter} onChange={(event) => setPlanFilter(event.target.value)} className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none"><option value="all">All Plans</option><option value="free">Free</option><option value="basic">Basic</option><option value="pro">Pro</option><option value="elite">Elite</option></select>
          <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110"><Plus className="h-4 w-4" /> Add profile</button>
        </div>
      </div>

      {isLoading ? <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-border bg-card"><Loader2 className="mb-3 h-8 w-8 animate-spin text-primary" /><p className="text-sm text-muted-foreground">Loading members…</p></div> : isError ? <div className="rounded-2xl border border-destructive/30 bg-card p-10 text-center"><p className="font-semibold text-foreground">Couldn’t load members</p><button onClick={() => refetch()} className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Try again</button></div> : (
        <div className="rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-card/60"><th onClick={() => handleSort("fullName")} className="cursor-pointer px-4 py-3 text-left"><div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name <SortIcon k="fullName" /></div></th><th onClick={() => handleSort("plan")} className="cursor-pointer px-4 py-3 text-left"><div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Plan <SortIcon k="plan" /></div></th><th onClick={() => handleSort("membershipStatus")} className="cursor-pointer px-4 py-3 text-left"><div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status <SortIcon k="membershipStatus" /></div></th><th onClick={() => handleSort("joinedAt")} className="cursor-pointer px-4 py-3 text-left"><div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Joined <SortIcon k="joinedAt" /></div></th><th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th></tr></thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((member, index) => <motion.tr key={member.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.01 }} onClick={() => setSelected(member)} className="cursor-pointer transition-colors hover:bg-accent/10">
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">{initials(member.fullName)}</div><div><p className="font-medium text-foreground">{member.fullName || "Unnamed member"}</p><p className="text-xs text-muted-foreground">{member.email}</p></div></div></td>
                  <td className="px-4 py-3"><span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", PLAN_CONFIG[member.plan] || PLAN_CONFIG.free)}>{member.plan}</span></td>
                  <td className="px-4 py-3"><span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", (STATUS_CONFIG[member.membershipStatus] || STATUS_CONFIG.pending).color)}>{(STATUS_CONFIG[member.membershipStatus] || STATUS_CONFIG.pending).label}</span></td>
                  <td className="px-4 py-3 text-xs font-medium text-muted-foreground">{member.joinedAt ? format(new Date(member.joinedAt), "MMM d, yyyy") : "—"}</td>
                  <td className="px-4 py-3"><div className="flex justify-end"><button aria-label={`Actions for ${member.fullName || member.email}`} onClick={(event) => openMenu(event, member.id)} className="relative z-10 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"><MoreHorizontal className="h-4 w-4" /></button></div></td>
                </motion.tr>)}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <div className="p-12 text-center text-sm text-muted-foreground">No members match the current filters.</div>}
        </div>
      )}

      {menuOpen && menuMember && createPortal(<><button aria-label="Close member actions" onClick={() => setMenuOpen(null)} className="fixed inset-0 z-[10040] cursor-default" /><motion.div initial={{ opacity: 0, scale: 0.96, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="fixed z-[10050] w-[190px] rounded-xl border border-border bg-card p-1.5 shadow-2xl" style={{ top: menuOpen.top, left: menuOpen.left }}>
        <button onClick={() => { setSelected(menuMember); setMenuOpen(null); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-foreground transition hover:bg-accent"><UserRound className="h-3.5 w-3.5" /> View profile</button>
        <button onClick={() => { openEdit(menuMember); setMenuOpen(null); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-foreground transition hover:bg-accent"><Edit3 className="h-3.5 w-3.5" /> Edit member</button>
        {menuMember.membershipStatus !== "active" && <button onClick={() => { activateMember.mutate({ id: menuMember.id, data: { plan: menuMember.plan, planBilling: menuMember.planBilling } }, { onSuccess: () => setMenuOpen(null) }); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-emerald-400 transition hover:bg-emerald-500/10"><CheckCircle className="h-3.5 w-3.5" /> Activate profile</button>}
        {menuMember.membershipStatus === "active" && <button onClick={() => { suspendMember.mutate(menuMember.id, { onSuccess: () => setMenuOpen(null) }); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-amber-400 transition hover:bg-amber-500/10"><Ban className="h-3.5 w-3.5" /> Suspend access</button>}
        <div className="my-1 h-px bg-border" />
        <button onClick={() => { setMenuOpen(null); if (window.confirm("Remove this member profile? This is a soft delete and can be restored from the database if needed.")) removeMember.mutate(menuMember.id, { onSuccess: () => setSelected(null) }); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-red-400 transition hover:bg-red-500/10"><Trash2 className="h-3.5 w-3.5" /> Remove profile</button>
      </motion.div></>, document.body)}

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}><SheetContent className="w-full overflow-y-auto border-l border-border bg-card p-6 sm:max-w-md"><SheetHeader className="mb-8"><SheetTitle className="text-lg font-bold text-foreground">Member profile</SheetTitle></SheetHeader>{selected && <><div className="mb-8 flex flex-col items-center text-center"><div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-bold text-primary">{initials(selected.fullName)}</div><h2 className="mb-1 text-xl font-bold text-foreground">{selected.fullName || "Unnamed member"}</h2><span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", (STATUS_CONFIG[selected.membershipStatus] || STATUS_CONFIG.pending).color)}>{(STATUS_CONFIG[selected.membershipStatus] || STATUS_CONFIG.pending).label}</span></div><div className="space-y-5"><div className="grid grid-cols-2 gap-4"><div className="rounded-2xl border border-border bg-background/50 p-4"><p className="mb-1 text-[10px] font-bold uppercase text-muted-foreground">Current plan</p><p className="text-sm font-bold capitalize text-foreground">{selected.plan}</p></div><div className="rounded-2xl border border-border bg-background/50 p-4"><p className="mb-1 text-[10px] font-bold uppercase text-muted-foreground">Billing</p><p className="text-sm font-bold capitalize text-foreground">{selected.planBilling}</p></div></div><div className="space-y-3"><div className="flex items-center gap-3 text-muted-foreground"><Mail className="h-4 w-4" /><span className="text-sm">{selected.email}</span></div><div className="flex items-center gap-3 text-muted-foreground"><Phone className="h-4 w-4" /><span className="text-sm">{selected.phone || "No phone added"}</span></div><div className="flex items-center gap-3 text-muted-foreground"><Calendar className="h-4 w-4" /><span className="text-sm">Joined {selected.joinedAt ? format(new Date(selected.joinedAt), "MMMM d, yyyy") : "—"}</span></div><div className="flex items-center gap-3 text-muted-foreground"><CheckCircle className="h-4 w-4" /><span className="text-sm">Email {isVerified(selected) ? "verified" : "not verified"}</span></div></div></div><div className="mt-8 flex gap-3"><button onClick={() => { openEdit(selected); setSelected(null); }} className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110"><Edit3 className="mr-2 inline h-4 w-4" /> Edit</button>{selected.membershipStatus !== "active" ? <button onClick={() => activateMember.mutate({ id: selected.id, data: { plan: selected.plan, planBilling: selected.planBilling } }, { onSuccess: () => setSelected(null) })} className="flex-1 rounded-xl border border-emerald-500/30 py-3 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-500/10"><CheckCircle className="mr-2 inline h-4 w-4" /> Activate</button> : <button onClick={() => suspendMember.mutate(selected.id, { onSuccess: () => setSelected(null) })} className="flex-1 rounded-xl border border-amber-500/30 py-3 text-sm font-semibold text-amber-400 transition hover:bg-amber-500/10"><Ban className="mr-2 inline h-4 w-4" /> Suspend</button>}</div></>}</SheetContent></Sheet>

      <Dialog open={editorOpen} onOpenChange={(open) => !open && closeEditor()}><DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto border-border bg-card p-6"><DialogHeader className="mb-5"><DialogTitle className="text-base font-bold text-foreground">{editingMember ? "Edit member profile" : "Create member profile"}</DialogTitle><DialogDescription className="text-sm leading-6 text-muted-foreground">{editingMember ? "Update access, membership status, and profile information directly from the admin panel." : "Create a profile for an existing Neon Auth user. The Auth user ID links this profile to the person’s login."}</DialogDescription></DialogHeader><form onSubmit={submitForm} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><label className="space-y-1.5 sm:col-span-2"><span className="text-xs font-semibold text-muted-foreground">Full name</span><input required value={form.fullName} onChange={(event) => updateField("fullName", event.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/60" /></label><label className="space-y-1.5"><span className="text-xs font-semibold text-muted-foreground">Email address</span><input required type="email" readOnly={!!editingMember} value={form.email} onChange={(event) => updateField("email", event.target.value)} className={cn("w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/60", editingMember && "cursor-not-allowed bg-muted/40 text-muted-foreground")} /></label><label className="space-y-1.5"><span className="text-xs font-semibold text-muted-foreground">Phone</span><input type="tel" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/60" /></label>{!editingMember && <label className="space-y-1.5 sm:col-span-2"><span className="text-xs font-semibold text-muted-foreground">Neon Auth user ID</span><input required value={form.authUserId} onChange={(event) => updateField("authUserId", event.target.value)} placeholder="Paste the existing Neon Auth user ID" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/60" /></label>}<label className="space-y-1.5"><span className="text-xs font-semibold text-muted-foreground">Plan</span><select value={form.plan} onChange={(event) => updateField("plan", event.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none"><option value="free">Free</option><option value="basic">Basic</option><option value="pro">Pro</option><option value="elite">Elite</option></select></label><label className="space-y-1.5"><span className="text-xs font-semibold text-muted-foreground">Billing</span><select value={form.planBilling} onChange={(event) => updateField("planBilling", event.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none"><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></label><label className="space-y-1.5"><span className="text-xs font-semibold text-muted-foreground">Membership status</span><select value={form.membershipStatus} onChange={(event) => updateField("membershipStatus", event.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none"><option value="active">Active</option><option value="pending">Pending</option><option value="expired">Expired</option><option value="cancelled">Cancelled</option></select></label>{editingMember && <label className="space-y-1.5"><span className="text-xs font-semibold text-muted-foreground">Role</span><select value={form.role} onChange={(event) => updateField("role", event.target.value)} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none"><option value="member">Member</option><option value="admin">Admin</option></select></label>}</div><label className="flex items-center gap-3 rounded-xl border border-border bg-background/50 px-3 py-3 text-sm text-foreground"><input type="checkbox" checked={form.isEmailVerified} onChange={(event) => updateField("isEmailVerified", event.target.checked)} className="h-4 w-4 accent-primary" /><span><span className="block font-semibold">Email verified</span><span className="block text-xs text-muted-foreground">Use this only when the account has been verified through Neon Auth.</span></span></label><div className="flex gap-3 pt-2"><button type="button" onClick={closeEditor} className="flex-1 rounded-xl border border-border py-3 text-sm font-medium text-foreground transition hover:bg-accent">Cancel</button><button type="submit" disabled={createMember.isPending || updateMember.isPending} className="flex-1 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-60">{createMember.isPending || updateMember.isPending ? <span className="flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Saving…</span> : editingMember ? "Save changes" : "Create profile"}</button></div></form></DialogContent></Dialog>
    </DashboardLayout>
  );
};

export default AdminMembers;
