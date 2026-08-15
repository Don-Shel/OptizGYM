import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Dumbbell, Calendar, CreditCard, Flame, TrendingUp,
  ArrowRight, Clock, CheckCircle, Star,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import { useAuth } from "@/contexts/AuthContext";
import { useBookings } from "@/hooks/api/useBookings";
import { useWorkouts } from "@/hooks/api/useWorkouts";
import { usePayments } from "@/hooks/api/usePayments";
import { Skeleton } from "@/components/ui/skeleton";

const PLAN_COLORS: Record<string, string> = {
  basic: "text-muted-foreground border-muted",
  pro: "text-primary border-primary/40",
  elite: "text-cyan-400 border-cyan-400/40",
};

const MemberDashboard = () => {
  const { user } = useAuth();
  const { useMemberBookings } = useBookings();
  const { useMemberWorkouts } = useWorkouts();
  const { useMemberPayments } = usePayments();

  const { data: bookings = [], isLoading: isBookingsLoading } = useMemberBookings(user?.id);
  const { data: workouts = [], isLoading: isWorkoutsLoading } = useMemberWorkouts(user?.id);
  const { data: payments = [], isLoading: isPaymentsLoading } = useMemberPayments(user?.id);

  const isLoading = isBookingsLoading || isWorkoutsLoading || isPaymentsLoading;

  const upcomingClasses = bookings
    .filter((booking: any) => booking.status === 'confirmed' && booking.schedule && new Date(booking.schedule) >= new Date())
    .sort((a: any, b: any) => new Date(a.schedule).getTime() - new Date(b.schedule).getTime())
    .slice(0, 3);
  const recentWorkouts = workouts.slice(0, 3);
  const lastPayment = payments[0] || { plan: "No plan", amount: 0, createdAt: null, created_at: null, paystackReference: "-", paystack_reference: "-" };

  const totalCalories = workouts.reduce((s: number, w: any) => s + (w.caloriesBurned || w.calories_burned || 0), 0);
  const totalWorkouts = workouts.length;
  const totalMinutes = workouts.reduce((s: number, w: any) => s + (w.durationMinutes || w.duration_minutes || 0), 0);

  return (
    <DashboardLayout title={`Welcome back, ${user?.fullName?.split(" ")[0]}!`} subtitle="Here's your fitness overview">
      {/* Membership Banner */}
      <div className={`mb-6 rounded-xl border bg-gradient-to-r from-card to-card/50 p-4 flex items-center justify-between ${PLAN_COLORS[user?.plan || "basic"]}`}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Star className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground capitalize">{user?.plan} Membership</p>
            <p className="text-xs text-muted-foreground">
              {user?.membershipStatus === "active" ? `Active · Joined ${new Date(user?.memberSince || "").toLocaleDateString()}` : "Membership inactive"}
            </p>
          </div>
        </div>
        <Link to="/dashboard/membership" className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
          Manage <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl border border-border bg-card p-5 animate-pulse">
              <div className="h-10 w-10 rounded-xl bg-muted mb-4" />
              <div className="h-4 w-20 bg-muted mb-2 rounded" />
              <div className="h-6 w-12 bg-muted rounded" />
            </div>
          ))
        ) : (
          <>
            <StatCard title="Workouts" value={totalWorkouts} subtitle="This month" icon={Dumbbell} trend={{ value: 12, label: "vs last month" }} index={0} />
            <StatCard title="Calories Burned" value={`${totalCalories.toLocaleString()}`} subtitle="Total logged" icon={Flame} accent index={1} />
            <StatCard title="Minutes Trained" value={totalMinutes} subtitle="Active minutes" icon={Clock} trend={{ value: 8, label: "vs last month" }} index={2} />
            <StatCard title="Classes Booked" value={bookings.filter((booking: any) => booking.status === 'confirmed' && booking.bookedAt && new Date(booking.bookedAt).getMonth() === new Date().getMonth()).length} subtitle="This month" icon={Calendar} index={3} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Classes */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="lg:col-span-2 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Upcoming Classes</h2>
            <Link to="/dashboard/classes" className="text-xs text-primary hover:underline flex items-center gap-1">
              Book a class <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 rounded-lg border border-border/50 bg-background/50 p-3 animate-pulse">
                  <div className="h-10 w-10 rounded-xl bg-muted flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-muted rounded" />
                    <div className="h-3 w-24 bg-muted rounded" />
                  </div>
                  <div className="h-4 w-16 bg-muted rounded" />
                </div>
              ))
            ) : upcomingClasses.length > 0 ? (
              upcomingClasses.map((cls: any, i: number) => (
                <motion.div key={cls.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.07 }}
                  className="flex items-center gap-4 rounded-lg border border-border/50 bg-background/50 p-3 hover:border-primary/20 transition-colors">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Dumbbell className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{cls.className}</p>
                    <p className="text-xs text-muted-foreground">{cls.instructor || 'Staff'} · {cls.durationMinutes ?? '—'}min</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-foreground">{new Date(cls.schedule).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(cls.schedule).toLocaleDateString([], { weekday: 'short' })}</p>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-6 bg-background/30 rounded-lg border border-dashed border-border">
                <p className="text-xs text-muted-foreground">No upcoming classes scheduled.</p>
              </div>
            )}
          </div>
        </motion.div>

        <div className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Book Class", icon: Calendar, to: "/dashboard/classes" },
                { label: "Log Workout", icon: Dumbbell, to: "/dashboard/progress" },
                { label: "Pay Dues", icon: CreditCard, to: "/dashboard/payments" },
                { label: "My Progress", icon: TrendingUp, to: "/dashboard/progress" },
              ].map((a) => (
                <Link key={a.label} to={a.to}
                  className="flex flex-col items-center gap-2 rounded-lg border border-border bg-background/50 p-3 hover:border-primary/30 hover:bg-primary/5 transition-all group">
                  <a.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors text-center">{a.label}</span>
                </Link>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-foreground">Recent Workouts</h2>
              <Link to="/dashboard/progress" className="text-xs text-primary hover:underline">View all</Link>
            </div>
            <div className="space-y-2.5">
              {recentWorkouts.map((w: any) => (
                <div key={w.id} className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">{w.notes || "Strength Training"}</p>
                    <p className="text-xs text-muted-foreground">{new Date(w.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-foreground">{w.durationMinutes ?? w.duration_minutes}m</p>
                    <p className="text-xs text-muted-foreground">{w.caloriesBurned ?? w.calories_burned} cal</p>
                  </div>
                </div>
              ))}
              {recentWorkouts.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No recent workouts.</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
        className="mt-6 rounded-xl border border-border bg-card p-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Last Payment</p>
          <p className="text-sm font-semibold text-foreground mt-0.5">{lastPayment.plan} — ${lastPayment.amount}</p>
          <p className="text-xs text-muted-foreground">
            {(lastPayment.createdAt || lastPayment.created_at) ? new Date(lastPayment.createdAt || lastPayment.created_at).toLocaleDateString() : "-"} · {lastPayment.paystackReference || lastPayment.paystack_reference || "-"}
          </p>
        </div>
        <Link to="/dashboard/payments"
          className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-xs font-medium text-foreground hover:border-primary/40 hover:text-primary transition-colors">
          Payment History <ArrowRight className="h-3 w-3" />
        </Link>
      </motion.div>
    </DashboardLayout>
  );
};

export default MemberDashboard;
