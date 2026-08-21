import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Dumbbell,
  Filter,
  Loader2,
  Search,
  Users,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import type { ReactNode } from "react";
import { api } from "@/lib/db";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useClasses } from "@/hooks/api/useClasses";
import { useBookings } from "@/hooks/api/useBookings";

type GymClass = Record<string, any>;

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

const Detail = ({ label, children }: { label: string; children: ReactNode }) => (
  <div>
    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className="mt-1 text-sm text-foreground">{children || "—"}</p>
  </div>
);

const ClassBooking = () => {
  const { user } = useAuth();
  const { useAllClasses } = useClasses();
  const { useMemberBookings, useCreateBooking, useCancelBooking } = useBookings();

  const [category, setCategory] = useState<string>("all");
  const [day, setDay] = useState("All Days");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: classes = [], isLoading } = useAllClasses();
  const { data: userBookings = [] } = useMemberBookings(user?.id);
  const bookingMutation = useCreateBooking();
  const cancellationMutation = useCancelBooking();

  const confirmedBookings = useMemo(() => userBookings
    .filter((booking: any) => booking.status === "confirmed")
    .sort((a: any, b: any) => new Date(a.schedule).getTime() - new Date(b.schedule).getTime()), [userBookings]);
  const bookedIds = useMemo(() => new Set(confirmedBookings.map((booking: any) => booking.classId)), [confirmedBookings]);

  const filtered = classes.filter((c: any) => {
    if (category !== "all" && c.category !== category) return false;
    const classDay = format(new Date(c.schedule), "EEEE");
    if (day !== "All Days" && classDay !== day) return false;
    const instructorName = c.instructorLegacy || c.instructor || "";
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !instructorName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleBook = async (cls: GymClass) => {
    const existingBooking = userBookings.find((booking: any) => booking.classId === cls.id && booking.status === "confirmed");
    try {
      if (existingBooking) {
        await cancellationMutation.mutateAsync(existingBooking.id);
      } else {
        await bookingMutation.mutateAsync({ class_id: cls.id });
      }
    } catch {
      // The mutation hook displays the API error and keeps the row available for retry.
    }
  };

  const isMutating = bookingMutation.isPending || cancellationMutation.isPending;

  return (
    <DashboardLayout title="Book Classes" subtitle="Browse and reserve your spot in group sessions">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <section className="mb-8 rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">My booked classes</h2>
              <p className="text-xs text-muted-foreground">All confirmed bookings linked to your account</p>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{confirmedBookings.length} booked</span>
          </div>
          {confirmedBookings.length > 0 ? (
            <div className="divide-y divide-border/60">
              {confirmedBookings.map((booking: any) => (
                <div key={booking.id} className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10"><CheckCircle className="h-4 w-4 text-primary" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{booking.className || booking.name || "Booked class"}</p>
                    <p className="text-xs text-muted-foreground">{booking.instructor || "Staff"} · {booking.durationMinutes ?? booking.duration_minutes ?? "—"} min</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs font-medium text-foreground">{booking.schedule ? format(new Date(booking.schedule), "EEE, MMM d") : "Schedule pending"}</p>
                    <p className="text-[10px] text-muted-foreground">{booking.schedule ? format(new Date(booking.schedule), "p") : ""}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="border-t border-dashed border-border pt-4 text-sm text-muted-foreground">You have no confirmed classes yet. Browse the schedule below to book your first session.</p>
          )}
        </section>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search classes or instructors..."
              className="w-full rounded-lg border border-border bg-card py-2.5 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20" />
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
                category === cat ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
              )}>
              {cat}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20"><Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" /><p className="text-sm text-muted-foreground">Loading classes...</p></div>
        ) : filtered.length > 0 ? (
          <section className="rounded-2xl border border-border bg-card px-5">
            <div className="hidden border-b border-border/60 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground lg:grid lg:grid-cols-[minmax(0,1.6fr)_minmax(180px,1fr)_120px_120px_120px] lg:items-center lg:gap-4">
              <span>Class</span><span>Schedule</span><span>Duration</span><span>Availability</span><span className="text-right">Actions</span>
            </div>
            <div className="divide-y divide-border/60">
              {filtered.map((cls: GymClass, i: number) => {
                const isBooked = bookedIds.has(cls.id);
                const isFull = cls.enrolled >= cls.capacity;
                const spotsLeft = Math.max(0, cls.capacity - cls.enrolled);
                const classDate = new Date(cls.schedule);
                const instructorName = cls.instructorLegacy || cls.instructor || "Staff";
                const isExpanded = expandedId === cls.id;
                return (
                  <motion.article key={cls.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    <div className="flex flex-col gap-4 py-4 lg:grid lg:grid-cols-[minmax(0,1.6fr)_minmax(180px,1fr)_120px_120px_120px] lg:items-center lg:gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br", CATEGORY_COLORS[cls.category] || "from-primary/20 to-primary/5")}><Dumbbell className="h-4 w-4 text-primary" /></div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{cls.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{instructorName} · <span className="capitalize">{cls.category || "general"}</span></p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Calendar className="h-3.5 w-3.5 shrink-0" /><span>{format(classDate, "EEE, MMM d · p")}</span></div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5 shrink-0" /><span>{cls.durationMinutes ?? cls.duration_minutes ?? "—"} min</span></div>
                      <div className="flex items-center gap-2 text-xs"><Users className="h-3.5 w-3.5 text-muted-foreground" /><span className={isFull ? "text-red-400" : "text-muted-foreground"}>{isFull ? "Class full" : `${spotsLeft} spots left`}</span></div>
                      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                        {isBooked && <span className="flex items-center gap-1 text-[10px] font-semibold text-primary"><CheckCircle className="h-3 w-3" /> Booked</span>}
                        <button onClick={() => setExpandedId(isExpanded ? null : cls.id)} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-2 text-[11px] font-semibold text-foreground transition hover:border-primary/40 hover:text-primary" aria-expanded={isExpanded}>
                          {isExpanded ? "Hide details" : "View details"}{isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </button>
                        <button onClick={() => handleBook(cls)} disabled={(!isBooked && isFull) || isMutating} className={cn("rounded-lg px-2.5 py-2 text-[11px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50", isBooked ? "border border-destructive/30 text-destructive hover:bg-destructive/10" : "bg-primary text-primary-foreground hover:brightness-110")}>{isBooked ? "Cancel" : "Book"}</button>
                      </div>
                    </div>
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="mb-4 grid gap-5 rounded-xl bg-background/60 p-4 sm:grid-cols-2 lg:grid-cols-4">
                            <Detail label="Instructor">{instructorName}</Detail>
                            <Detail label="Location">{cls.location}</Detail>
                            <Detail label="Difficulty"><span className={cn("rounded-full px-2 py-0.5 text-xs capitalize", DIFFICULTY_COLORS[cls.difficulty] || "bg-muted text-muted-foreground")}>{cls.difficulty || "All levels"}</span></Detail>
                            <Detail label="Intensity"><span className="capitalize">{cls.intensity || "Medium"}</span></Detail>
                            <Detail label="Capacity">{cls.enrolled}/{cls.capacity} enrolled</Detail>
                            <Detail label="Requirements">{cls.requirements || "No special requirements"}</Detail>
                            <div className="sm:col-span-2 lg:col-span-4"><p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">About this class</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{cls.description || "A coached OptizGYM session designed to help you train consistently and progress with confidence."}</p></div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.article>
                );
              })}
            </div>
          </section>
        ) : (
          <div className="py-16 text-center"><Filter className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p className="text-sm text-muted-foreground">No classes match your filters.</p></div>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default ClassBooking;
