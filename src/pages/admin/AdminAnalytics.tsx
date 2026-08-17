import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  BarChart3,
  CalendarRange,
  CheckCircle2,
  CreditCard,
  Loader2,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import { useAdmin } from "@/hooks/api/useAdmin";

const STATUS_COLORS: Record<string, string> = {
  active: "#a3e635",
  pending: "#fbbf24",
  suspended: "#fb7185",
  expired: "#94a3b8",
  cancelled: "#f87171",
  paid: "#a3e635",
  failed: "#fb7185",
  abandoned: "#f87171",
};

const formatCurrency = (value: number) => `KES ${Number(value || 0).toLocaleString()}`;

const ReportTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-xl">
      <p className="mb-1 text-xs font-semibold text-foreground">{label}</p>
      {payload.map((item: any) => (
        <p key={item.dataKey || item.name} className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{typeof item.value === "number" ? item.value.toLocaleString() : item.value}</span> {item.name}
        </p>
      ))}
    </div>
  );
};

const AdminAnalytics = () => {
  const { useAnalytics } = useAdmin();
  const { data, isLoading, isError, error, refetch, isFetching } = useAnalytics();

  if (isLoading) {
    return (
      <DashboardLayout title="Analytics" subtitle="Comprehensive platform reporting">
        <div className="flex flex-col items-center justify-center py-20"><Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" /><p className="text-sm text-muted-foreground">Loading analytics...</p></div>
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout title="Analytics" subtitle="Comprehensive platform reporting">
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-10 text-center">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-destructive" />
          <p className="font-semibold text-foreground">Unable to load analytics</p>
          <p className="mt-1 text-sm text-muted-foreground">{error instanceof Error ? error.message : "The analytics service returned an unexpected response."}</p>
          <button onClick={() => refetch()} className="mt-5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Retry</button>
        </div>
      </DashboardLayout>
    );
  }

  const summary = data?.summary || {};
  const legacyFallback = Boolean(data?.legacyFallback);
  const bookingTrend = data?.bookingTrend || [];
  const membershipGrowth = data?.membershipGrowth || [];
  const revenueByPlan = data?.revenueByPlan || [];
  const capacityUtilization = data?.capacityUtilization || [];
  const membershipStatus = data?.membershipStatus || [];
  const paymentStatus = data?.paymentStatus || [];
  const bookingStatus = data?.bookingStatus || [];

  return (
    <DashboardLayout title="Analytics" subtitle="Comprehensive platform reporting and performance analysis">
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-card to-card p-6 lg:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-400"><BarChart3 className="h-3.5 w-3.5" /> Reporting workspace</div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">See how the platform is performing.</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Analytics is for trends, comparisons, and reporting. Use Operations when you need to change members, schedules, trainers, or payment records.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => refetch()} disabled={isFetching} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background/50 px-4 py-3 text-sm font-semibold text-foreground transition hover:bg-accent disabled:opacity-60"><RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> Refresh</button>
            <Link to="/admin" className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-background/50 px-4 py-3 text-sm font-semibold text-cyan-400 transition hover:bg-cyan-500/10"><ArrowLeft className="h-4 w-4" /> Operations</Link>
          </div>
        </div>
      </motion.section>

      {legacyFallback && (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
          The dedicated analytics API is still rolling out on the server. Showing a safe operational summary temporarily; detailed trend reports will appear automatically once the deployment finishes.
        </div>
      )}

      <div className="mb-8 grid grid-cols-2 gap-4 xl:grid-cols-5">
        <StatCard title="Total Revenue" value={formatCurrency(summary.totalRevenue)} subtitle="All paid transactions" icon={CreditCard} accent index={0} />
        <StatCard title="Active Members" value={Number(summary.activeMembers || 0).toLocaleString()} subtitle={`${Number(summary.totalMembers || 0).toLocaleString()} total profiles`} icon={Users} index={1} />
        <StatCard title="New This Month" value={Number(summary.newMembersThisMonth || 0).toLocaleString()} subtitle="Member growth" icon={TrendingUp} index={2} />
        <StatCard title="Confirmed Bookings" value={Number(summary.confirmedBookings || 0).toLocaleString()} subtitle="All time" icon={CalendarRange} index={3} />
        <StatCard title="Avg Utilization" value={`${Number(summary.averageUtilization || 0).toFixed(1)}%`} subtitle="Upcoming classes" icon={Activity} index={4} />
      </div>

      <div className="mb-5 flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-emerald-400" /><p className="text-xs text-muted-foreground">Reports use live platform data and refresh automatically after member, booking, class, and payment changes.</p></div>

      <div className="mb-5 grid gap-5 xl:grid-cols-2">
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4"><h2 className="text-sm font-semibold text-foreground">Booking trends</h2><p className="mt-1 text-xs text-muted-foreground">Confirmed and cancelled bookings across the last six months.</p></div>
          <ResponsiveContainer width="100%" height={270}>
            <AreaChart data={bookingTrend}>
              <defs><linearGradient id="confirmedBookings" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#a3e635" stopOpacity={0.3} /><stop offset="95%" stopColor="#a3e635" stopOpacity={0} /></linearGradient><linearGradient id="cancelledBookings" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#fb7185" stopOpacity={0.2} /><stop offset="95%" stopColor="#fb7185" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 16%)" vertical={false} /><XAxis dataKey="month" tick={{ fill: "hsl(0 0% 64%)", fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fill: "hsl(0 0% 64%)", fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip content={<ReportTooltip />} /><Legend wrapperStyle={{ fontSize: 11 }} /><Area type="monotone" dataKey="confirmed" name="Confirmed" stroke="#a3e635" fill="url(#confirmedBookings)" strokeWidth={2} /><Area type="monotone" dataKey="cancelled" name="Cancelled" stroke="#fb7185" fill="url(#cancelledBookings)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4"><h2 className="text-sm font-semibold text-foreground">Membership growth</h2><p className="mt-1 text-xs text-muted-foreground">New member profiles created over the last six months.</p></div>
          <ResponsiveContainer width="100%" height={270}>
            <BarChart data={membershipGrowth}><CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 16%)" vertical={false} /><XAxis dataKey="month" tick={{ fill: "hsl(0 0% 64%)", fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fill: "hsl(0 0% 64%)", fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip content={<ReportTooltip />} /><Bar dataKey="newMembers" name="New members" fill="#22d3ee" radius={[5, 5, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </motion.section>
      </div>

      <div className="mb-5 grid gap-5 xl:grid-cols-2">
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4"><h2 className="text-sm font-semibold text-foreground">Revenue by plan</h2><p className="mt-1 text-xs text-muted-foreground">Paid transaction contribution by membership plan.</p></div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={revenueByPlan} layout="vertical" margin={{ left: 10, right: 20 }}><CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 16%)" horizontal={false} /><XAxis type="number" tick={{ fill: "hsl(0 0% 64%)", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} /><YAxis type="category" dataKey="plan" width={60} tick={{ fill: "hsl(0 0% 64%)", fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip content={<ReportTooltip />} /><Bar dataKey="revenue" name="Revenue (KES)" fill="#a3e635" radius={[0, 5, 5, 0]} /></BarChart>
          </ResponsiveContainer>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4"><h2 className="text-sm font-semibold text-foreground">Membership status mix</h2><p className="mt-1 text-xs text-muted-foreground">Current state of all active member profiles.</p></div>
          <div className="grid items-center gap-4 sm:grid-cols-2">
            <ResponsiveContainer width="100%" height={210}><PieChart><Pie data={membershipStatus} dataKey="count" nameKey="status" innerRadius={52} outerRadius={78} paddingAngle={3}>{membershipStatus.map((entry: any) => <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || "#64748b"} />)}</Pie><Tooltip content={<ReportTooltip />} /></PieChart></ResponsiveContainer>
            <div className="space-y-3">{membershipStatus.map((entry: any) => <div key={entry.status} className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[entry.status] || "#64748b" }} /><span className="text-xs capitalize text-muted-foreground">{entry.status}</span></div><span className="text-xs font-semibold text-foreground">{entry.count.toLocaleString()}</span></div>)}{!membershipStatus.length && <p className="text-xs text-muted-foreground">No membership data available.</p>}</div>
          </div>
        </motion.section>
      </div>

      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-5 rounded-2xl border border-border bg-card p-5">
        <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-sm font-semibold text-foreground">Capacity utilization</h2><p className="mt-1 text-xs text-muted-foreground">Upcoming classes ranked by enrolled-to-capacity ratio.</p></div><Link to="/admin/classes" className="text-xs font-semibold text-primary hover:underline">Manage schedules</Link></div>
        <div className="space-y-4">{capacityUtilization.map((item: any) => <div key={item.id}><div className="mb-1.5 flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate text-xs font-semibold text-foreground">{item.name}</p><p className="text-[10px] text-muted-foreground">{item.schedule ? new Date(item.schedule).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Upcoming session"}</p></div><span className="shrink-0 text-xs font-semibold text-foreground">{item.enrolled}/{item.capacity} · {item.utilization.toFixed(1)}%</span></div><div className="h-2 overflow-hidden rounded-full bg-border"><div className={`h-full rounded-full transition-all ${item.utilization >= 90 ? "bg-red-400" : item.utilization >= 70 ? "bg-amber-400" : "bg-primary"}`} style={{ width: `${Math.min(100, item.utilization)}%` }} /></div></div>)}{!capacityUtilization.length && <div className="py-10 text-center text-xs text-muted-foreground">No upcoming class capacity data available.</div>}</div>
      </motion.section>

      <div className="grid gap-5 lg:grid-cols-2">
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-5"><div className="mb-4"><h2 className="text-sm font-semibold text-foreground">Payment health</h2><p className="mt-1 text-xs text-muted-foreground">Transaction count and value by payment state.</p></div><div className="space-y-3">{paymentStatus.map((entry: any) => <div key={entry.status} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/30 px-3 py-2.5"><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[entry.status] || "#64748b" }} /><span className="text-xs capitalize text-muted-foreground">{entry.status}</span></div><div className="text-right"><p className="text-xs font-semibold text-foreground">{entry.count.toLocaleString()} transactions</p><p className="text-[10px] text-muted-foreground">{formatCurrency(entry.amount)}</p></div></div>)}{!paymentStatus.length && <p className="text-xs text-muted-foreground">No payment data available.</p>}</div></motion.section>
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="rounded-2xl border border-border bg-card p-5"><div className="mb-4"><h2 className="text-sm font-semibold text-foreground">Booking outcomes</h2><p className="mt-1 text-xs text-muted-foreground">Distribution of booking states across the platform.</p></div><div className="space-y-3">{bookingStatus.map((entry: any) => <div key={entry.status} className="flex items-center justify-between rounded-xl border border-border/60 bg-background/30 px-3 py-3"><div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /><span className="text-xs capitalize text-muted-foreground">{entry.status}</span></div><span className="text-sm font-semibold text-foreground">{entry.count.toLocaleString()}</span></div>)}{!bookingStatus.length && <p className="text-xs text-muted-foreground">No booking data available.</p>}</div></motion.section>
      </div>
    </DashboardLayout>
  );
};

export default AdminAnalytics;
