import { useState } from "react";
import { motion } from "framer-motion";
import { User, Clock } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const days = ["Mon 12", "Tue 13", "Wed 14", "Thu 15", "Fri 16", "Sat 17", "Sun 18"];

const classes = [
  { time: "06:00 AM", duration: "45m", type: "CrossFit", title: "Morning WOD: Power & Speed", trainer: "Marcus Johnson", spots: 8, color: "bg-red-500/10 text-red-400 border-red-500/20" },
  { time: "08:30 AM", duration: "60m", type: "Pilates", title: "Core Flow Pilates", trainer: "Sarah Chen", spots: 12, color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  { time: "12:00 PM", duration: "45m", type: "Boxing", title: "Technical Boxing", trainer: "Mike \"The Hammer\"", spots: 0, color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  { time: "05:30 PM", duration: "50m", type: "HIIT", title: "Afterburn HIIT", trainer: "Lisa Ray", spots: 2, color: "bg-primary/10 text-primary border-primary/20" },
];

const filters = ["All", "Strength & Conditioning", "Cardio & HIIT", "Yoga & Pilates"];
const intensities = ["High", "Medium", "Low"];
const times = ["Morning (5am-12pm)", "Afternoon (12pm-5pm)", "Evening (5pm-10pm)"];

const fade = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

const Classes = () => {
  const [activeDay, setActiveDay] = useState(0);
  const [activeFilter, setActiveFilter] = useState("All");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        {/* Header */}
        <section className="border-b border-border py-16">
          <div className="container mx-auto px-4 md:px-6">
            <h1 className="text-4xl font-bold text-foreground md:text-5xl">
              Weekly <span className="text-gradient">Schedule</span>
            </h1>
            <p className="mt-3 max-w-lg text-muted-foreground">
              Find your strength. Join our world-class instructors for sessions designed to push your limits.
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 py-12 md:px-6 lg:flex lg:gap-10">
          {/* Sidebar Filters */}
          <aside className="mb-8 lg:mb-0 lg:w-64 shrink-0">
            <div className="rounded-xl border border-border bg-card p-6 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Class Type</h3>
                <div className="flex flex-wrap gap-2">
                  {filters.map((f) => (
                    <button
                      key={f}
                      onClick={() => setActiveFilter(f)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                        activeFilter === f
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Intensity</h3>
                <div className="flex flex-wrap gap-2">
                  {intensities.map((i) => (
                    <button key={i} className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                      {i}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Time</h3>
                <div className="flex flex-col gap-2">
                  {times.map((t) => (
                    <button key={t} className="rounded-lg bg-secondary px-3 py-2 text-left text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Schedule */}
          <div className="flex-1">
            {/* Day tabs */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
              {days.map((day, i) => (
                <button
                  key={day}
                  onClick={() => setActiveDay(i)}
                  className={`shrink-0 rounded-lg px-5 py-3 text-sm font-medium transition-all ${
                    activeDay === i
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            {/* Class cards */}
            <div className="space-y-4">
              {classes.map((c, i) => (
                <motion.div
                  key={c.title}
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  variants={fade}
                  className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 md:flex-row md:items-center md:justify-between card-hover"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-center shrink-0">
                      <p className="text-sm font-semibold text-foreground">{c.time}</p>
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" /> {c.duration}
                      </div>
                    </div>
                    <div>
                      <span className={`inline-block rounded-md border px-2 py-0.5 text-xs font-medium ${c.color}`}>
                        {c.type}
                      </span>
                      <h3 className="mt-1 font-semibold text-foreground">{c.title}</h3>
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="h-3 w-3" /> with {c.trainer}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right text-xs">
                      <p className="text-muted-foreground">Spots Left</p>
                      <p className={`font-semibold ${c.spots === 0 ? "text-destructive" : "text-primary"}`}>
                        {c.spots === 0 ? "Full" : `${c.spots} open`}
                      </p>
                    </div>
                    <button
                      className={`rounded-lg px-5 py-2 text-sm font-semibold transition-all ${
                        c.spots === 0
                          ? "border border-border text-muted-foreground"
                          : "bg-primary text-primary-foreground hover:brightness-110"
                      }`}
                    >
                      {c.spots === 0 ? "Waitlist" : "Book Now"}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Classes;
