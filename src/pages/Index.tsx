import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Play, CheckCircle, Dumbbell, Timer, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import heroImg from "@/assets/hero-gym.jpg";

const stats = [
  { value: "2500+", label: "Active Members" },
  { value: "50+", label: "Expert Trainers" },
  { value: "100+", label: "Weekly Classes" },
  { value: "24/7", label: "Gym Access" },
];

const programs = [
  {
    icon: Users,
    title: "Yoga & Flexibility",
    desc: "Improve your range of motion, mental focus, and core stability with our expert-led yoga sessions.",
    color: "from-teal-500/20 to-teal-500/5",
  },
  {
    icon: Timer,
    title: "HIIT Cardio",
    desc: "High-intensity interval training designed to burn fat, boost endurance, and push your limits.",
    color: "from-orange-500/20 to-orange-500/5",
  },
  {
    icon: Dumbbell,
    title: "Strength Training",
    desc: "Build muscle and raw power with compound movements and specialized strength equipment.",
    color: "from-primary/20 to-primary/5",
  },
];

const trainers = [
  { name: "Alex Johnson", role: "Strength Coach" },
  { name: "Sarah Miller", role: "Yoga Specialist" },
  { name: "Mike Ross", role: "CrossFit Expert" },
  { name: "Emily Chen", role: "Nutritionist" },
];

const fade = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative flex min-h-screen items-center overflow-hidden pt-16">
        <div className="absolute inset-0">
          <img src={heroImg} alt="OptiBiz Gym interior" className="h-full w-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        </div>
        <div className="container relative z-10 mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-2xl space-y-6"
          >
            <span className="inline-block rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
              New Equipment Arrived
            </span>
            <h1 className="text-5xl font-extrabold leading-tight text-foreground md:text-7xl">
              Elevate Your{" "}
              <span className="text-gradient">Performance</span>
            </h1>
            <p className="max-w-lg text-lg text-muted-foreground">
              State-of-the-art equipment, world-class trainers, and a community dedicated to helping you smash your fitness goals.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110"
              >
                Start Free Trial <ArrowRight className="h-4 w-4" />
              </Link>
              <button className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-medium text-foreground transition-all hover:border-primary/50">
                <Play className="h-4 w-4 text-primary" /> Watch Video
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-card/50">
        <div className="container mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fade}
              className="flex flex-col items-center gap-1 py-8"
            >
              <span className="text-2xl font-bold text-primary md:text-3xl">{s.value}</span>
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Programs */}
      <section className="py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-12 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-3xl font-bold text-foreground md:text-4xl">Our Programs</h2>
              <p className="mt-2 max-w-xl text-muted-foreground">
                Designed for all fitness levels, our programs combine science-based training with high-energy environments.
              </p>
            </div>
            <Link to="/classes" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              View All Classes <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {programs.map((p, i) => (
              <motion.div
                key={p.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fade}
                className="group rounded-xl border border-border bg-card p-8 card-hover"
              >
                <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${p.color}`}>
                  <p.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-foreground">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                <button className="mt-6 flex items-center gap-1 text-sm font-medium text-primary transition-all group-hover:gap-2">
                  Learn More <ArrowRight className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trainers Preview */}
      <section className="border-t border-border bg-card/30 py-24">
        <div className="container mx-auto px-4 md:px-6">
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">Expert Trainers</h2>
          <p className="mt-2 mb-12 max-w-xl text-muted-foreground">
            Our certified personal trainers are here to guide, motivate, and help you achieve results you never thought possible.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {trainers.map((t, i) => (
              <motion.div
                key={t.name}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fade}
                className="group rounded-xl border border-border bg-card p-6 text-center card-hover"
              >
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5">
                  <span className="text-2xl font-bold text-primary">{t.name.charAt(0)}</span>
                </div>
                <h3 className="font-semibold text-foreground">{t.name}</h3>
                <p className="text-sm text-muted-foreground">{t.role}</p>
              </motion.div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link to="/trainers" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
              View All Trainers <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">Membership Plans</h2>
            <p className="mt-2 text-muted-foreground">Choose the plan that best fits your lifestyle. No hidden fees, cancel anytime.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { name: "Basic", price: "$29", features: ["Gym access (Off-peak hours)", "Standard Equipment", "Locker room access"] },
              { name: "Pro", price: "$59", popular: true, features: ["24/7 Unlimited Access", "All Group Classes Included", "Free Guest Pass (1/mo)", "Sauna & Steam Room"] },
              { name: "Elite", price: "$99", features: ["Everything in Pro", "Personal Training (2x/mo)", "Nutrition Plan Consultation", "Private Locker"] },
            ].map((plan, i) => (
              <motion.div
                key={plan.name}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fade}
                className={`relative rounded-xl border bg-card p-8 card-hover ${
                  plan.popular ? "border-primary glow-primary" : "border-border"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    Most Popular
                  </span>
                )}
                <h3 className="text-xl font-semibold text-foreground">{plan.name}</h3>
                <div className="mt-4 mb-6">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">/mo</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/pricing"
                  className={`block w-full rounded-lg py-3 text-center text-sm font-semibold transition-all ${
                    plan.popular
                      ? "bg-primary text-primary-foreground hover:brightness-110"
                      : "border border-border text-foreground hover:border-primary/50"
                  }`}
                >
                  Choose {plan.name}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-gradient-to-br from-primary/10 via-background to-background py-24">
        <div className="container mx-auto px-4 text-center md:px-6">
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">Ready to transform your life?</h2>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground">
            Join OptiBiz Gym today and get your first week absolutely free.
          </p>
          <Link
            to="/pricing"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110"
          >
            Get Started <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
