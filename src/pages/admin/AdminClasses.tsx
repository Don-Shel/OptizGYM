import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus, Search, Calendar, Clock, Users, Edit3, Trash2,
  X, Dumbbell, Filter, Loader2
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
  name: "", instructor: "", instructorId: null, schedule: new Date().toISOString(),
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
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

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
    const selectedInstructor = instructors.find((instructor: any) => instructor.fullName === (editClass.instructor || editClass.instructorLegacy));
    const data = {
      ...editClass,
      name: editClass.name.trim(),
      instructor: (editClass.instructor || editClass.instructorLegacy || '').trim(),
      instructorId: selectedInstructor?.id || editClass.instructorId || null,
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
            <button onClick={() => setViewMode(v => v === "grid" ? "table" : "grid")}
              className="rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
              {viewMode === "grid" ? "Table" : "Grid"}
            </button>
            <button onClick={openAdd}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:brightness-110 transition-all">
              <Plus className="h-3.5 w-3.5" /> Add Class
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
          <p className="text-sm text-muted-foreground">Loading classes...</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((cls: any, i: number) => {
            const fill = Math.round((cls.enrolled / cls.capacity) * 100);
            const classDate = new Date(cls.schedule);
            return (
              <motion.div key={cls.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="rounded-2xl border border-border bg-card p-5 hover:border-primary/20 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${CATEGORY_COLORS[cls.category] || "from-muted to-muted/5"} flex items-center justify-center`}>
                    <Dumbbell className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(cls)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"><Edit3 className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setDeleteId(cls.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                <h3 className="font-semibold text-foreground mb-0.5">{cls.name}</h3>
                <p className="text-xs text-muted-foreground mb-3">{cls.instructorLegacy || cls.instructor || "Staff"}</p>
                <div className="space-y-1.5 mb-3">
                  <p className="flex items-center gap-2 text-xs text-muted-foreground"><Calendar className="h-3.5 w-3.5" />{format(classDate, "EEEE")} · {format(classDate, "p")}</p>
                  <p className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5" />{cls.durationMinutes || cls.duration_minutes} min</p>
                  <p className="flex items-center gap-2 text-xs text-muted-foreground"><Users className="h-3.5 w-3.5" />{cls.enrolled}/{cls.capacity} enrolled</p>
                </div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium capitalize", DIFFICULTY_COLORS[cls.difficulty] || "bg-muted text-muted-foreground")}>{cls.difficulty}</span>
                  <span className={cn("text-xs font-medium", fill >= 90 ? "text-red-400" : fill >= 70 ? "text-amber-400" : "text-emerald-400")}>{fill}% full</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                  <div className={cn("h-full rounded-full", fill >= 90 ? "bg-red-500" : fill >= 70 ? "bg-amber-500" : "bg-primary")} style={{ width: `${fill}%` }} />
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-card/60">
                  {["Class", "Instructor", "Schedule", "Duration", "Enrolled", "Level", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider last:text-right">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((cls: any, i: number) => {
                  const classDate = new Date(cls.schedule);
                  return (
                    <motion.tr key={cls.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="hover:bg-accent/20 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{cls.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{cls.category} · {cls.location}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{cls.instructorLegacy || cls.instructor || "Staff"}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{format(classDate, "EEE p")}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{cls.durationMinutes || cls.duration_minutes}m</td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-foreground">{cls.enrolled}/{cls.capacity}</p>
                        <div className="mt-1 h-1 w-16 rounded-full bg-border overflow-hidden">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${(cls.enrolled / cls.capacity) * 100}%` }} />
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className={cn("rounded-full px-2 py-0.5 text-xs capitalize", DIFFICULTY_COLORS[cls.difficulty] || "bg-muted text-muted-foreground")}>{cls.difficulty}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openEdit(cls)} className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"><Edit3 className="h-3.5 w-3.5" /></button>
                          <button onClick={() => setDeleteId(cls.id)} className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
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
                          onChange={e => setEditClass(c => ({ ...c!, schedule: new Date(e.target.value).toISOString() }))}
                          className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary/50 focus:outline-none" />
                      ) : (
                        <input type={type} value={(editClass as any)[key] || (editClass as any)[key === "durationMinutes" ? "duration_minutes" : key] || ""} placeholder={placeholder}
                          onChange={e => setEditClass(c => ({ ...c!, [key]: type === "number" ? parseInt(e.target.value) : e.target.value }))}
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
