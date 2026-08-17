import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  CreditCard,
  Dumbbell,
  Loader2,
  Plus,
  Shield,
  UserCheck,
  Users,
  AlertCircle,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import { format } from "date-fns";
import { useAdmin } from "@/hooks/api/useAdmin";

const managementLinks = [
  {
    title: "Member oversight",
    description: "Review profiles, activate access, update statuses, and manage member records.",
    path: "/admin/members",
    icon: Users,
    accent: "bg-primary/10 text-primary",
    action: "Manage members",
  },
  {
    title: "Class scheduling",
    description: "Create sessions, update schedules, control capacity, and remove outdated classes.",
    path: "/admin/classes",
    icon: Calendar,
    accent: "bg-cyan-500/10 text-cyan-400",
    action: "Manage classes",
  },
  {
    title: "Trainer management",
    description: "Maintain coaching profiles, specialties, bios, and class assignments.",
    path: "/admin/trainers",
    icon: Dumbbell,
    accent: "bg-violet-500/10 text-violet-400",
    action: "Manage trainers",
  },
  {
    title: "Payment operations",
    description: "Review payment records, follow up on pending transactions, and issue receipts.",
    path: "/admin/payments",
    icon: CreditCard,
    accent: "bg-amber-500/10 text-amber-400",
    action: "Review payments",
  },
];

const AdminDashboard = () => {
  const { useStats } = useAdmin();
  const { data: stats, isLoading, isError, error, refetch } = useStats();

  if (isLoading) {
    return (
      <DashboardLayout title="Operations" subtitle="Run the gym from one focused command center">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading operational data...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout title="Operations" subtitle="Run the gym from one focused command center">
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-10 text-center">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-destructive" />
          <p className="font-semibold text-foreground">Unable to load operations data</p>
          <p className="mt-1 text-sm text-muted-foreground">{error instanceof Error ? error.message : "Check your admin session and try again."}</p>
          <button onClick={() => refetch()} className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Retry</button>
        </div>
      </DashboardLayout>
    );
  }

  const recentMembers = stats?.recentMembers || [];
  const recentPayments = stats?.recentPayments || [];

  return (
    <DashboardLayout title="Operations" subtitle="Manage members, schedules, trainers, and payment workflows">
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/15 via-card to-card p-6 lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <Shield className="h-3.5 w-3.5" /> Management workspace
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Keep daily operations moving.</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Use this workspace for decisions and actions that change the gym. For trends, comparisons, and performance reporting, open Analytics.</p>
          </div>
          <Link to="/admin/analytics" className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-background/50 px-4 py-3 text-sm font-semibold text-primary transition hover:bg-primary/10">
            Open analytics <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.section>

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Total Members" value={stats?.totalMembers?.toLocaleString() || "0"} subtitle="Active profiles" icon={Users} accent index={0} />
        <StatCard title="Active Members" value={stats?.activeMembers?.toLocaleString() || "0"} subtitle="Access currently enabled" icon={UserCheck} index={1} />
        <StatCard title="Upcoming Classes" value={stats?.upcomingClasses?.toLocaleString() || "0"} subtitle={`${stats?.totalClasses || 0} total scheduled`} icon={Calendar} index={2} />
        <StatCard title="Pending Payments" value={stats?.pendingPayments?.toLocaleString() || "0"} subtitle="Needs follow-up" icon={CreditCard} index={3} />
      </div>

      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Management areas</h2>
          <p className="mt-1 text-xs text-muted-foreground">Choose an operational workflow to make a change.</p>
        </div>
        <span className="hidden items-center gap-1.5 text-xs text-emerald-400 sm:flex"><CheckCircle2 className="h-3.5 w-3.5" /> Live data</span>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-2">
        {managementLinks.map(({ title, description, path, icon: Icon, accent, action }, index) => (
          <motion.div key={path} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="group rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent}`}><Icon className="h-5 w-5" /></div>
              <Link to={path} aria-label={action} className="rounded-lg p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground"><ArrowRight className="h-4 w-4" /></Link>
            </div>
            <h3 className="mt-5 text-base font-semibold text-foreground">{title}</h3>
            <p className="mt-1 min-h-12 text-sm leading-6 text-muted-foreground">{description}</p>
            <Link to={path} className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">{action} <ArrowRight className="h-3.5 w-3.5" /></Link>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border/50 p-5">
            <div><h2 className="text-sm font-semibold text-foreground">Recent member activity</h2><p className="mt-1 text-xs text-muted-foreground">Profiles that may need an operational check.</p></div>
            <Link to="/admin/members" className="text-xs font-semibold text-primary hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-border/40">
            {recentMembers.map((member: any) => (
              <div key={member.id} className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{member.fullName?.split(" ").map((name: string) => name[0]).join("") || "M"}</div>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-foreground">{member.fullName || member.email}</p><p className="truncate text-xs text-muted-foreground">{member.email} · {member.plan || "free"} plan</p></div>
                <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">{member.membershipStatus || "pending"}</span>
              </div>
            ))}
            {!recentMembers.length && <div className="p-8 text-center text-xs text-muted-foreground">No recent member activity.</div>}
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border/50 p-5">
            <div><h2 className="text-sm font-semibold text-foreground">Payment follow-up</h2><p className="mt-1 text-xs text-muted-foreground">Recent transactions for operational review.</p></div>
            <Link to="/admin/payments" className="text-xs font-semibold text-primary hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-border/40">
            {recentPayments.map((payment: any) => (
              <div key={payment.id} className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/10"><CreditCard className="h-4 w-4 text-amber-400" /></div>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-foreground">{payment.memberName || "Unknown member"}</p><p className="truncate text-xs text-muted-foreground">{payment.plan || "membership"} · {payment.paystackReference || "No reference"}</p></div>
                <div className="text-right"><p className="text-xs font-semibold text-foreground">KES {Number(payment.amount || 0).toLocaleString()}</p><span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{payment.status || "pending"}</span></div>
              </div>
            ))}
            {!recentPayments.length && <div className="p-8 text-center text-xs text-muted-foreground">No recent payments.</div>}
          </div>
        </motion.section>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/admin/members" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:brightness-110"><Plus className="h-3.5 w-3.5" /> Add member profile</Link>
        <Link to="/admin/classes" className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-accent"><BookOpen className="h-3.5 w-3.5" /> Schedule class</Link>
        <Link to="/admin/trainers" className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-accent"><Dumbbell className="h-3.5 w-3.5" /> Add trainer</Link>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
