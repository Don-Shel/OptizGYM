import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Dumbbell, Loader2, MailCheck } from "lucide-react";
import { authClient } from "@/lib/neon";
import { toast } from "sonner";

const SignIn = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      toast.error("Enter your email and password to continue.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Deliberately omit callbackURL. Email/password sign-in does not need a
      // server redirect, and relative callbackURL values are rejected by
      // Neon Auth when the request originates from the Vercel domain.
      await authClient.signIn.email({
        email: normalizedEmail,
        password,
        rememberMe: true,
        fetchOptions: { throw: true },
      });

      // Neon Auth updates its session hook asynchronously. Explicitly refresh
      // the member profile here so the route guard has a user before navigation.
      await refreshUser();
      toast.success("Signed in successfully.");
      navigate("/dashboard", { replace: true });
    } catch {
      toast.error("Sign-in failed. Check your email and password and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex lg:w-[40%] relative items-center justify-center bg-gradient-to-br from-primary/10 via-background to-background overflow-hidden border-r border-border/50">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full bg-emerald-500/5 blur-3xl" />
        </div>
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(hsl(84 81% 44%) 1px, transparent 1px), linear-gradient(90deg, hsl(84 81% 44%) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative z-10 max-w-sm space-y-8 px-12">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 border border-primary/30">
              <Dumbbell className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">OptizGYM</p>
              <p className="text-xs text-muted-foreground">Performance Platform</p>
            </div>
          </Link>
          <div>
            <h2 className="text-3xl font-bold text-foreground leading-tight">
              Train harder.<br />
              <span className="text-primary">Track smarter.</span>
            </h2>
            <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
              Access your personalized dashboard to manage classes, track workouts, and manage your membership — all in one place.
            </p>
          </div>
          <div className="space-y-3">
            {["Book classes in seconds", "Track your workout progress", "Manage payments & billing"].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                </div>
                <span className="text-sm text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md space-y-6"
        >
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-8">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
              <p className="mt-2 text-sm text-muted-foreground">Sign in to access your OptizGYM dashboard.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-foreground">Email address</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder="you@example.com"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-foreground">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder="Your password"
                />
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</> : "Sign in"}
              </button>
            </form>
          </div>

          <div className="flex flex-col items-center gap-3">
            <Link
              to="/auth/verify-email"
              className="group flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all duration-300"
            >
              <div className="p-1 rounded-full bg-background group-hover:bg-primary/20 transition-colors">
                <MailCheck className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                Need to verify your email?
              </span>
            </Link>

            <Link
              to="/auth/forgot-password"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Forgot your password?
            </Link>

            <p className="text-sm text-muted-foreground">
              New to OptizGYM? <Link to="/auth/sign-up" className="font-medium text-primary hover:underline">Create an account</Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SignIn;
