import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from "recharts";
import {
  Dumbbell, Flame, Clock, TrendingUp, Plus, X, ChevronDown, ChevronUp, Calendar,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useAuth } from "@/contexts/AuthContext";
import { useWorkouts } from "@/hooks/api/useWorkouts";
import { Loader2 } from "lucide-react";

const WORKOUT_TYPES = ["Strength", "HIIT Cardio", "Upper Body", "Lower Body", "Yoga", "Cardio", "Cycling", "Boxing", "Core", "Flexibility"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-xl">
      <p className="text-xs font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="text-xs text-muted-foreground">
          <span className="font-medium text-primary">{p.value}</span> {p.name}
        </p>
      ))}
    </div>
  );
};

const TYPE_COLORS: Record<string, string> = {
  Strength: "bg-primary/10 text-primary",
  "HIIT Cardio": "bg-orange-500/10 text-orange-400",
  "Upper Body": "bg-blue-500/10 text-blue-400",
  Yoga: "bg-teal-500/10 text-teal-400",
  Cardio: "bg-orange-500/10 text-orange-400",
  default: "bg-muted text-muted-foreground",
};

const Progress = () => {
  const { user } = useAuth();
  const { useMemberWorkouts, useCreateWorkout } = useWorkouts();
  const { data: logs = [], isLoading } = useMemberWorkouts(user?.id);
  const workoutMutation = useCreateWorkout();

  const [expanded, setExpanded] = useState<string | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [newLog, setNewLog] = useState({ type: "Strength", duration: "", calories: "", notes: "" });
  const [chartView, setChartView] = useState<"calories" | "duration">("calories");

  const weeklyData = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 6);
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      const key = day.toISOString().slice(0, 10);
      const dayLogs = logs.filter((log: any) => String(log.date).slice(0, 10) === key);
      return {
        day: day.toLocaleDateString(undefined, { weekday: 'short' }),
        calories: dayLogs.reduce((total: number, log: any) => total + Number(log.caloriesBurned ?? log.calories_burned ?? 0), 0),
        duration: dayLogs.reduce((total: number, log: any) => total + Number(log.durationMinutes ?? log.duration_minutes ?? 0), 0),
      };
    });
  }, [logs]);

  const monthlyProgress = useMemo(() => {
    const month = new Date();
    const weeks = Array.from({ length: 5 }, (_, index) => ({ week: `W${index + 1}`, workouts: 0, calories: 0 }));
    logs.forEach((log: any) => {
      const date = new Date(log.date);
      if (date.getFullYear() !== month.getFullYear() || date.getMonth() !== month.getMonth()) return;
      const weekIndex = Math.min(4, Math.floor((date.getDate() - 1) / 7));
      weeks[weekIndex].workouts += 1;
      weeks[weekIndex].calories += Number(log.caloriesBurned ?? log.calories_burned ?? 0);
    });
    return weeks;
  }, [logs]);

  const totalCalories = logs.reduce((s: number, w: any) => s + (w.caloriesBurned || w.calories_burned || w.calories || 0), 0);
  const totalMinutes = logs.reduce((s: number, w: any) => s + (w.durationMinutes || w.duration_minutes || w.duration || 0), 0);
  const avgCalories = logs.length > 0 ? Math.round(totalCalories / logs.length) : 0;

  const handleAddLog = () => {
    if (!newLog.duration || !newLog.calories) { toast.error("Please fill in duration and calories."); return; }

    workoutMutation.mutate({
      member_id: user?.id,
      date: new Date().toISOString().split("T")[0],
      type: newLog.type,
      duration_minutes: parseInt(newLog.duration),
      calories_burned: parseInt(newLog.calories),
      notes: newLog.notes,
      exercises: [],
    }, {
      onSuccess: () => {
        setNewLog({ type: "Strength", duration: "", calories: "", notes: "" });
        setShowLogModal(false);
      }
    });
  };

  return (
    <DashboardLayout title="Workout Progress" subtitle="Log workouts and visualize your fitness journey">

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
            <StatCard title="Total Workouts" value={logs.length} subtitle="All time" icon={Dumbbell} trend={{ value: 12, label: "vs last month" }} index={0} />
            <StatCard title="Calories Burned" value={totalCalories.toLocaleString()} subtitle="Total logged" icon={Flame} accent index={1} />
            <StatCard title="Minutes Trained" value={totalMinutes} subtitle="Active time" icon={Clock} index={2} />
            <StatCard title="Avg Calories" value={avgCalories} subtitle="Per session" icon={TrendingUp} trend={{ value: 5, label: "vs last month" }} index={3} />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">This Week</h3>
              <p className="text-xs text-muted-foreground">Daily activity breakdown</p>
            </div>
            <div className="flex gap-1">
              {(["calories", "duration"] as const).map((v) => (
                <button key={v} onClick={() => setChartView(v)}
                  className={cn("rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all",
                    chartView === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}>{v}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 16%)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "hsl(0 0% 64%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(0 0% 64%)", fontSize: 11 }} axisLine={false} tickLine={false} width={35} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey={chartView} fill="hsl(84 81% 44%)" radius={[6, 6, 0, 0]}
                name={chartView === "calories" ? "kcal" : "min"} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground">Monthly Progress</h3>
            <p className="text-xs text-muted-foreground">Weekly workout count this month</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={monthlyProgress}>
              <defs>
                <linearGradient id="progressGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(84 81% 44%)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="hsl(84 81% 44%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 16%)" vertical={false} />
              <XAxis dataKey="week" tick={{ fill: "hsl(0 0% 64%)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(0 0% 64%)", fontSize: 11 }} axisLine={false} tickLine={false} width={25} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="workouts" stroke="hsl(84 81% 44%)" strokeWidth={2}
                fill="url(#progressGrad)" name="sessions" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Workout Log</h3>
            <p className="text-xs text-muted-foreground">{logs.length} sessions recorded</p>
          </div>
          <button onClick={() => setShowLogModal(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:brightness-110 transition-all">
            <Plus className="h-3.5 w-3.5" /> Log Workout
          </button>
        </div>

        <div className="p-5 space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-4 animate-pulse">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-4 w-16 bg-muted rounded" />
                </div>
                <div className="h-3 w-32 bg-muted rounded" />
              </div>
            ))
          ) : logs.length > 0 ? (
            logs.map((log: any, i: number) => (
              <motion.div key={log.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="p-4 cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setExpanded(expanded === log.id ? null : log.id)}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-foreground">{log.type}</span>
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider", TYPE_COLORS[log.type] || TYPE_COLORS.default)}>
                        {log.type}
                      </span>
                    </div>
                    {expanded === log.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(log.date).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {log.duration_minutes || log.duration} min</span>
                    <span className="flex items-center gap-1"><Flame className="h-3 w-3 text-orange-400" /> {log.calories_burned || log.calories} kcal</span>
                  </div>
                </div>
                <AnimatePresence>
                  {expanded === log.id && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden border-t border-border bg-background/30">
                      <div className="p-4 space-y-3">
                        {log.notes && (
                          <div className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-3 py-1">
                            "{log.notes}"
                          </div>
                        )}
                        <div className="space-y-2">
                          {(log.exercises || []).map((ex: any, j: number) => (
                            <div key={j} className="flex items-center justify-between text-xs">
                              <span className="font-medium text-foreground">{ex.name}</span>
                              <span className="text-muted-foreground">{ex.sets} sets × {ex.reps} reps {ex.weight && `· ${ex.weight}kg`}</span>
                            </div>
                          ))}
                          {(!log.exercises || log.exercises.length === 0) && (
                            <p className="text-xs text-muted-foreground">No specific exercises logged.</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-12 bg-background/30 rounded-xl border border-dashed border-border">
              <Dumbbell className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-20" />
              <p className="text-sm text-muted-foreground">No workouts logged yet. Start today!</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Log Workout Modal */}
      <Dialog open={showLogModal} onOpenChange={setShowLogModal}>
        <DialogContent className="max-w-md p-6 border-border bg-card">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-bold text-foreground">Log New Workout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Workout Type</label>
                <select value={newLog.type} onChange={(e) => setNewLog((n) => ({ ...n, type: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none">
                  {WORKOUT_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Duration (min)</label>
                <input type="number" placeholder="e.g. 45" value={newLog.duration}
                  onChange={(e) => setNewLog((n) => ({ ...n, duration: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Est. Calories</label>
                <input type="number" placeholder="e.g. 350" value={newLog.calories}
                  onChange={(e) => setNewLog((n) => ({ ...n, calories: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none" />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Notes (optional)</label>
                <textarea rows={2} placeholder="How did it go?" value={newLog.notes}
                  onChange={(e) => setNewLog((n) => ({ ...n, notes: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground resize-none focus:border-primary/50 focus:outline-none" />
              </div>
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setShowLogModal(false)}
                disabled={workoutMutation.isPending}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors">Cancel</button>
              <button onClick={handleAddLog}
                disabled={workoutMutation.isPending}
                className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all">
                {workoutMutation.isPending ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </div>
                ) : "Save Workout"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Progress;
