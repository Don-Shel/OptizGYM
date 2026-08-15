import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BadgeCheck, CalendarDays, CheckCircle2, ChevronDown, Clock3, Dumbbell, Info, MapPin, Sparkles, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { api } from "@/lib/db";
import { connectPublicSocket } from "@/lib/socket";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const intensityStyles: Record<string, string> = {
  low: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  medium: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  high: "border-rose-500/30 bg-rose-500/10 text-rose-400",
};

const formatSchedule = (value: string | Date | null | undefined) => {
  const date = new Date(value || '');
  if (Number.isNaN(date.getTime())) return { day: 'Flexible', date: '', time: 'Time TBC', weekday: 'flexible' };
  return {
    day: date.toLocaleDateString(undefined, { weekday: 'short' }),
    date: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    time: date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
    weekday: date.toLocaleDateString(undefined, { weekday: 'long' }).toLowerCase(),
  };
};

const timeBucket = (value: string | Date | null | undefined) => {
  const hour = new Date(value || '').getHours();
  if (Number.isNaN(hour)) return 'any';
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
};

const initials = (name: string) => name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();

const Classes = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isSignedIn } = useAuth();
  const { data: classes = [], isLoading, isError, refetch } = useQuery({ queryKey: ['classes'], queryFn: api.classes.getAll, staleTime: 30_000 });
  const [category, setCategory] = useState('All');
  const [intensity, setIntensity] = useState('All');
  const [timeOfDay, setTimeOfDay] = useState('any');
  const [day, setDay] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const socket = connectPublicSocket();
    if (!socket) return;
    const refresh = () => queryClient.invalidateQueries({ queryKey: ['classes'] });
    const onCreated = (data: any) => {
      refresh();
      const name = data?.name || data?.class?.name;
      if (name) toast.success(`New class dropped: ${name}`);
    };
    socket.on('class-created', onCreated);
    socket.on('class-new', onCreated);
    socket.on('class-updated', refresh);
    socket.on('class-deleted', refresh);
    socket.on('class-removed', refresh);
    return () => {
      socket.off('class-created', onCreated);
      socket.off('class-new', onCreated);
      socket.off('class-updated', refresh);
      socket.off('class-deleted', refresh);
      socket.off('class-removed', refresh);
    };
  }, [queryClient]);

  const liveClasses = useMemo(() => (classes as any[]).filter((item) => !item.deletedAt), [classes]);
  const categories = useMemo(() => ['All', ...Array.from(new Set(liveClasses.map((item) => item.category).filter(Boolean)))], [liveClasses]);
  const days = useMemo(() => ['all', ...Array.from(new Set(liveClasses.map((item) => formatSchedule(item.schedule).weekday).filter((item) => item !== 'flexible')))], [liveClasses]);
  const filtered = useMemo(() => liveClasses.filter((item) => {
    const schedule = formatSchedule(item.schedule);
    return (category === 'All' || item.category === category)
      && (intensity === 'All' || (item.intensity || 'medium').toLowerCase() === intensity.toLowerCase())
      && (timeOfDay === 'any' || timeBucket(item.schedule) === timeOfDay)
      && (day === 'all' || schedule.weekday === day);
  }), [liveClasses, category, intensity, timeOfDay, day]);

  const handleBook = (classId: string) => {
    const redirect = `/dashboard/classes?classId=${encodeURIComponent(classId)}`;
    if (!isSignedIn) return navigate(`/auth/sign-up?redirect=${encodeURIComponent(redirect)}`);
    if (!user || user.membershipStatus !== 'active' || user.plan === 'free') return navigate('/pricing');
    navigate(redirect);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        <section className="relative overflow-hidden border-b border-border py-16 md:py-20">
          <div className="absolute -right-24 -top-32 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
          <div className="container relative mx-auto px-4 md:px-6">
            <div className="max-w-3xl"><div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary"><Sparkles className="h-3.5 w-3.5" /> Train with intent</div><h1 className="text-4xl font-bold tracking-tight text-foreground md:text-6xl">A better schedule for your <span className="text-gradient">strongest self.</span></h1><p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">Explore live sessions, understand exactly what each class demands, and book with confidence. New sessions appear here as soon as our team publishes them.</p></div>
            <div className="mt-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4"><div className="rounded-2xl border border-border bg-card/70 p-4"><p className="text-2xl font-bold text-foreground">{liveClasses.length}</p><p className="mt-1 text-xs text-muted-foreground">Live sessions</p></div><div className="rounded-2xl border border-border bg-card/70 p-4"><p className="text-2xl font-bold text-foreground">{categories.length - 1}</p><p className="mt-1 text-xs text-muted-foreground">Training styles</p></div><div className="rounded-2xl border border-border bg-card/70 p-4"><p className="text-2xl font-bold text-foreground">{new Set(liveClasses.map((item) => item.instructorId).filter(Boolean)).size}</p><p className="mt-1 text-xs text-muted-foreground">Coaches</p></div><div className="rounded-2xl border border-border bg-card/70 p-4"><p className="text-2xl font-bold text-primary">KES 0</p><p className="mt-1 text-xs text-muted-foreground">Included with membership</p></div></div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-10 md:px-6 md:py-12 lg:flex lg:gap-10">
          <aside className="mb-8 shrink-0 lg:mb-0 lg:w-64"><div className="sticky top-24 rounded-2xl border border-border bg-card p-5"><div className="mb-5 flex items-center gap-2"><Dumbbell className="h-4 w-4 text-primary" /><h2 className="text-sm font-semibold text-foreground">Refine your search</h2></div><div className="space-y-5"><div><label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Class type</label><div className="flex flex-wrap gap-2">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${category === item ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>{item}</button>)}</div></div><div><label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Intensity</label><div className="grid grid-cols-2 gap-2">{['All', 'low', 'medium', 'high'].map((item) => <button key={item} onClick={() => setIntensity(item)} className={`rounded-lg px-3 py-2 text-left text-xs font-medium capitalize transition-all ${intensity === item ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>{item}</button>)}</div></div><div><label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Time of day</label><div className="space-y-2">{[['any', 'Any time'], ['morning', 'Morning · 5am–12pm'], ['afternoon', 'Afternoon · 12pm–5pm'], ['evening', 'Evening · 5pm–10pm']].map(([value, label]) => <button key={value} onClick={() => setTimeOfDay(value)} className={`w-full rounded-lg px-3 py-2 text-left text-xs font-medium transition-all ${timeOfDay === value ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>{label}</button>)}</div></div></div></div></aside>

          <section className="min-w-0 flex-1"><div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm text-muted-foreground">{isLoading ? 'Loading the live schedule…' : `${filtered.length} session${filtered.length === 1 ? '' : 's'} available`}</p><h2 className="mt-1 text-2xl font-bold text-foreground">Find your next session</h2></div><div className="relative"><select value={day} onChange={(event) => setDay(event.target.value)} className="appearance-none rounded-xl border border-border bg-card py-2.5 pl-3 pr-10 text-xs font-medium capitalize text-foreground outline-none focus:border-primary"><option value="all">All days</option>{days.filter((item) => item !== 'all').map((item) => <option key={item} value={item}>{item}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3 h-3.5 w-3.5 text-muted-foreground" /></div></div>

            {isLoading && <div className="grid gap-4">{[1, 2, 3].map((item) => <div key={item} className="h-48 animate-pulse rounded-2xl border border-border bg-card" />)}</div>}
            {isError && <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center"><Info className="mx-auto h-6 w-6 text-destructive" /><p className="mt-3 font-semibold text-foreground">The schedule is temporarily unavailable.</p><button onClick={() => refetch()} className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Try again</button></div>}
            {!isLoading && !isError && filtered.length === 0 && <div className="rounded-2xl border border-dashed border-border p-12 text-center"><CalendarDays className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-4 font-semibold text-foreground">No classes match those filters.</p><p className="mt-1 text-sm text-muted-foreground">Try a different day, intensity, or training style.</p></div>}
            <div className="space-y-4">{filtered.map((item: any, index: number) => {
              const schedule = formatSchedule(item.schedule);
              const spotsLeft = Math.max(0, (Number(item.capacity) || 0) - (Number(item.enrolled) || 0));
              const fill = Math.min(100, Math.round(((Number(item.enrolled) || 0) / Math.max(1, Number(item.capacity) || 1)) * 100));
              const createdAt = item.createdAt ? new Date(item.createdAt).getTime() : 0;
              const isNew = createdAt > 0 && Date.now() - createdAt < 48 * 60 * 60 * 1000;
              const trainer = item.instructor || item.instructorLegacy || 'OptizGYM coach';
              const expanded = expandedId === item.id;
              return <motion.article key={item.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .05 }} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:border-primary/40 hover:shadow-lg"><div className="flex flex-col gap-5 p-5 md:flex-row md:items-center md:p-6"><div className="flex shrink-0 items-center gap-3 md:w-40"><div className="min-w-20 rounded-xl bg-secondary px-3 py-2 text-center"><p className="text-xs font-bold text-foreground">{schedule.day}</p><p className="mt-0.5 text-[11px] text-muted-foreground">{schedule.date}</p></div><div className="md:hidden"><p className="text-sm font-bold text-foreground">{schedule.time}</p><p className="text-xs text-muted-foreground">{item.durationMinutes || 45} min</p></div></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">{item.category || 'Training'}</span><span className={`rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${intensityStyles[(item.intensity || 'medium').toLowerCase()] || intensityStyles.medium}`}>{item.intensity || 'Medium'} intensity</span>{isNew && <span className="rounded-md bg-primary px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">New</span>}</div><h3 className="mt-2 text-lg font-bold text-foreground">{item.name}</h3><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><UserRound className="h-3.5 w-3.5" />{trainer}</span><span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{item.durationMinutes || 45} min</span><span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{item.location || 'Main studio'}</span></div></div><div className="hidden shrink-0 text-right md:block"><p className="text-sm font-bold text-foreground">{schedule.time}</p><p className="mt-1 text-xs text-muted-foreground">{item.durationMinutes || 45} min</p></div><div className="flex shrink-0 items-center justify-between gap-4 md:w-44 md:flex-col md:items-end"><div className="w-full md:text-right"><div className="flex items-center justify-between text-[11px] text-muted-foreground md:justify-end md:gap-2"><span>{spotsLeft > 0 ? `${spotsLeft} spots left` : 'Class full'}</span><span>{fill}% full</span></div><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary"><div className={`h-full rounded-full ${spotsLeft === 0 ? 'bg-destructive' : 'bg-primary'}`} style={{ width: `${fill}%` }} /></div></div><button disabled={spotsLeft === 0} onClick={() => handleBook(item.id)} className={`rounded-lg px-4 py-2 text-xs font-bold transition ${spotsLeft === 0 ? 'cursor-not-allowed border border-border text-muted-foreground' : 'bg-primary text-primary-foreground hover:brightness-110'}`}>{spotsLeft === 0 ? 'Waitlist' : 'Book now'}</button></div></div><div className="flex items-center justify-between border-t border-border/70 px-5 py-3 md:px-6"><button onClick={() => setExpandedId(expanded ? null : item.id)} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">{expanded ? 'Hide details' : 'View class details'}<ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} /></button>{item.requirements && <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"><CheckCircle2 className="h-3.5 w-3.5 text-primary" />Requirements listed</span>}</div>{expanded && <div className="grid gap-5 border-t border-border/70 bg-secondary/20 px-5 py-5 md:grid-cols-[1fr_1fr] md:px-6"><div><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">About this class</p><p className="mt-2 text-sm leading-6 text-foreground">{item.description || 'A focused session designed to help you train consistently, move well, and leave stronger than you arrived.'}</p>{item.requirements && <div className="mt-4 rounded-xl border border-border bg-card p-3"><p className="text-xs font-semibold text-foreground">What to bring / know</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{item.requirements}</p></div>}</div><div className="rounded-xl border border-border bg-card p-4"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">{item.instructorAvatarUrl ? <img src={item.instructorAvatarUrl} alt={trainer} className="h-full w-full rounded-full object-cover" /> : initials(trainer)}</div><div><p className="text-sm font-semibold text-foreground">{trainer}</p><p className="text-xs text-primary">{item.instructorSpecialty || item.category || 'Performance coach'}</p></div><BadgeCheck className="ml-auto h-4 w-4 text-primary" /></div><p className="mt-3 text-xs leading-5 text-muted-foreground">{item.instructorBio || 'Your coach will guide the session with clear progressions, practical cues, and a welcoming training environment.'}</p></div></div>}</motion.article>;
            })}</div>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Classes;
