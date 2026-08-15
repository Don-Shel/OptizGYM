import { useEffect, useState, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, Loader2, CheckCircle2, AlertCircle, Mail, RefreshCw } from "lucide-react";
import { authClient } from "@/lib/neon";
import { toast } from "sonner";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // ── Token-based verification (clicked link in email) ──────────────────────
  const token = searchParams.get("token");

  // ── OTP manual entry state ────────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [phase, setPhase] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  // Pre-fill email from sessionStorage (set by SignUp on redirect)
  useEffect(() => {
    const stored = sessionStorage.getItem("pendingVerifyEmail");
    if (stored) setEmail(stored);
  }, []);

  // ── Auto-verify when a token is present in the URL ───────────────────────
  useEffect(() => {
    if (!token) return;

    const autoVerify = async () => {
      setPhase("verifying");
      try {
        const result = await authClient.verifyEmail({
          query: {
            token,
            callbackURL: `${window.location.origin}/auth/sign-in`,
          },
          fetchOptions: { throw: true },
        });
        if (result?.error) throw new Error(result.error.message || "Verification failed");

        sessionStorage.removeItem("pendingVerifyEmail");
        setPhase("success");
        toast.success("Email verified! Redirecting to sign in…");

        setTimeout(() => navigate("/auth/sign-in", { replace: true }), 2500);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Verification failed. The link may have expired.");
        setPhase("error");
      }
    };

    autoVerify();
  }, [token, navigate]);

  // ── OTP digit input handlers ──────────────────────────────────────────────
  const handleDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = [...code];
    pasted.split("").forEach((ch, i) => { next[i] = ch; });
    setCode(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const fullCode = code.join("");

  // ── Submit OTP ────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email address.");
      return;
    }
    if (fullCode.length !== 6) {
      toast.error("Please enter the complete 6-digit code.");
      return;
    }

    setPhase("verifying");
    setErrorMsg(null);

    try {
      // Neon Auth / better-auth: verify email OTP
      const result = await authClient.emailOtp.verifyEmail({
        email: email.trim().toLowerCase(),
        otp: fullCode,
        fetchOptions: { throw: true },
      });

      if (result?.error) throw new Error(result.error.message || "Invalid or expired code.");

      sessionStorage.removeItem("pendingVerifyEmail");
      setPhase("success");
      toast.success("Email verified! Redirecting to sign in…");

      // Sign out the temporary unverified session before redirecting
      try { await authClient.signOut(); } catch (_) {}

      setTimeout(() => navigate("/auth/sign-in", { replace: true }), 2500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Invalid or expired code. Please try again.";
      setErrorMsg(msg);
      setPhase("error");
      toast.error(msg);
    }
  };

  // ── Resend code ───────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (!email.trim()) {
      toast.error("Enter your email address first.");
      return;
    }
    setResending(true);
    try {
      await authClient.emailOtp.sendVerificationOtp({
        email: email.trim().toLowerCase(),
        type: "email-verification",
        fetchOptions: { throw: true },
      });
      toast.success("A new 6-digit verification code has been sent to your email.");
      setCode(["", "", "", "", "", ""]);
      setPhase("idle");
      setErrorMsg(null);
      inputRefs.current[0]?.focus();
    } catch {
      toast.error("Failed to resend code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  // ── Token-based UI (loading / success / error) ────────────────────────────
  if (token) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md space-y-8"
        >
          <LogoHeader />

          <div className="bg-card border border-border rounded-2xl p-10 shadow-xl text-center space-y-6">
            <AnimatePresence mode="wait">
              {phase === "verifying" && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 py-4">
                  <Loader2 className="h-12 w-12 text-primary animate-spin" />
                  <p className="text-muted-foreground font-medium">Verifying your email…</p>
                </motion.div>
              )}
              {phase === "success" && <SuccessState />}
              {phase === "error" && (
                <motion.div key="error" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4 py-4">
                  <div className="h-16 w-16 rounded-full bg-destructive/20 flex items-center justify-center">
                    <AlertCircle className="h-10 w-10 text-destructive" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold text-foreground">Verification Failed</h2>
                    <p className="text-sm text-destructive">{errorMsg}</p>
                    <p className="text-xs text-muted-foreground pt-1">The link may have expired. Enter your code manually below.</p>
                  </div>
                  <Link to="/auth/verify-email" className="text-primary hover:underline text-sm font-medium">
                    Enter code manually →
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Manual OTP entry UI ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md space-y-8"
      >
        <LogoHeader />

        <AnimatePresence mode="wait">
          {phase === "success" ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-border rounded-2xl p-10 shadow-xl text-center"
            >
              <SuccessState />
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-card border border-border rounded-2xl p-8 shadow-xl space-y-7"
            >
              {/* Header */}
              <div className="text-center space-y-1">
                <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Mail className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Check your email</h2>
                <p className="text-sm text-muted-foreground">
                  We sent a 6-digit verification code to
                  {email ? <> <span className="font-medium text-foreground">{email}</span></> : " your email address"}.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition"
                  />
                </div>

                {/* OTP boxes */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Verification code</label>
                  <div className="flex gap-2 justify-between" onPaste={handlePaste}>
                    {code.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { inputRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleDigit(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                        className={`
                          h-13 w-full rounded-xl border text-center text-xl font-bold tracking-widest
                          bg-background text-foreground
                          focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                          transition
                          ${phase === "error" ? "border-destructive" : "border-border"}
                          ${digit ? "border-primary/60 bg-primary/5" : ""}
                        `}
                        style={{ height: "52px" }}
                        disabled={phase === "verifying"}
                      />
                    ))}
                  </div>
                  {phase === "error" && errorMsg && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-destructive flex items-center gap-1 pt-0.5"
                    >
                      <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                      {errorMsg}
                    </motion.p>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={phase === "verifying" || fullCode.length !== 6}
                  className="w-full rounded-xl bg-primary text-primary-foreground font-semibold py-2.5 text-sm transition hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {phase === "verifying" ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Verifying…</>
                  ) : (
                    "Verify Email"
                  )}
                </button>
              </form>

              {/* Resend */}
              <div className="text-center border-t border-border pt-5">
                <p className="text-sm text-muted-foreground">
                  Didn't receive a code?{" "}
                  <button
                    onClick={handleResend}
                    disabled={resending}
                    className="text-primary font-medium hover:underline disabled:opacity-50 inline-flex items-center gap-1"
                  >
                    {resending ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Sending…</> : "Resend code"}
                  </button>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Already verified?{" "}
                  <Link to="/auth/sign-in" className="text-primary hover:underline font-medium">
                    Sign in
                  </Link>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-[10px] text-muted-foreground px-4">
          Check your spam folder if you haven't received the code. Codes expire after 10 minutes.
        </p>
      </motion.div>
    </div>
  );
};

// ── Shared sub-components ─────────────────────────────────────────────────────

const LogoHeader = () => (
  <div className="flex flex-col items-center gap-2">
    <Link to="/" className="flex items-center gap-2">
      <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
        <Dumbbell className="h-6 w-6 text-primary" />
      </div>
      <span className="text-2xl font-bold text-foreground tracking-tight">OptizGYM</span>
    </Link>
    <p className="text-muted-foreground text-sm">Verify your email address</p>
  </div>
);

const SuccessState = () => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center gap-4 py-4"
  >
    <div className="h-16 w-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
      <CheckCircle2 className="h-10 w-10 text-emerald-500" />
    </div>
    <div className="space-y-1 text-center">
      <h2 className="text-2xl font-bold text-foreground">Verified!</h2>
      <p className="text-muted-foreground text-sm">Your email is confirmed. Redirecting you to sign in…</p>
    </div>
  </motion.div>
);

export default VerifyEmail;
