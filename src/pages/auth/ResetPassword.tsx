import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Dumbbell } from "lucide-react";
import { AuthView } from "@neondatabase/auth-ui";

const ResetPassword = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="flex flex-col items-center gap-2 mb-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
              <Dumbbell className="h-6 w-6 text-primary" />
            </div>
            <span className="text-2xl font-bold text-foreground tracking-tight">OptizGYM</span>
          </Link>
          <h1 className="text-xl font-semibold text-foreground">Reset Password</h1>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
          <AuthView pathname="forgot-password" />
        </div>

        <p className="text-center text-[10px] text-muted-foreground px-4">
          Enter your email to receive a password reset link.
        </p>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
