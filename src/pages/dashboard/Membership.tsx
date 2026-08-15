import { useState } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { useMembers } from "@/hooks/api/useMembers";
import { usePayments } from "@/hooks/api/usePayments";
import {
  CheckCircle, Zap, Crown, Shield,
  CreditCard, RefreshCw, X, AlertTriangle, Calendar,
  Star, TrendingUp, Lock,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { initializePaystackPayment, PLAN_PRICES } from "@/lib/paystack";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const PLANS = [
  {
    id: "free" as const,
    name: "Free",
    icon: Lock,
    color: "border-border",
    iconBg: "bg-muted",
    iconColor: "text-muted-foreground",
    badge: null,
    badgeColor: "",
    description: "Basic access for those just starting out.",
    features: ["Limited class viewing", "No bookings", "Basic profile tracking"],
    missing: ["Gym floor access", "Group classes", "Personal training", "24/7 access"],
  },
  {
    id: "basic" as const,
    name: "Basic",
    icon: Shield,
    color: "border-border",
    iconBg: "bg-muted",
    iconColor: "text-muted-foreground",
    badge: null,
    badgeColor: "",
    description: "Essential access for your daily workout needs.",
    features: ["Gym floor access (staffed hours)", "Locker rooms & showers", "Free Wi-Fi", "Standard equipment"],
    missing: ["24/7 access", "Group classes", "Sauna & steam room", "Personal training"],
  },
  {
    id: "pro" as const,
    name: "Pro",
    icon: Zap,
    color: "border-primary/50",
    iconBg: "bg-primary/15",
    iconColor: "text-primary",
    badge: "Most Popular",
    badgeColor: "bg-primary text-primary-foreground",
    description: "Everything you need to level up faster.",
    features: ["24/7 Unlimited gym access", "Unlimited group classes", "Sauna & steam room", "2 guest passes/month", "Priority class booking"],
    missing: ["Personal training sessions", "Nutrition consultation"],
  },
  {
    id: "elite" as const,
    name: "Elite",
    icon: Crown,
    color: "border-cyan-500/40",
    iconBg: "bg-cyan-500/15",
    iconColor: "text-cyan-400",
    badge: "Best Results",
    badgeColor: "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30",
    description: "Maximum results with personal guidance.",
    features: ["Everything in Pro", "4 personal trainer sessions/month", "Custom nutrition guide", "Premium towel service", "Private locker", "Guest passes (5/month)"],
    missing: [],
  },
];

type BillingCycle = "monthly" | "yearly";

const Membership = () => {
  const [searchParams] = useSearchParams();
  const requiresActivePlan = searchParams.get('required') === 'active';
  const { user, refreshUser } = useAuth();
  const { useMe, useUpdateMembership } = useMembers();
  const { useVerifyPayment } = usePayments();
  const { data: memberData } = useMe();
  const verifyPayment = useVerifyPayment();
  const updateMembership = useUpdateMembership();

  const [billing, setBilling] = useState<BillingCycle>(user?.planBilling || "monthly");
  const [processing, setProcessing] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [freezeMonths, setFreezeMonths] = useState(1);

  const currentPlan = memberData?.plan || user?.plan || "free";
  const renewalDate = user?.expiresAt
    ? new Date(user.expiresAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : memberData?.expiresAt
      ? new Date(memberData.expiresAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
      : user?.membershipStatus === 'active' ? "Next Billing Cycle" : "N/A";

  const handleUpgrade = (planId: "free" | "basic" | "pro" | "elite") => {
    if (planId === currentPlan || planId === 'free') return;
    setProcessing(planId);
    const amount = PLAN_PRICES[planId][billing];
    try {
      initializePaystackPayment({
      email: user?.email || "",
      amount,
      metadata: {
        plan: planId,
        billing,
        userId: user?.id,
        auth_user_id: user?.authId,
        type: user?.plan === 'free' ? 'subscription' : 'upgrade'
      },
      onSuccess: async (ref) => {
        try {
          await verifyPayment.mutateAsync({ reference: ref, plan: planId, billing, amount });
          await refreshUser();
        } finally {
          setProcessing(null);
        }
      },
      onClose: () => {
        setProcessing(null);
        toast.info("Payment cancelled.");
      },
      });
    } catch (error) {
      setProcessing(null);
      toast.error(error instanceof Error ? error.message : 'Unable to open Paystack checkout');
    }
  };
  const joinDate = user?.memberSince
    ? new Date(user.memberSince).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "—";

  return (
    <DashboardLayout title="My Membership" subtitle="Manage your plan, billing, and subscription settings">
      {requiresActivePlan && (
        <div className="mb-6 rounded-xl border border-primary/30 bg-primary/10 p-4">
          <p className="text-sm font-semibold text-foreground">An active paid plan is required for dashboard training content.</p>
          <p className="mt-1 text-xs text-muted-foreground">Choose a plan below to unlock your dashboard, class booking, workouts, and progress tracking.</p>
        </div>
      )}

      {/* Current Status */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="mb-8 rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 border border-primary/30">
              <Star className="h-7 w-7 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-foreground capitalize">{user?.plan} Plan</h2>
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider",
                  user?.membershipStatus === "active" ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
                )}>
                  {user?.membershipStatus === "active" ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Billed <span className="text-foreground font-medium capitalize">{user?.planBilling}</span> · {renewalDate}
              </p>
            </div>
          </div>
          <div className="sm:ml-auto flex flex-wrap gap-3">
            <div className="rounded-xl bg-card/80 border border-border px-4 py-3 text-center min-w-[90px]">
              <p className="text-xs text-muted-foreground">Member Since</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">{joinDate}</p>
            </div>
            <div className="rounded-xl bg-card/80 border border-border px-4 py-3 text-center min-w-[90px]">
              <p className="text-xs text-muted-foreground">Next Bill</p>
              <p className="text-sm font-semibold text-foreground mt-0.5">
                KES {PLAN_PRICES[user?.plan as keyof typeof PLAN_PRICES]?.[user?.planBilling as BillingCycle] || 0}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Billing toggle */}
      <div className="mb-8 flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">Choose Your Plan</h3>
        <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1">
          {(["monthly", "yearly"] as BillingCycle[]).map((b) => (
            <button key={b} onClick={() => setBilling(b)}
              className={cn("rounded-full px-4 py-1.5 text-xs font-medium capitalize transition-all",
                billing === b ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}>
              {b} {b === "yearly" && <span className="opacity-70">−15%</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {PLANS.map((plan, i) => {
          const price = PLAN_PRICES[plan.id][billing];
          const isCurrent = user?.plan === plan.id;
          const isUpgrade = PLANS.findIndex(p => p.id === plan.id) > PLANS.findIndex(p => p.id === user?.plan);
          const isProcessing = processing === plan.id;
          return (
            <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className={cn("relative rounded-2xl border p-6 flex flex-col transition-all duration-200",
                isCurrent ? "border-primary/50 bg-primary/5 shadow-lg shadow-primary/10" : `${plan.color} bg-card hover:shadow-md`
              )}>
              {plan.badge && (
                <span className={cn("absolute -top-3 left-5 rounded-full px-3 py-0.5 text-xs font-semibold", plan.badgeColor)}>
                  {plan.badge}
                </span>
              )}
              {isCurrent && (
                <span className="absolute -top-3 right-5 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                  Current
                </span>
              )}
              <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl mb-4", plan.iconBg)}>
                <plan.icon className={cn("h-5 w-5", plan.iconColor)} />
              </div>
              <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
              <p className="text-xs text-muted-foreground mt-1 mb-4">{plan.description}</p>
              <div className="mb-5">
                <span className="text-2xl font-extrabold text-foreground">KES {price.toLocaleString()}</span>
                <span className="text-sm text-muted-foreground">/mo</span>
                {billing === "yearly" && (
                  <p className="text-xs text-emerald-400 mt-0.5">Save KES {((PLAN_PRICES[plan.id].monthly * 12) - price).toLocaleString()}/yr</p>
                )}
              </div>
              <ul className="space-y-2.5 mb-5 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[11px] text-muted-foreground leading-tight">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0 mt-0" />{f}
                  </li>
                ))}
                {plan.missing.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[11px] text-muted-foreground/30 leading-tight">
                    <X className="h-3.5 w-3.5 flex-shrink-0 mt-0" />{f}
                  </li>
                ))}
              </ul>
              <button onClick={() => handleUpgrade(plan.id)}
                disabled={isCurrent || isProcessing || plan.id === 'free'}
                className={cn("w-full rounded-xl py-2.5 text-sm font-semibold transition-all flex items-center justify-center gap-2",
                  isCurrent ? "bg-primary/20 text-primary cursor-default"
                    : plan.id === 'free' ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-primary text-primary-foreground hover:brightness-110"
                )}>
                {isProcessing ? (
                  <div className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                ) : isCurrent ? (
                  <><CheckCircle className="h-4 w-4" /> Current Plan</>
                ) : plan.id === 'free' ? (
                  "Restricted"
                ) : isUpgrade ? (
                  "Upgrade Now"
                ) : (
                  "Switch Plan"
                )}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Manage subscription */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="rounded-2xl border border-border bg-card p-6">
        <h3 className="text-base font-semibold text-foreground mb-4">Subscription Management</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: CreditCard, title: "Update Payment Method", desc: "Contact support to update billing details", action: () => { window.location.href = `mailto:${import.meta.env.VITE_SUPPORT_EMAIL || 'support@optizgym.com'}?subject=Update%20payment%20method`; }, variant: "default" },
            { icon: RefreshCw, title: "Freeze Membership", desc: "Pause for up to 3 months", action: () => setShowFreezeModal(true), variant: "default" },
            { icon: X, title: "Cancel Membership", desc: "Access continues until period ends", action: () => setShowCancelModal(true), variant: "danger" },
          ].map(({ icon: Icon, title, desc, action, variant }) => (
            <button key={title} onClick={action}
              className={cn("flex items-start gap-3 rounded-xl border p-4 text-left transition-all hover:shadow-sm",
                variant === "danger" ? "border-destructive/20 hover:border-destructive/40 hover:bg-destructive/5" : "border-border hover:border-primary/30 hover:bg-primary/5"
              )}>
              <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0",
                variant === "danger" ? "bg-destructive/10" : "bg-muted")}>
                <Icon className={cn("h-4 w-4", variant === "danger" ? "text-destructive" : "text-muted-foreground")} />
              </div>
              <div>
                <p className={cn("text-sm font-medium", variant === "danger" ? "text-destructive" : "text-foreground")}>{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Cancel modal */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className="max-w-sm p-6 border-destructive/30 bg-card">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 mb-4">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <DialogHeader className="space-y-2 mb-4">
            <DialogTitle className="text-lg font-bold text-foreground">Cancel Membership?</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Your access will continue until <strong className="text-foreground">{renewalDate}</strong>. After that, you'll lose access to all premium features.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <button onClick={() => setShowCancelModal(false)}
              className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors">
              Keep Membership
            </button>
            <button onClick={() => { updateMembership.mutate({ action: 'cancel' }); setShowCancelModal(false); }}
              className="flex-1 rounded-xl bg-destructive py-2.5 text-sm font-medium text-white hover:brightness-110 transition-all">
              Yes, Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Freeze modal */}
      <Dialog open={showFreezeModal} onOpenChange={setShowFreezeModal}>
        <DialogContent className="max-w-sm p-6 border-border bg-card">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 mb-4">
            <Calendar className="h-6 w-6 text-blue-400" />
          </div>
          <DialogHeader className="space-y-2 mb-4">
            <DialogTitle className="text-lg font-bold text-foreground">Freeze Membership</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Select how many months you'd like to freeze. A maintenance fee of <strong className="text-foreground">$5/month</strong> applies.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2 mb-6">
            {[1, 2, 3].map((m) => (
              <button key={m} onClick={() => setFreezeMonths(m)} className={cn("rounded-xl border bg-background py-3 text-sm font-medium text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all", freezeMonths === m ? "border-primary/50 bg-primary/10" : "border-border")}>
                {m} mo<br /><span className="text-xs text-muted-foreground">${m * 5}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowFreezeModal(false)}
              className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors">
              Cancel
            </button>
            <button onClick={() => { updateMembership.mutate({ action: 'freeze', months: freezeMonths }); setShowFreezeModal(false); }}
              className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all">
              Confirm Freeze
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Membership;
