import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts';
import {
  DollarSign, TrendingUp, CheckCircle, XCircle, Clock,
  Download, Search, RefreshCw, ExternalLink, Loader2,
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import StatCard from '@/components/dashboard/StatCard';
import { api } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';
import { usePayments } from '@/hooks/api/usePayments';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  paid: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Paid' },
  pending: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'Pending' },
  failed: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Failed' },
  abandoned: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Abandoned' },
};

const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
}[character] || character));

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-xl">
      <p className="text-xs font-semibold text-foreground mb-1">{label}</p>
      {payload.map((point: any) => (
        <p key={point.name} className="text-xs text-muted-foreground">
          <span className="font-semibold text-primary">KES {Number(point.value || 0).toLocaleString()}</span> {point.name}
        </p>
      ))}
    </div>
  );
};

const AdminPayments = () => {
  const { getToken } = useAuth();
  const { useAdminPayments, useRetryPayment, useRemindPayment } = usePayments();
  const { data, isLoading, isError, error, refetch } = useAdminPayments();
  const retryPayment = useRetryPayment();
  const remindPayment = useRemindPayment();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'failed'>('all');
  const [planFilter, setPlanFilter] = useState('all');

  const payments = data?.payments || [];
  const summary = data?.summary || { totalRevenue: 0, monthlyRevenue: 0, pendingRevenue: 0, pendingCount: 0, failedCount: 0 };
  const filtered = useMemo(() => payments.filter((payment: any) => {
    const status = payment.status === 'abandoned' ? 'failed' : payment.status;
    if (statusFilter !== 'all' && status !== statusFilter) return false;
    if (planFilter !== 'all' && !String(payment.plan || '').toLowerCase().includes(planFilter)) return false;
    const query = search.trim().toLowerCase();
    return !query || String(payment.memberName || '').toLowerCase().includes(query) || String(payment.reference || '').toLowerCase().includes(query);
  }), [payments, statusFilter, planFilter, search]);

  const handleExport = () => {
    const headers = ['Date', 'Member', 'Email', 'Plan', 'Amount', 'Currency', 'Status', 'Reference'];
    const rows = filtered.map((payment: any) => [
      payment.createdAt ? new Date(payment.createdAt).toISOString() : '',
      payment.memberName || '', payment.memberEmail || '', payment.plan || '',
      payment.amount || 0, payment.currency || 'KES', payment.status || '', payment.reference || '',
    ]);
    const csv = [headers, ...rows].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `optizgym-payments-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleReceipt = async (paymentId: string) => {
    try {
      const receipt = await api.payments.getReceipt(paymentId, await getToken());
      const receiptWindow = window.open('', '_blank', 'noopener,noreferrer');
      if (!receiptWindow) throw new Error('Please allow pop-ups to view the receipt');
      receiptWindow.document.write(`<!doctype html><html><head><title>OptizGYM Receipt</title><style>body{font-family:system-ui;max-width:680px;margin:40px auto;padding:0 24px;color:#111}h1{color:#65a30d}dl{display:grid;grid-template-columns:160px 1fr;gap:10px}dt{font-weight:600}dd{margin:0}</style></head><body><h1>OptizGYM Payment Receipt</h1><dl><dt>Member</dt><dd>${escapeHtml(receipt.fullName)}</dd><dt>Email</dt><dd>${escapeHtml(receipt.email)}</dd><dt>Plan</dt><dd>${escapeHtml(receipt.plan)}</dd><dt>Amount</dt><dd>${escapeHtml(receipt.currency)} ${escapeHtml(receipt.amount)}</dd><dt>Reference</dt><dd>${escapeHtml(receipt.paystackReference || receipt.paystack_reference)}</dd><dt>Paid at</dt><dd>${escapeHtml(receipt.paidAt || receipt.paid_at)}</dd></dl><script>window.print()</script></body></html>`);
      receiptWindow.document.close();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load receipt');
    }
  };

  return (
    <DashboardLayout title="Payments" subtitle="Live transactions, revenue, and billing operations">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20"><Loader2 className="h-8 w-8 text-primary animate-spin mb-4" /><p className="text-sm text-muted-foreground">Loading live payment data...</p></div>
      ) : isError ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center"><p className="text-sm text-destructive mb-2">Unable to load payment data.</p><p className="mb-4 text-xs text-muted-foreground">{error instanceof Error ? error.message : 'The payment API returned an unexpected response.'}</p><button onClick={() => refetch()} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Retry</button></div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard title="Total Revenue" value={`KES ${Number(summary.totalRevenue).toLocaleString()}`} subtitle="All collected" icon={DollarSign} accent index={0} />
            <StatCard title="This Month" value={`KES ${Number(summary.monthlyRevenue).toLocaleString()}`} icon={TrendingUp} subtitle="Paid this month" index={1} />
            <StatCard title="Pending" value={`KES ${Number(summary.pendingRevenue).toLocaleString()}`} subtitle={`${summary.pendingCount} transactions`} icon={Clock} index={2} />
            <StatCard title="Failed" value={summary.failedCount} subtitle="Needs attention" icon={XCircle} index={3} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
            <motion.div className="rounded-2xl border border-border bg-card p-5" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <h3 className="text-sm font-semibold text-foreground">Revenue Over Time</h3><p className="text-xs text-muted-foreground mb-4">Verified payments by month</p>
              <ResponsiveContainer width="100%" height={190}><AreaChart data={data?.revenueTrend || []}><defs><linearGradient id="liveRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(84 81% 44%)" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(84 81% 44%)" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 16%)" vertical={false} /><XAxis dataKey="month" tick={{ fill: 'hsl(0 0% 64%)', fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: 'hsl(0 0% 64%)', fontSize: 11 }} axisLine={false} tickLine={false} width={55} tickFormatter={(value) => `KES ${(value / 1000).toFixed(0)}k`} /><Tooltip content={<CustomTooltip />} /><Area type="monotone" dataKey="revenue" stroke="hsl(84 81% 44%)" strokeWidth={2} fill="url(#liveRevenue)" name="revenue" /></AreaChart></ResponsiveContainer>
            </motion.div>
            <motion.div className="rounded-2xl border border-border bg-card p-5" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <h3 className="text-sm font-semibold text-foreground">Revenue by Plan</h3><p className="text-xs text-muted-foreground mb-4">Verified payment contribution</p>
              <ResponsiveContainer width="100%" height={190}><BarChart data={data?.revenueByPlan || []} layout="vertical" barSize={18}><CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 16%)" horizontal={false} /><XAxis type="number" tick={{ fill: 'hsl(0 0% 64%)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(value) => `KES ${(value / 1000).toFixed(0)}k`} /><YAxis dataKey="plan" type="category" tick={{ fill: 'hsl(0 0% 64%)', fontSize: 11 }} axisLine={false} tickLine={false} width={65} /><Tooltip content={<CustomTooltip />} /><Bar dataKey="revenue" fill="hsl(84 81% 44%)" radius={[0, 5, 5, 0]} name="revenue" /></BarChart></ResponsiveContainer>
            </motion.div>
          </div>

          <div className="mb-4 flex flex-col lg:flex-row gap-3"><div className="relative flex-1 max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search member or reference…" className="w-full rounded-lg border border-border bg-card pl-9 pr-4 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none" /></div><div className="flex gap-2 flex-wrap">{(['all', 'paid', 'pending', 'failed'] as const).map((status) => <button key={status} onClick={() => setStatusFilter(status)} className={cn('rounded-lg px-3 py-2 text-xs font-medium capitalize transition-all', statusFilter === status ? 'bg-primary text-primary-foreground' : 'border border-border bg-card text-muted-foreground hover:text-foreground')}>{status}</button>)}{['all', 'basic', 'pro', 'elite'].map((plan) => <button key={plan} onClick={() => setPlanFilter(plan)} className={cn('rounded-lg px-3 py-2 text-xs font-medium capitalize transition-all', planFilter === plan ? 'bg-primary/20 text-primary border border-primary/30' : 'border border-border bg-card text-muted-foreground hover:text-foreground')}>{plan}</button>)}<button onClick={handleExport} className="ml-auto flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"><Download className="h-3.5 w-3.5" /> Export CSV</button></div></div>

          <div className="rounded-2xl border border-border bg-card overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border bg-card/60">{['Member', 'Plan', 'Amount', 'Date', 'Reference', 'Status', 'Action'].map((heading) => <th key={heading} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{heading}</th>)}</tr></thead><tbody className="divide-y divide-border/40">{filtered.slice(0, 100).map((payment: any) => { const status = STATUS_CONFIG[payment.status] || STATUS_CONFIG.pending; const StatusIcon = status.icon; return <tr key={payment.id} className="hover:bg-accent/20"><td className="px-4 py-3"><p className="text-xs font-medium text-foreground">{payment.memberName || 'Unknown member'}</p><p className="text-[10px] text-muted-foreground">{payment.memberEmail}</p></td><td className="px-4 py-3 text-xs text-muted-foreground">{payment.plan}</td><td className="px-4 py-3 text-sm font-semibold text-foreground">KES {Number(payment.amount || 0).toLocaleString()}</td><td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : '—'}</td><td className="px-4 py-3"><span className="text-xs font-mono text-muted-foreground">{payment.reference || '—'}</span><ExternalLink className="inline ml-1 h-3 w-3 text-muted-foreground/30" /></td><td className="px-4 py-3"><div className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', status.bg, status.color)}><StatusIcon className="h-3 w-3" />{status.label}</div></td><td className="px-4 py-3"><div className="flex justify-end gap-1">{payment.status === 'paid' ? <button onClick={() => handleReceipt(payment.id)} title="View receipt" className="rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"><Download className="h-3 w-3" /></button> : payment.status === 'failed' || payment.status === 'abandoned' ? <button onClick={() => retryPayment.mutate(payment.id)} disabled={retryPayment.isPending} className="flex items-center gap-1 rounded-lg bg-red-500/10 border border-red-500/20 px-2 py-1 text-xs text-red-400">{retryPayment.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />} Retry</button> : <button onClick={() => remindPayment.mutate(payment.id)} disabled={remindPayment.isPending} className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-2 py-1 text-xs text-amber-400">Remind</button>}</div></td></tr>; })}</tbody></table>{filtered.length === 0 && <div className="py-16 text-center"><p className="text-sm text-muted-foreground">No transactions found.</p></div>}</div><div className="border-t border-border px-5 py-3 flex items-center justify-between"><p className="text-xs text-muted-foreground">Showing {Math.min(100, filtered.length)} of {filtered.length} transactions</p><p className="text-xs font-medium text-foreground">Verified total: <span className="text-primary">KES {filtered.filter((payment: any) => payment.status === 'paid').reduce((total: number, payment: any) => total + Number(payment.amount || 0), 0).toLocaleString()}</span></p></div></div>
        </>
      )}
    </DashboardLayout>
  );
};

export default AdminPayments;
