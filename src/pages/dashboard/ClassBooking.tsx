import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, Users, Dumbbell, CheckCircle, X, Search, Filter, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
type GymClass = Record<string, any>;
import { api } from "@/lib/db";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const CATEGORIES = ["all", "strength", "cardio", "yoga", "hiit", "cycling", "boxing"] as const;
const DAYS = ["All Days", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "bg-emerald-500/10 text-emerald-400",
  intermediate: "bg-amber-500/10 text-amber-400",
  advanced: "bg-red-500/10 text-red-400",
};
const CATEGORY_COLORS: Record<string, string> = {
  strength: "from-primary/20 to-primary/5",
  cardio: "from-orange-500/20 to-orange-500/5",
  yoga: "from-teal-500/20 to-teal-500/5",
  hiit: "from-orange-500/20 to-orange-500/5",
  cycling: "from-blue-500/20 to-blue-500/5",
  boxing: "from-red-500/20 to-red-500/5",
};

import { useAuth } from "@/contexts/AuthContext";
import { useClasses } from "@/hooks/api/useClasses";
import { useBookings } from "@/hooks/api/useBookings";

const ClassBooking = () => {
  const { user } = useAuth();
  const { useAllClasses } = useClasses();
  const { useMemberBookings, useCreateBooking, useCancelBooking } = useBookings();

  const [category, setCategory] = useState<string>("all");
  const [day, setDay] = useState("All Days");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<GymClass | null>(null);

  const { data: classes = [], isLoading } = useAllClasses();
  const { data: userBookings = [] } = useMemberBookings(user?.id);
  const bookingMutation = useCreateBooking();
  const cancellationMutation = useCancelBooking();

  const bookedIds = new Set(userBookings.map((b: any) => b.classId));

  const filtered = classes.filter((c: any) => {
    if (category !== "all" && c.category !== category) return false;
    const classDay = format(new Date(c.schedule), "EEEE");
    if (day !== "All Days" && classDay !== day) return false;
    const instructorName = c.instructorLegacy || c.instructor || "";
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !instructorName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleBook = async (cls: GymClass) => {
    const existingBooking = userBookings.find((booking: any) => booking.classId === cls.id && booking.status === 'confirmed');
    try {
      if (existingBooking) {
        await cancellationMutation.mutateAsync(existingBooking.id);
      } else {
        await bookingMutation.mutateAsync({
          class_id: cls.id,
        });
      }
      setSelected(null);
    } catch {
      // The mutation hook displays the API error and keeps the dialog open for retry.
    }
  };

  return (
    <DashboardLayout title="Book Classes" subtitle="Browse and reserve your spot in group sessions">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search classes or instructors..."
              className="w-full rounded-lg border border-border bg-card pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <select value={day} onChange={(e) => setDay(e.target.value)}
            className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none">
            {DAYS.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={cn("rounded-full px-4 py-1.5 text-xs font-medium capitalize transition-all",
                category === cat ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
              )}>
              {cat}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
            <p className="text-sm text-muted-foreground">Loading classes...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((cls: any, i: number) => {
              const isBooked = bookedIds.has(cls.id);
              const isFull = cls.enrolled >= cls.capacity;
              const spotsLeft = cls.capacity - cls.enrolled;
              const classDate = new Date(cls.schedule);
              const instructorName = cls.instructorLegacy || cls.instructor || "Staff";
              return (
                <motion.div key={cls.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  onClick={() => setSelected(cls)}
                  className={cn("rounded-xl border cursor-pointer p-5 transition-all duration-200 hover:shadow-lg group",
                    isBooked ? "border-primary/40 bg-primary/5 hover:shadow-primary/10" : "border-border bg-card hover:border-primary/20 hover:shadow-black/20"
                  )}>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${CATEGORY_COLORS[cls.category] || "from-primary/20 to-primary/5"} flex items-center justify-center`}>
                      <Dumbbell className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {isBooked && <span className="flex items-center gap-1 text-xs font-medium text-primary"><CheckCircle className="h-3 w-3" /> Booked</span>}
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium capitalize", DIFFICULTY_COLORS[cls.difficulty] || "bg-muted text-muted-foreground")}>{cls.difficulty}</span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{cls.name}</h3>
                  <p className="text-xs text-muted-foreground mb-3">{instructorName}</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground"><Calendar className="h-3.5 w-3.5" />{format(classDate, "EEEE")} · {format(classDate, "p")}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5" />{cls.durationMinutes || cls.duration_minutes} minutes</div>
                    <div className="flex items-center gap-2 text-xs">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className={isFull ? "text-red-400" : "text-muted-foreground"}>{isFull ? "Class full" : `${spotsLeft} spots left`}</span>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 w-full rounded-full bg-border overflow-hidden">
                    <div className={cn("h-full rounded-full transition-all", isFull ? "bg-red-500" : "bg-primary")}
                      style={{ width: `${(cls.enrolled / cls.capacity) * 100}%` }} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {filtered.length === 0 && !isLoading && (
          <div className="py-16 text-center">
            <Filter className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No classes match your filters.</p>
          </div>
        )}
      </motion.div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-md p-6 border-border bg-card max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${CATEGORY_COLORS[selected.category] || "from-primary/20 to-primary/5"} flex items-center justify-center`}>
                  <Dumbbell className="h-5 w-5 text-primary" />
                </div>
              </DialogHeader>
              <div className="space-y-1 mb-4">
                <DialogTitle className="text-xl font-bold text-foreground">{selected.name}</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">{selected.description}</DialogDescription>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                  {[
                    { label: "Instructor", value: selected.instructorLegacy || selected.instructor || "Staff" },
                    { label: "Duration", value: `${selected.durationMinutes || selected.duration_minutes} min` },
                    { label: "Schedule", value: `${format(new Date(selected.schedule), "EEEE")} ${format(new Date(selected.schedule), "p")}` },
                    { label: "Location", value: selected.location },
                    { label: "Capacity", value: `${selected.enrolled}/${selected.capacity}` },
                    { label: "Level", value: selected.difficulty },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-lg bg-background/60 p-3">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-sm font-medium text-foreground capitalize">{value}</p>
                    </div>
                  ))}
                </div>
                <button onClick={() => handleBook(selected)}
                  disabled={(selected.enrolled >= selected.capacity && !bookedIds.has(selected.id)) || bookingMutation.isPending || cancellationMutation.isPending}
                  className={cn("w-full rounded-lg py-3 text-sm font-semibold transition-all active:scale-[0.98]",
                    bookedIds.has(selected.id) ? "border border-destructive/40 text-destructive hover:bg-destructive/10"
                      : selected.enrolled >= selected.capacity ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : "bg-primary text-primary-foreground hover:brightness-110 shadow-lg shadow-primary/20"
                  )}>
                  {bookingMutation.isPending ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </div>
                  ) : bookedIds.has(selected.id) ? "Cancel Booking" : selected.enrolled >= selected.capacity ? "Class Full" : "Book This Class"}
                </button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ClassBooking;
