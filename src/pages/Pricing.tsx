import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, ChevronDown } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const plans = [
  {
    name: "Basic",
    desc: "Essential access for your daily workout.",
    monthly: 29,
    yearly: 25,
    features: ["Gym floor access", "Locker rooms & showers", "Free Wi-Fi"],
  },
  {
    name: "Pro",
    desc: "Everything you need to level up faster.",
    monthly: 59,
    yearly: 50,
    popular: true,
    extra: "Everything in Basic, plus",
    features: ["24/7 Gym Access", "Unlimited Group Classes", "Sauna & Steam Room", "2 Guest Passes / Month"],
  },
  {
    name: "Elite",
    desc: "Maximum results with personal guidance.",
    monthly: 99,
    yearly: 84,
    extra: "Everything in Pro, plus",
    features: ["4 Personal Trainer Sessions", "Custom Nutrition Guide", "Premium Towel Service", "Priority Class Booking"],
  },
];

const faqs = [
  { q: "Is there a joining fee?", a: "We occasionally run promotions with $0 joining fees. Otherwise, there is a standard $49 initiation fee for monthly plans to cover administrative setup and your initial fitness assessment." },
  { q: "Can I freeze my membership?", a: "Yes! You can freeze your membership for up to 3 months per year for a small maintenance fee of $5/month. This is perfect for travel or injury recovery." },
  { q: "Are group classes included in the Basic plan?", a: "The Basic plan covers gym floor access only. If you love classes like Yoga, HIIT, or Spin, we recommend upgrading to the Pro plan for unlimited access to our full schedule." },
  { q: "What are the gym hours?", a: "For Pro and Elite members, we are open 24/7. Basic members have access during staffed hours, which are Mon-Fri 5am-10pm and Sat-Sun 7am-8pm." },
];

const fade = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.4 } }),
};

const Pricing = () => {
  const [yearly, setYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16">
        {/* Header */}
        <section className="py-20">
          <div className="container mx-auto px-4 text-center md:px-6">
            <h1 className="text-4xl font-bold text-foreground md:text-5xl">
              Invest in Your Body.{" "}
              <span className="text-gradient">Choose Your Plan.</span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              Whether you're just starting or pushing for elite performance, we have a membership tier designed for your goals. No hidden fees, cancel anytime.
            </p>

            {/* Toggle */}
            <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-border bg-card p-1.5">
              <button
                onClick={() => setYearly(false)}
                className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                  !yearly ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setYearly(true)}
                className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
                  yearly ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                Yearly -15%
              </button>
            </div>
          </div>
        </section>

        {/* Plans */}
        <section className="pb-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-6 md:grid-cols-3">
              {plans.map((plan, i) => (
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
                  <p className="mt-1 text-sm text-muted-foreground">{plan.desc}</p>
                  <div className="mt-6 mb-6">
                    <span className="text-4xl font-bold text-foreground">
                      ${yearly ? plan.yearly : plan.monthly}
                    </span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <button
                    className={`w-full rounded-lg py-3 text-sm font-semibold transition-all ${
                      plan.popular
                        ? "bg-primary text-primary-foreground hover:brightness-110"
                        : "border border-border text-foreground hover:border-primary/50"
                    }`}
                  >
                    {plan.popular ? "Join Pro Now" : `Select ${plan.name}`}
                  </button>
                  <div className="mt-8">
                    {plan.extra && (
                      <p className="mb-3 text-xs font-medium text-muted-foreground">{plan.extra}</p>
                    )}
                    <ul className="space-y-3">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-border py-24">
          <div className="container mx-auto px-4 md:px-6">
            <div className="mx-auto max-w-2xl">
              <h2 className="mb-2 text-3xl font-bold text-foreground text-center">Frequently Asked Questions</h2>
              <p className="mb-10 text-center text-muted-foreground">Got questions? We've got answers.</p>
              <div className="space-y-3">
                {faqs.map((faq, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-border bg-card overflow-hidden"
                  >
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="flex w-full items-center justify-between p-5 text-left"
                    >
                      <span className="text-sm font-medium text-foreground">{faq.q}</span>
                      <ChevronDown
                        className={`h-4 w-4 text-muted-foreground transition-transform ${
                          openFaq === i ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {openFaq === i && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="px-5 pb-5"
                      >
                        <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default Pricing;
