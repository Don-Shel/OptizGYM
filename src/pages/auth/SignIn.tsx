import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Dumbbell, Loader2, MailCheck } from "lucide-react";
import { authClient } from "@/lib/neon";
import { toast } from "sonner";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await authClient.signIn.email({
        email: email.trim().toLowerCase(),
        password,
        callbackURL: `${window.location.origin}/dashboard`,
        fetchOptions: { throw: true },
      });

      // AuthContext observes the new Neon session, synchronizes the member
      // profile, and AuthRoute redirects only after that state is ready.
      toast.success("Signed in successfully. Loading your dashboard…");
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "Sign-in failed. Check your email and password and try again.";
      toast.error(message);
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
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(hsl(84 81% 44%) 1px, transparent 1px), linear-gradient(90deg, hsl(84 81% 44%) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
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
            <h2 className="text-3xl font-bold text-foreground leading-tight">Train harder.<br /><span className="text-primary">Track smarter.</span></h2>
            <p className="mt-4 text-muted-foreground text-sm leading-relaxed">Access your personalized dashboard to manage classes, track workouts, and manage your membership — all in one place.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md space-y-6">
          <div className="flex flex-col items-center gap-2 lg:hidden">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30"><Dumbbell className="h-6 w-6 text-primary" /></div>
              <span className="text-2xl font-bold text-foreground">OptizGYM</span>
            </Link>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-8">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
              <p className="mt-2 text-sm text-muted-foreground">Sign in to access your dashboard.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-foreground">Email address</span>
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30" placeholder="you@example.com" />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-medium text-foreground">Password</span>
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30" placeholder="Your password" />
              </label>
              <button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60">
                {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in…</> : "Sign in"}
              </button>
            </form>

            <div className="mt-6 flex flex-col items-center gap-3 border-t border-border pt-5">
              <Link to="/auth/verify-email" className="group flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium text-muted-foreground transition hover:bg-primary/10 hover:text-foreground">
                <MailCheck className="h-3.5 w-3.5 text-primary" /> Need to verify your email?
              </Link>
              <Link to="/auth/forgot-password" className="text-xs text-muted-foreground transition hover:text-primary">Forgot your password?</Link>
              <p className="text-sm text-muted-foreground">Need an account? <Link to="/auth/sign-up" className="font-medium text-primary hover:underline">Create one</Link></p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SignIn;
