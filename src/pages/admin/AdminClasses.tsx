import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus, Search, Calendar, Clock, Users, Edit3, Trash2,
  ChevronDown, ChevronUp, X, Dumbbell, Filter, Loader2
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StatCard from "@/components/dashboard/StatCard";
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

import { useClasses } from "@/hooks/api/useClasses";

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
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const CATEGORIES = ["strength", "cardio", "yoga", "hiit", "cycling", "boxing"];
const BLANK: Partial<any> = {
  name: "", instructor: "Staff", instructorId: null, schedule: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  durationMinutes: 60, capacity: 20, category: "strength", location: "Main Floor",
  description: "", difficulty: "intermediate", intensity: "medium", requirements: "", enrolled: 0,
};

const AdminClasses = () => {
  const { useAllClasses, useInstructors, useCreateClass, useUpdateClass, useDeleteClass } = useClasses();
  const [search, setSearch] = useState("");
  const [dayFilter, setDayFilter] = useState("All");
  const [catFilter, setCatFilter] = useState("all");
  const [editClass, setEditClass] = useState<Partial<any> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: classes = [], isLoading } = useAllClasses();
  const { data: instructors = [] } = useInstructors();
  const createMutation = useCreateClass();
  const updateMutation = useUpdateClass();
  const deleteMutation = useDeleteClass();

  const filtered = classes.filter((c: any) => {
    const classDay = format(new Date(c.schedule), "EEEE");
    if (dayFilter !== "All" && classDay !== dayFilter) return false;
    if (catFilter !== "all" && c.category !== catFilter) return false;
    const instructorName = c.instructorLegacy || c.instructor || "";
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !instructorName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const openAdd = () => { setEditClass({ ...BLANK }); setIsNew(true); };
  const openEdit = (c: any) => { setEditClass({ ...c }); setIsNew(false); };

  const handleSave = async () => {
    if (!editClass?.name?.trim()) { toast.error("Name is required."); return; }
    const schedule = editClass.schedule ? new Date(editClass.schedule) : null;
    const durationMinutes = Number(editClass.durationMinutes ?? editClass.duration_minutes ?? 60);
    const capacity = Number(editClass.capacity ?? 20);
    if (!schedule || Number.isNaN(schedule.getTime())) { toast.error("Choose a valid class date and time."); return; }
    if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) { toast.error("Duration must be a positive whole number."); return; }
    if (!Number.isInteger(capacity) || capacity <= 0) { toast.error("Capacity must be a positive whole number."); return; }
    const selectedInstructor = instructors.find((instructor: any) => instructor.fullName === (editClass.instructor || editClass.instructorLegacy));
    const data = {
      ...editClass,
      name: editClass.name.trim(),
      instructor: (editClass.instructor || editClass.instructorLegacy || 'Staff').trim() || 'Staff',
      instructorId: selectedInstructor?.id || editClass.instructorId || null,
      schedule: schedule.toISOString(),
      durationMinutes,
      capacity,
    };
    try {
      if (isNew) {
        await createMutation.mutateAsync(data);
      } else if (editClass.id) {
        await updateMutation.mutateAsync({ id: editClass.id, data });
      }
      setEditClass(null);
      setIsNew(false);
    } catch {
      // The mutation hook surfaces the API validation or server error via toast.
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      setDeleteId(null);
    } catch {
      // The mutation hook surfaces the API error via toast and keeps the dialog open.
    }
  };

  const totalCapacity = classes.reduce((s: number, c: any) => s + c.capacity, 0);
  const totalEnrolled = classes.reduce((s: number, c: any) => s + c.enrolled, 0);
  const avgFill = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;

  return (
    <DashboardLayout title="Classes" subtitle="Manage group sessions, schedules, and instructors">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Classes" value={classes.length} icon={Calendar} accent index={0} />
        <StatCard title="Total Spots" value={totalCapacity} subtitle="Across all sessions" icon={Users} index={1} />
        <StatCard title="Enrolled" value={totalEnrolled} subtitle="Members booked" icon={Dumbbell} index={2} />
        <StatCard title="Avg Fill Rate" value={`${avgFill}%`} icon={Filter} subtitle="Across scheduled classes" index={3} />
      </div>

      <div className="mb-5 flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search classes…"
            className="w-full rounded-lg border border-border bg-card pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:outline-none" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={dayFilter} onChange={e => setDayFilter(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground focus:border-primary/50 focus:outline-none">
            <option>All</option>
            {DAYS.map(d => <option key={d}>{d}</option>)}
          </select>
          {["all", ...CATEGORIES].map(cat => (
            <button key={cat} onClick={() => setCatFilter(cat)}
              className={cn("rounded-lg px-3 py-2 text-xs font-medium capitalize transition-all",
                catFilter === cat ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted-foreground hover:text-foreground"
              )}>{cat}</button>
          ))}
          <div className="ml-auto flex gap-2">
            <button onClick={openAdd}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:brightness-110 transition-all">
              <Plus className="h-3.5 w-3.5" /> Add Class
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading classes...</p>
        </div>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-border bg-card px-5">
          <div className="hidden border-b border-border/60 py-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground lg:grid lg:grid-cols-[minmax(0,1.6fr)_minmax(180px,1fr)_110px_110px_minmax(230px,1fr)] lg:items-center lg:gap-4">
            <span>Class</span><span>Schedule</span><span>Capacity</span><span>Level</span><span className="text-right">Actions</span>
          </div>
          <div className="divide-y divide-border/60">
            {filtered.map((cls: any, i: number) => {
              const enrolled = Number(cls.enrolled ?? 0);
              const capacity = Math.max(1, Number(cls.capacity ?? 20));
              const fill = Math.min(100, Math.round((enrolled / capacity) * 100));
              const classDate = new Date(cls.schedule);
              const instructorName = cls.instructorLegacy || cls.instructor || "Staff";
              const isExpanded = expandedId === cls.id;
              return (
                <motion.article key={cls.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  <div className="flex flex-col gap-4 py-4 lg:grid lg:grid-cols-[minmax(0,1.6fr)_minmax(180px,1fr)_110px_110px_minmax(230px,1fr)] lg:items-center lg:gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br", CATEGORY_COLORS[cls.category] || "from-muted to-muted/5")}><Dumbbell className="h-4 w-4 text-primary" /></div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{cls.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{instructorName} · <span className="capitalize">{cls.category || "general"}</span></p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground"><Calendar className="h-3.5 w-3.5 shrink-0" /><span>{format(classDate, "EEE, MMM d · p")}</span></div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground"><Users className="h-3.5 w-3.5 shrink-0" /><span>{enrolled}/{capacity} enrolled</span></div>
                    <span className={cn("w-fit rounded-full px-2 py-0.5 text-xs capitalize", DIFFICULTY_COLORS[cls.difficulty] || "bg-muted text-muted-foreground")}>{cls.difficulty || "All levels"}</span>
                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                      <span className={cn("mr-auto text-xs font-medium lg:mr-1", fill >= 90 ? "text-red-400" : fill >= 70 ? "text-amber-400" : "text-emerald-400")}>{fill}% full</span>
                      <button onClick={() => setExpandedId(isExpanded ? null : cls.id)} aria-expanded={isExpanded} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-2 text-[11px] font-semibold text-foreground transition hover:border-primary/40 hover:text-primary">{isExpanded ? "Hide details" : "View details"}{isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}</button>
                      <button onClick={() => openEdit(cls)} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-2 text-[11px] font-semibold text-foreground transition hover:bg-accent"><Edit3 className="h-3.5 w-3.5" /> Edit</button>
                      <button onClick={() => setDeleteId(cls.id)} className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/25 px-2.5 py-2 text-[11px] font-semibold text-destructive transition hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                    </div>
                  </div>
                  {isExpanded && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
                      <div className="mb-4 grid gap-5 rounded-xl bg-background/60 p-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div><p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Duration</p><p className="mt-1 text-sm text-foreground">{cls.durationMinutes ?? cls.duration_minutes ?? "—"} min</p></div>
                        <div><p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Location</p><p className="mt-1 text-sm text-foreground">{cls.location || "—"}</p></div>
                        <div><p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Intensity</p><p className="mt-1 text-sm capitalize text-foreground">{cls.intensity || "Medium"}</p></div>
                        <div><p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Requirements</p><p className="mt-1 text-sm text-foreground">{cls.requirements || "None listed"}</p></div>
                        <div className="sm:col-span-2 lg:col-span-4"><p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Description</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{cls.description || "No description added yet."}</p></div>
                      </div>
                    </motion.div>
                  )}
                </motion.article>
              );
            })}
          </div>
        </section>
      )}

      {filtered.length === 0 && !isLoading && <div className="py-16 text-center"><p className="text-sm text-muted-foreground">No classes found.</p></div>}

      {/* Edit/Add Class Modal */}
      <Dialog open={!!editClass} onOpenChange={(open) => !open && setEditClass(null)}>
        <DialogContent className="max-w-lg p-6 border-border bg-card max-h-[90vh] overflow-y-auto">
          {editClass && (
            <>
              <DialogHeader className="mb-5">
                <DialogTitle className="text-base font-bold text-foreground">
                  {isNew ? "Add New Class" : "Edit Class"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Class Name</label>
                    <input value={editClass.name || ""} onChange={e => setEditClass(c => ({ ...c!, name: e.target.value }))} placeholder="e.g. Power Yoga Flow"
                      className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none" />
                  </div>
                  {[
                    { key: "instructor", label: "Instructor", type: "select", options: instructors.map((instructor: any) => instructor.fullName) },
                    { key: "category", label: "Category", type: "select", options: CATEGORIES },
                    { key: "schedule", label: "Schedule", type: "datetime-local" },
                    { key: "durationMinutes", label: "Duration (min)", type: "number" },
                    { key: "capacity", label: "Capacity", type: "number" },
                    { key: "location", label: "Location", type: "text", placeholder: "Main Floor" },
                    { key: "difficulty", label: "Difficulty", type: "select", options: ["beginner", "intermediate", "advanced"] },
                    { key: "intensity", label: "Intensity", type: "select", options: ["low", "medium", "high"] },
                  ].map(({ key, label, type, options, placeholder }) => (
                    <div key={key} className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground capitalize">{label}</label>
                      {type === "select" ? (
                        <select value={(editClass as any)[key] || (editClass as any)[key === "instructor" ? "instructorLegacy" : key] || ""} onChange={e => setEditClass(c => ({ ...c!, [key]: e.target.value }))}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none capitalize">
                          {(options || []).map(o => <option key={o} className="capitalize">{o}</option>)}
                        </select>
                      ) : type === "datetime-local" ? (
                        <input type="datetime-local" value={editClass.schedule ? format(new Date(editClass.schedule), "yyyy-MM-dd'T'HH:mm") : ""}
                          onChange={e => setEditClass(c => ({ ...c!, schedule: e.target.value ? new Date(e.target.value).toISOString() : "" }))}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none" />
                      ) : (
                        <input type={type} value={(editClass as any)[key] || (editClass as any)[key === "durationMinutes" ? "duration_minutes" : key] || ""} placeholder={placeholder}
                          onChange={e => setEditClass(c => ({ ...c!, [key]: type === "number" ? (e.target.value === "" ? undefined : Number(e.target.value)) : e.target.value }))}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none" />
                      )}
                    </div>
                  ))}
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Description</label>
                    <textarea rows={2} value={editClass.description || ""} onChange={e => setEditClass(c => ({ ...c!, description: e.target.value }))} placeholder="Brief class description…"
                      className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground resize-none focus:border-primary/50 focus:outline-none" />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Requirements</label>
                    <textarea rows={2} value={editClass.requirements || ""} onChange={e => setEditClass(c => ({ ...c!, requirements: e.target.value }))} placeholder="What should members bring or know before joining?"
                      className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground resize-none focus:border-primary/50 focus:outline-none" />
                  </div>
                </div>
              </div>
              <div className="mt-5 flex gap-3">
                <button onClick={() => setEditClass(null)} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors">Cancel</button>
                <button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110 transition-all">
                  {createMutation.isPending || updateMutation.isPending ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </div>
                  ) : (isNew ? "Create Class" : "Save Changes")}
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="max-w-sm p-6 border-destructive/30 bg-card">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-base font-bold text-foreground">Delete Class?</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              This will permanently remove the class and all bookings. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-2">
            <button onClick={() => setDeleteId(null)} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors">Cancel</button>
            <button onClick={handleDelete} disabled={deleteMutation.isPending} className="flex-1 rounded-xl bg-destructive py-2.5 text-sm font-semibold text-white hover:brightness-110 transition-all">
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminClasses;
