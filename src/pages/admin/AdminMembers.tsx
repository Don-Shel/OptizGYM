import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Filter, MoreHorizontal, Mail, Phone,
  Edit3, Trash2, Shield, Ban, CheckCircle, X, ChevronUp, ChevronDown, Loader2, Calendar
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { useMembers } from "@/hooks/api/useMembers";

type SortKey = "fullName" | "plan" | "membershipStatus" | "joinedAt";
type SortDir = "asc" | "desc";

const STATUS_CONFIG: Record<string, any> = {
  active: { label: "Active", color: "bg-emerald-500/10 text-emerald-400" },
  expired: { label: "Expired", color: "bg-red-500/10 text-red-400" },
  pending: { label: "Pending", color: "bg-amber-500/10 text-amber-400" },
  cancelled: { label: "Cancelled", color: "bg-red-500/10 text-red-400" },
};

const PLAN_CONFIG: Record<string, any> = {
  free: "bg-muted text-muted-foreground",
  basic: "bg-muted text-muted-foreground",
  pro: "bg-primary/10 text-primary",
  elite: "bg-cyan-500/10 text-cyan-400",
};

const AdminMembers = () => {
  const { useAllMembers, useSuspendMember, useRemoveMember } = useMembers();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("joinedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selected, setSelected] = useState<any | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const { data: members = [], isLoading } = useAllMembers();
  const suspendMutation = useSuspendMember();
  const removeMutation = useRemoveMember();

  const handleSuspend = (id: string) => {
    suspendMutation.mutate(id, { onSuccess: () => setMenuOpen(null) });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      removeMutation.mutate(id, { onSuccess: () => { setMenuOpen(null); setSelected(null); } });
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const filtered = members
    .filter((m: any) => {
      if (statusFilter !== "all" && m.membershipStatus !== statusFilter) return false;
      if (planFilter !== "all" && m.plan !== planFilter) return false;
      if (search && !m.fullName?.toLowerCase().includes(search.toLowerCase()) && !m.email.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a: any, b: any) => {
      let av: any = (a as any)[sortKey], bv: any = (b as any)[sortKey];
      if (typeof av === "string") { av = av.toLowerCase(); bv = bv.toLowerCase(); }
      return sortDir === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });

  const SortIcon = ({ k }: { k: SortKey }) => sortKey === k
    ? (sortDir === "asc" ? <ChevronUp className="h-3 w-3 text-primary" /> : <ChevronDown className="h-3 w-3 text-primary" />)
    : <ChevronUp className="h-3 w-3 text-muted-foreground/30" />;

  const activeCount = members.filter((m: any) => m.membershipStatus === "active").length;

  return (
    <DashboardLayout title="Members" subtitle="Manage all gym members and subscriptions">

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Members" value={members.length} icon={Shield} accent index={0} />
        <StatCard title="Active" value={activeCount} icon={CheckCircle} index={1} />
        <StatCard title="Expired" value={members.filter((m: any) => m.membershipStatus === "expired").length} icon={Ban} index={2} />
        <StatCard title="Pending" value={members.filter((m: any) => m.membershipStatus === "pending").length} icon={Filter} index={3} />
      </div>

      <div className="mb-6 flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members by name or email…"
            className="w-full rounded-lg border border-border bg-card pl-9 pr-4 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none" />
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground focus:outline-none">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="pending">Pending</option>
          </select>
          <select value={planFilter} onChange={e => setPlanFilter(e.target.value)}
            className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground focus:outline-none">
            <option value="all">All Plans</option>
            <option value="basic">Basic</option>
            <option value="pro">Pro</option>
            <option value="elite">Elite</option>
          </select>
          <p className="max-w-xs text-right text-xs text-muted-foreground">New accounts are created through Neon Auth and synchronized here automatically.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
          <p className="text-sm text-muted-foreground">Loading members...</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-card/60">
                  <th onClick={() => handleSort("fullName")} className="px-4 py-3 text-left cursor-pointer group hover:bg-accent/30 transition-colors">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name <SortIcon k="fullName" /></div>
                  </th>
                  <th onClick={() => handleSort("plan")} className="px-4 py-3 text-left cursor-pointer group hover:bg-accent/30 transition-colors">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Plan <SortIcon k="plan" /></div>
                  </th>
                  <th onClick={() => handleSort("membershipStatus")} className="px-4 py-3 text-left cursor-pointer group hover:bg-accent/30 transition-colors">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status <SortIcon k="membershipStatus" /></div>
                  </th>
                  <th onClick={() => handleSort("joinedAt")} className="px-4 py-3 text-left cursor-pointer group hover:bg-accent/30 transition-colors">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Joined <SortIcon k="joinedAt" /></div>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((m: any, i: number) => (
                  <motion.tr key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.01 }}
                    onClick={() => setSelected(m)} className="hover:bg-accent/10 transition-colors cursor-pointer group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">{m.fullName?.split(' ').map((n: string) => n[0]).join('')}</div>
                        <div><p className="font-medium text-foreground">{m.fullName}</p><p className="text-xs text-muted-foreground">{m.email}</p></div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", PLAN_CONFIG[m.plan] || "bg-muted text-muted-foreground")}>{m.plan}</span></td>
                    <td className="px-4 py-3"><span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", (STATUS_CONFIG[m.membershipStatus] || STATUS_CONFIG.pending).color)}>{(STATUS_CONFIG[m.membershipStatus] || STATUS_CONFIG.pending).label}</span></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground font-medium">{m.joinedAt ? format(new Date(m.joinedAt), "MMM d, yyyy") : ""}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end relative">
                        <button onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === m.id ? null : m.id); }} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-accent text-muted-foreground transition-colors"><MoreHorizontal className="h-4 w-4" /></button>
                        <AnimatePresence>
                          {menuOpen === m.id && (
                            <motion.div initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -10 }}
                              className="absolute right-0 top-full mt-1 z-50 w-40 rounded-xl border border-border bg-card p-1 shadow-2xl">
                              <button onClick={(e) => { e.stopPropagation(); setSelected(m); setMenuOpen(null); }} className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-foreground hover:bg-accent transition-colors"><Edit3 className="h-3.5 w-3.5" /> View Profile</button>
                              <button onClick={(e) => { e.stopPropagation(); handleSuspend(m.id); }} className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-amber-400 hover:bg-amber-500/10 transition-colors"><Ban className="h-3.5 w-3.5" /> Suspend</button>
                              <div className="h-px bg-border my-1" />
                              <button onClick={(e) => { e.stopPropagation(); handleDelete(m.id); }} className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 className="h-3.5 w-3.5" /> Remove</button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-md border-l border-border bg-card p-6 overflow-y-auto">
          {selected && (
            <>
              <SheetHeader className="mb-8">
                <SheetTitle className="text-lg font-bold text-foreground">Member Details</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col items-center text-center mb-8">
                <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary mb-4">{selected.fullName?.split(' ').map((n: string) => n[0]).join('')}</div>
                <h2 className="text-xl font-bold text-foreground mb-1">{selected.fullName}</h2>
                <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", (STATUS_CONFIG[selected.membershipStatus] || STATUS_CONFIG.pending).color)}>{(STATUS_CONFIG[selected.membershipStatus] || STATUS_CONFIG.pending).label}</span>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-border bg-background/50 p-4">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Current Plan</p>
                    <p className="text-sm font-bold text-foreground capitalize">{selected.plan}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-background/50 p-4">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Billing</p>
                    <p className="text-sm font-bold text-foreground capitalize">{selected.planBilling}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-muted-foreground"><Mail className="h-4 w-4" /><span className="text-sm">{selected.email}</span></div>
                  <div className="flex items-center gap-3 text-muted-foreground"><Phone className="h-4 w-4" /><span className="text-sm">{selected.phone || "No phone added"}</span></div>
                  <div className="flex items-center gap-3 text-muted-foreground"><Calendar className="h-4 w-4" /><span className="text-sm">Joined {selected.joinedAt ? format(new Date(selected.joinedAt), "MMMM d, yyyy") : ""}</span></div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

    </DashboardLayout>
  );
};

export default AdminMembers;
