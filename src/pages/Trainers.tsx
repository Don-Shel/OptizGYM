import { useState } from "react";
import { motion } from "framer-motion";
import { Star, CalendarDays, ArrowRight, Search } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const categories = ["All", "Strength & Conditioning", "Yoga & Flexibility", "HIIT & Cardio", "Nutrition", "Rehabilitation"];

const trainerData = [
  { name: "Sarah Jenkins", role: "Senior Coach", specialty: "Strength", rating: 4.9, desc: "Specializes in powerlifting and functional hypertrophy. I help you build strength that translates to real life performance and confidence.", color: "from-red-500/20 to-red-500/5" },
  { name: "Mike Ross", role: "Conditioning Specialist", specialty: "HIIT", rating: 4.8, desc: "High energy interval training designed for maximum fat loss and endurance. Get ready to sweat and push your limits.", color: "from-orange-500/20 to-orange-500/5" },
  { name: "Elena Rodriguez", role: "Mindfulness Expert", specialty: "Yoga", rating: 5.0, desc: "Integrating mindfulness and flexibility to improve your overall wellbeing. Focus on breath, balance, and inner peace.", color: "from-teal-500/20 to-teal-500/5" },
  { name: "David Chen", role: "Certified Dietitian", specialty: "Nutrition", rating: 4.9, desc: "Fuel your body right. I provide personalized meal plans and nutritional advice focusing on performance and recovery.", color: "from-primary/20 to-primary/5" },
  { name: "Marcus Johnson", role: "Physical Therapist", specialty: "Rehab", rating: 5.0, desc: "Recover faster and stronger. My rehabilitation programs are science-based to get you back to peak performance safely.", color: "from-blue-500/20 to-blue-500/5" },
  { name: "Alicia Keys", role: "Boxing Coach", specialty: "Boxing", rating: 4.7, desc: "Learn self-defense and improve your cardiovascular health. Boxing is a fun and intense way to get in shape quickly.", color: "from-pink-500/20 to-pink-500/5" },
];

const fade = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

const Trainers = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = trainerData.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.specialty.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        {/* Header */}
        <section className="border-b border-border py-16">
          <div className="container mx-auto px-4 md:px-6">
            <h1 className="text-4xl font-bold text-foreground md:text-5xl">
              Meet Our <span className="text-gradient">Expert Trainers</span>
            </h1>
            <p className="mt-3 max-w-lg text-muted-foreground">
              Achieve your fitness goals with our world-class coaching staff. Our trainers are certified professionals dedicated to helping you unlock your full potential.
            </p>

            {/* Search */}
            <div className="mt-6 relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search trainers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Category filters */}
            <div className="mt-6 flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setActiveCategory(c)}
                  className={`rounded-lg px-4 py-2 text-xs font-medium transition-all ${
                    activeCategory === c
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Trainers Grid */}
        <section className="py-16">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((t, i) => (
                <motion.div
                  key={t.name}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fade}
                  className="group rounded-xl border border-border bg-card overflow-hidden card-hover"
                >
                  <div className={`h-48 bg-gradient-to-br ${t.color} flex items-center justify-center relative`}>
                    <span className="text-5xl font-bold text-foreground/20">{t.name.charAt(0)}</span>
                    <div className="absolute top-4 right-4 flex items-center gap-1 rounded-full bg-background/80 backdrop-blur-sm px-2.5 py-1">
                      <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                      <span className="text-xs font-semibold text-foreground">{t.rating}</span>
                    </div>
                    <span className="absolute top-4 left-4 rounded-md bg-background/80 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-foreground">
                      {t.specialty}
                    </span>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-foreground">{t.name}</h3>
                    <p className="text-sm text-primary">{t.role}</p>
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{t.desc}</p>
                    <button className="mt-4 flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-primary hover:text-primary-foreground">
                      <CalendarDays className="h-4 w-4" /> Book Session
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border py-24">
          <div className="container mx-auto px-4 text-center md:px-6">
            <h2 className="text-3xl font-bold text-foreground">Not sure who to choose?</h2>
            <p className="mx-auto mt-3 max-w-md text-muted-foreground">
              Schedule a free 15-minute consultation with our head coach. We'll discuss your goals and match you with the perfect trainer.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <button className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110">
                Get a Free Match
              </button>
              <Link to="/pricing" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                Explore Memberships <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default Trainers;
