import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import {
  Users, DollarSign, Calendar, ArrowRight,
  UserCheck, Activity, Loader2
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import { format } from "date-fns";
import { useAdmin } from "@/hooks/api/useAdmin";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-xl">
      <p className="text-xs font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="text-xs">
          <span className="font-semibold text-primary">
            {typeof p.value === "number" && p.name === "revenue" ? `KES ${p.value.toLocaleString()}` : p.value}
          </span>{" "}
          <span className="text-muted-foreground">{p.name}</span>
        </p>
      ))}
    </div>
  );
};

const AdminDashboard = () => {
  const { useStats } = useAdmin();
  const { data: stats, isLoading } = useStats();

  if (isLoading) {
    return (
      <DashboardLayout title="Admin Overview" subtitle="Real-time gym performance metrics">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
          <p className="text-sm text-muted-foreground">Loading dashboard data...</p>
        </div>
      </DashboardLayout>
    );
  }

  const recentMembers = stats?.recentMembers || [];
  const recentPayments = stats?.recentPayments || [];

  return (
    <DashboardLayout title="Admin Overview" subtitle="Real-time gym performance metrics">

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Members" value={stats?.totalMembers?.toLocaleString() || "0"}
          icon={Users} accent index={0} />
        <StatCard title="Monthly Revenue" value={`KES ${stats?.monthlyRevenue?.toLocaleString() || "0"}`}
          subtitle={format(new Date(), "MMMM yyyy")} icon={DollarSign} index={1} />
        <StatCard title="Active Members" value={stats?.activeMembers?.toLocaleString() || "0"}
          subtitle="Member retention" icon={UserCheck} index={2} />
        <StatCard title="Avg Attendance" value={`${stats?.attendanceRate ?? 0}%`} subtitle="Class fill rate" icon={Activity} index={3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-2 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Revenue Trend</h3>
              <p className="text-xs text-muted-foreground">Last 6 months (Historical data in KES)</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-foreground">KES {stats?.monthlyRevenue?.toLocaleString() || "0"}</p>
              <p className="text-xs text-emerald-400">Current Month</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={stats?.revenueTrend || []}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(84 81% 44%)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="hsl(84 81% 44%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 16%)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "hsl(0 0% 64%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(0 0% 64%)", fontSize: 11 }} axisLine={false} tickLine={false} width={55}
                tickFormatter={(v) => `KES ${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(84 81% 44%)" strokeWidth={2} fill="url(#revenueGrad)" name="revenue" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-1">Plan Distribution</h3>
          <p className="text-xs text-muted-foreground mb-4">Membership breakdown</p>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={stats?.planDistribution || []} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                {(stats?.planDistribution || []).map((entry: any, i: number) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip content={({ active, payload }) => active && payload?.length ? (
                <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-xl">
                  <p className="text-xs font-semibold text-foreground">{payload[0].name}</p>
                  <p className="text-xs text-muted-foreground">{payload[0].value} members</p>
                </div>
              ) : null} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {(stats?.planDistribution || []).map((p: any) => (
              <div key={p.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-xs text-muted-foreground">{p.name}</span>
                </div>
                <span className="text-xs font-medium text-foreground">{p.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border/40">
            <h3 className="text-sm font-semibold text-foreground">Recent Members</h3>
            <Link to="/admin/members" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-border/40">
            {recentMembers.map((m: any) => (
              <div key={m.id} className="flex items-center gap-3 p-4 hover:bg-accent/10 transition-colors">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {m.fullName?.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{m.fullName}</p>
                  <p className="text-xs text-muted-foreground capitalize">{m.plan} · {m.joinedAt ? format(new Date(m.joinedAt), "MMM d, yyyy") : ""}</p>
                </div>
                <div className="text-right">
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Active</span>
                </div>
              </div>
            ))}
            {recentMembers.length === 0 && (
              <div className="p-8 text-center text-xs text-muted-foreground">No recent members found.</div>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border/40">
            <h3 className="text-sm font-semibold text-foreground">Recent Payments</h3>
            <Link to="/admin/payments" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-border/40">
            {recentPayments.map((p: any) => (
              <div key={p.id} className="flex items-center gap-3 p-4 hover:bg-accent/10 transition-colors">
                <div className="h-9 w-9 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-foreground uppercase">{p.plan}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">{p.paystackReference || p.paystack_reference}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-foreground">KES {parseFloat(p.amount).toLocaleString()}</p>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 uppercase">{p.status || "Success"}</span>
                </div>
              </div>
            ))}
            {recentPayments.length === 0 && (
              <div className="p-8 text-center text-xs text-muted-foreground">No recent payments found.</div>
            )}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
