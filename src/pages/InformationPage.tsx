import { ArrowLeft, CheckCircle2, Dumbbell, Mail, MapPin, Phone } from "lucide-react";
import { Link, Navigate, useParams } from "react-router-dom";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

type InformationSlug =
  | "about"
  | "careers"
  | "press"
  | "blog"
  | "contact"
  | "terms"
  | "privacy"
  | "faqs"
  | "cookies";

type InformationPageContent = {
  eyebrow: string;
  title: string;
  intro: string;
  sections: Array<{ heading: string; body: string }>;
};

const pageContent: Record<InformationSlug, InformationPageContent> = {
  about: {
    eyebrow: "The OptizGYM standard",
    title: "Training built around your best performance.",
    intro: "OptizGYM brings expert coaching, purposeful programming, and a welcoming training community together in one place.",
    sections: [
      { heading: "A clearer way to train", body: "From your first class to your long-term goals, our team helps you build consistent habits with practical guidance and measurable progress." },
      { heading: "People first, always", body: "Our coaches and staff are here to make every visit feel focused, safe, and worth your time—whether you are learning the basics or preparing for your next milestone." },
    ],
  },
  careers: {
    eyebrow: "Join the team",
    title: "Help people move with confidence.",
    intro: "We are building a team of thoughtful coaches, operators, and community leaders who care about the details that make training better.",
    sections: [
      { heading: "Open opportunities", body: "We are currently accepting expressions of interest for coaching, member experience, and operations roles. Send your CV and a short introduction to hello@optizgym.com." },
      { heading: "What we value", body: "We look for people who are curious, dependable, inclusive, and committed to helping members make sustainable progress." },
    ],
  },
  press: {
    eyebrow: "OptizGYM news",
    title: "Press and media information.",
    intro: "For announcements, interviews, partnership requests, and approved brand assets, contact our team directly.",
    sections: [
      { heading: "Media enquiries", body: "Email hello@optizgym.com with your publication, deadline, topic, and contact details. We will route your request to the appropriate team member." },
      { heading: "Brand assets", body: "Please request current logos and photography before publishing so that your story uses the correct OptizGYM materials." },
    ],
  },
  blog: {
    eyebrow: "The training journal",
    title: "Practical ideas for training smarter.",
    intro: "Explore coaching principles, recovery habits, class guides, and member stories from the OptizGYM community.",
    sections: [
      { heading: "Start with the live schedule", body: "Use the public Classes page to compare upcoming sessions by category, intensity, duration, trainer, and location." },
      { heading: "Keep your progress moving", body: "Members can sign in to track workouts, manage their membership, review payments, and keep up with important notifications." },
    ],
  },
  contact: {
    eyebrow: "We are here to help",
    title: "Contact the OptizGYM team.",
    intro: "Have a question about classes, memberships, or your account? Choose the most convenient way to reach us.",
    sections: [
      { heading: "Contact center", body: "For account and membership support, email hello@optizgym.com or call +1 (555) 123-4567. Include the email address on your account so we can help you faster." },
      { heading: "Visit us", body: "123 Fitness Blvd, Muscle City, CA 90210. Check the live classes schedule before visiting for a coached session." },
    ],
  },
  terms: {
    eyebrow: "Legal",
    title: "Terms of Service.",
    intro: "These terms explain the basic rules for using OptizGYM services, classes, memberships, and this website.",
    sections: [
      { heading: "Using the service", body: "Please provide accurate account information, keep your credentials private, and follow the instructions of OptizGYM staff and coaches while using our facilities or services." },
      { heading: "Memberships and bookings", body: "Membership access, class availability, cancellations, and payment terms are presented during checkout or booking. Contact the team if you need help understanding a charge or booking." },
    ],
  },
  privacy: {
    eyebrow: "Legal",
    title: "Privacy Policy.",
    intro: "We use account and activity information to provide authentication, memberships, class bookings, payments, notifications, and support.",
    sections: [
      { heading: "Information we use", body: "This may include your verified account identity, contact details, membership status, bookings, workouts, and payment status. Payment card details are handled by the payment provider rather than stored by OptizGYM." },
      { heading: "Your choices", body: "Contact hello@optizgym.com to ask about your account information, update your profile, or request help with privacy questions." },
    ],
  },
  faqs: {
    eyebrow: "Support",
    title: "Frequently asked questions.",
    intro: "Find quick answers to common questions about joining, booking, payments, and account access.",
    sections: [
      { heading: "How do I join a class?", body: "Browse the public Classes page, sign in or create an account, choose an eligible session, and complete the booking flow shown on screen." },
      { heading: "How do I manage my membership?", body: "After signing in, open Dashboard → Membership to review plans and billing. Payment verification is completed against the server-created payment reference." },
      { heading: "I cannot access my dashboard", body: "Confirm that you are using the same verified email account used during registration. If the problem continues, contact the support team from the Contact Center page." },
    ],
  },
  cookies: {
    eyebrow: "Legal",
    title: "Cookie information.",
    intro: "OptizGYM uses essential browser storage and session mechanisms to keep authentication and application preferences working.",
    sections: [
      { heading: "Essential storage", body: "Authentication sessions, verification state, and application preferences may be stored or accessed to provide features you request, such as signing in and keeping your dashboard session active." },
      { heading: "Questions", body: "For questions about cookies or browser storage, contact hello@optizgym.com." },
    ],
  },
};

const InformationPage = ({ slug: slugProp }: { slug?: InformationSlug }) => {
  const { slug: routeSlug } = useParams<{ slug: InformationSlug }>();
  const slug = slugProp || routeSlug;
  const content = slug ? pageContent[slug] : undefined;

  if (!content) return <Navigate to="/404" replace />;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pb-24 pt-32 md:px-6">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
        <div className="mt-12 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">{content.eyebrow}</p>
          <h1 className="mt-3 text-4xl font-extrabold leading-tight text-foreground md:text-6xl">{content.title}</h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">{content.intro}</p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-2">
          {content.sections.map((section) => (
            <section key={section.heading} className="rounded-2xl border border-border bg-card p-7 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold text-foreground">{section.heading}</h2>
              </div>
              <p className="text-sm leading-7 text-muted-foreground">{section.body}</p>
            </section>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap gap-3">
          <Link to="/classes" className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110">Browse classes</Link>
          <Link to="/pricing" className="rounded-lg border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:border-primary/50">View membership plans</Link>
          <Link to="/auth/sign-in" className="rounded-lg border border-border px-5 py-3 text-sm font-semibold text-foreground transition hover:border-primary/50">Sign in</Link>
        </div>
        {slug === "contact" && (
          <div className="mt-12 grid gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-6 text-sm text-muted-foreground sm:grid-cols-3">
            <a className="flex items-center gap-3 hover:text-primary" href="mailto:hello@optizgym.com"><Mail className="h-4 w-4 text-primary" />hello@optizgym.com</a>
            <a className="flex items-center gap-3 hover:text-primary" href="tel:+15551234567"><Phone className="h-4 w-4 text-primary" />+1 (555) 123-4567</a>
            <a className="flex items-center gap-3 hover:text-primary" href="https://www.google.com/maps/search/?api=1&query=123+Fitness+Blvd+Muscle+City+CA+90210" target="_blank" rel="noreferrer"><MapPin className="h-4 w-4 text-primary" />Find us on the map</a>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default InformationPage;
