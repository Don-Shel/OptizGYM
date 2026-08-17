import { useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard, Download, CheckCircle, Clock, XCircle,
  TrendingUp, ArrowRight, ExternalLink, Search, Loader2
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import { initializePaystackPayment, PLAN_PRICES } from "@/lib/paystack";
import { api } from "@/lib/db";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { usePayments } from "@/hooks/api/usePayments";

const STATUS_CONFIG: Record<string, any> = {
  paid: { icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10", label: "Paid" },
  pending: { icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10", label: "Pending" },
  failed: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10", label: "Failed" },
};

const Payments = () => {
  const { user, getToken, refreshUser } = useAuth();
  const { useMemberPayments, useVerifyPayment } = usePayments();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "paid" | "pending" | "failed">("all");
  const [paying, setPaying] = useState(false);
  const verifyPayment = useVerifyPayment();

  const { data: payments = [], isLoading } = useMemberPayments(user?.id);

  const filtered = payments.filter((p: any) => {
    if (filter !== "all" && p.status !== filter) return false;
    const ref = p.paystackReference || p.paystack_reference || "";
    if (search && !ref.toLowerCase().includes(search.toLowerCase()) && !p.plan?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalPaid = payments.filter((p: any) => p.status === "paid").reduce((s: number, p: any) => s + parseFloat(p.amount), 0);
  const pending = payments.filter((p: any) => p.status === "pending");

  const handlePayNow = () => {
    if (!user?.email || user.plan === 'free' || !['basic', 'pro', 'elite'].includes(user.plan)) {
      toast.error("Please select a paid plan in the Membership section first.");
      return;
    }
    const billing = user.planBilling === 'yearly' ? 'yearly' : 'monthly';
    const plan = user.plan as 'basic' | 'pro' | 'elite';
    const amount = PLAN_PRICES[plan][billing];
    setPaying(true);
    try {
      initializePaystackPayment({
        email: user.email,
        amount,
        metadata: {
          type: "renewal",
          userId: user.id,
          auth_user_id: user.authId,
          plan,
          billing,
        },
        onSuccess: async (ref) => {
          try {
            await verifyPayment.mutateAsync({ reference: ref, plan, billing, amount });
            await refreshUser();
            toast.success("Payment verified and membership updated.");
          } catch {
            // The payment hook surfaces the provider or API error.
          } finally {
            setPaying(false);
          }
        },
        onClose: () => {
          setPaying(false);
          toast.info("Payment window closed.");
        },
      });
    } catch (error) {
      setPaying(false);
      toast.error(error instanceof Error ? error.message : "Unable to open payment checkout");
    }
  };

  const handleDownload = async (payment: any) => {
    try {
      const token = await getToken();
      const receipt = await api.payments.getReceipt(payment.id, token!);

      const receiptHtml = `
        <html>
          <head>
            <title>Receipt - ${receipt.paystack_reference}</title>
            <style>
              body { font-family: sans-serif; padding: 40px; color: #333; }
              .header { display: flex; justify-content: space-between; border-bottom: 2px solid #eee; padding-bottom: 20px; }
              .logo { font-size: 24px; font-weight: bold; color: #ff3e00; }
              .receipt-title { font-size: 20px; color: #666; }
              .details { margin: 40px 0; display: grid; grid-template-cols: 1fr 1fr; gap: 20px; }
              .label { font-size: 12px; color: #999; text-transform: uppercase; margin-bottom: 4px; }
              .value { font-size: 16px; font-weight: 500; }
              .table { width: 100%; border-collapse: collapse; margin: 40px 0; }
              .table th { text-align: left; border-bottom: 1px solid #eee; padding: 12px; color: #999; font-size: 12px; text-transform: uppercase; }
              .table td { padding: 12px; border-bottom: 1px solid #eee; }
              .total { text-align: right; font-size: 24px; font-weight: bold; margin-top: 20px; }
              .footer { margin-top: 60px; text-align: center; color: #999; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo">OPTIBIZ GYM</div>
              <div class="receipt-title">PAYMENT RECEIPT</div>
            </div>

            <div class="details">
              <div>
                <div class="label">Customer</div>
                <div class="value">${receipt.full_name || 'Valued Member'}</div>
                <div class="value">${receipt.email}</div>
              </div>
              <div style="text-align: right">
                <div class="label">Date</div>
                <div class="value">${new Date(receipt.paid_at).toLocaleDateString()}</div>
                <div class="label" style="margin-top: 15px">Reference</div>
                <div class="value">${receipt.paystack_reference}</div>
              </div>
            </div>

            <table class="table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th style="text-align: right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${receipt.plan.toUpperCase()} Membership Subscription</td>
                  <td style="text-align: right">KES ${parseFloat(receipt.amount).toLocaleString()}</td>
                </tr>
              </tbody>
            </table>

            <div class="total">
              <span style="font-size: 14px; color: #999; font-weight: normal; margin-right: 10px">TOTAL PAID</span>
              KES ${parseFloat(receipt.amount).toLocaleString()}
            </div>

            <div class="footer">
              <p>Thank you for choosing Optibiz Gym!</p>
              <p>This is a computer-generated receipt. No signature required.</p>
            </div>

            <script>window.print();</script>
          </body>
        </html>
      `;

      const win = window.open('', '_blank');
      win?.document.write(receiptHtml);
      win?.document.close();

      toast.success("Receipt generated successfully.");
    } catch (error) {
      console.error("Error generating receipt:", error);
      toast.error("Failed to generate receipt.");
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Payment History" subtitle="Track your billing and transactions">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
          <p className="text-sm text-muted-foreground">Loading payments...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Payment History" subtitle="Track your billing and transactions">

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Paid" value={`KES ${totalPaid.toLocaleString()}`} subtitle="Lifetime payments" icon={CreditCard} accent index={0} />
        <StatCard title="Recent" value={payments[0] ? `KES ${parseFloat(payments[0].amount).toLocaleString()}` : "N/A"} subtitle="Most recent charge" icon={TrendingUp} index={1} />
        <StatCard title="Success" value={payments.filter((p: any) => p.status === "paid").length} subtitle="Successful transactions" icon={CheckCircle} index={2} />
        <StatCard title="Pending" value={pending.length} subtitle="Awaiting payment" icon={Clock} index={3} />
      </div>

      {pending.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">You have a pending payment</p>
              <p className="text-xs text-muted-foreground">Complete your payment to maintain uninterrupted access.</p>
            </div>
          </div>
          <button onClick={handlePayNow} disabled={paying}
            className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-white hover:brightness-110 transition-all flex-shrink-0 disabled:opacity-60">
            {paying ? <div className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <>Pay Now <ArrowRight className="h-3 w-3" /></>}
          </button>
        </motion.div>
      )}

      <div className="mb-5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by reference or plan…"
            className="w-full rounded-lg border border-border bg-card pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none" />
        </div>
        <div className="flex gap-2">
          {(["all", "paid", "pending", "failed"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn("rounded-lg px-3 py-2 text-xs font-medium capitalize transition-all",
                filter === f ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted-foreground hover:text-foreground"
              )}>{f}</button>
          ))}
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3 border-b border-border bg-card/60">
          {["Plan", "Date", "Amount", "Status", "Action"].map((h) => (
            <span key={h} className="text-xs font-semibold text-muted-foreground uppercase tracking-wider last:text-right">{h}</span>
          ))}
        </div>
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <CreditCard className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No payments found.</p>
          </div>
        ) : (
          filtered.map((payment: any, i: number) => {
            const status = STATUS_CONFIG[payment.status] || STATUS_CONFIG.pending;
            const StatusIcon = status.icon;
            return (
              <motion.div key={payment.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center px-5 py-4 border-b border-border/50 last:border-0 hover:bg-accent/30 transition-colors">
                <div>
                  <p className="text-sm font-medium text-foreground capitalize">{payment.plan}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-xs text-muted-foreground font-mono">{payment.paystackReference || payment.paystack_reference}</span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground/40" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground whitespace-nowrap">
                  {new Date(payment.paidAt || payment.paid_at || payment.createdAt || payment.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
                <p className="text-sm font-semibold text-foreground">KES {parseFloat(payment.amount).toLocaleString()}</p>
                <div className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium w-fit", status.bg, status.color)}>
                  <StatusIcon className="h-3 w-3" />{status.label}
                </div>
                <div className="flex justify-end">
                  {payment.status === "paid" ? (
                    <button onClick={() => handleDownload(payment)}
                      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all">
                      <Download className="h-3 w-3" /> Receipt
                    </button>
                  ) : (
                    <button onClick={handlePayNow}
                      className="flex items-center gap-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/30 transition-all">
                      Retry
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="mt-6 rounded-2xl border border-border bg-card p-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Payment Method</p>
            <p className="text-xs text-muted-foreground">Secured via Paystack · •••• •••• •••• 4242</p>
          </div>
        </div>
        <button onClick={handlePayNow} disabled={paying || verifyPayment.isPending}
          className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:border-primary/30 hover:text-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-60">
          {paying || verifyPayment.isPending ? "Opening…" : "Update Card"}
        </button>
      </motion.div>
    </DashboardLayout>
  );
};

export default Payments;
