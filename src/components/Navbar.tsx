import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Dumbbell, Menu, X, LayoutDashboard, LogOut, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "Classes", path: "/classes" },
  { label: "Trainers", path: "/trainers" },
  { label: "Pricing", path: "/pricing" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isSignedIn, signOut } = useAuth();

  const handleSignOut = () => {
    signOut();
    setUserMenuOpen(false);
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2">
          <Dumbbell className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold text-foreground">OptizGYM</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.path} to={link.path}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === link.path ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          {isSignedIn && user ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-lg border border-border bg-card/80 px-3 py-2 text-sm transition-all hover:border-primary/30"
              >
                <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">{user.fullName?.charAt(0)}</span>
                </div>
                <span className="text-sm font-medium text-foreground">{user.fullName?.split(" ")[0]}</span>
                <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 top-11 z-50 min-w-[180px] rounded-xl border border-border bg-card shadow-xl py-1.5"
                  >
                    <div className="px-3 py-2 border-b border-border mb-1">
                      <p className="text-xs font-semibold text-foreground">{user.fullName}</p>
                      <p className="text-xs text-muted-foreground capitalize">{user.plan} Plan</p>
                    </div>
                    <Link to="/dashboard" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs text-foreground hover:bg-accent transition-colors">
                      <LayoutDashboard className="h-3.5 w-3.5 text-muted-foreground" /> My Dashboard
                    </Link>
                    {user.role === "admin" && (
                      <Link to="/admin" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs text-foreground hover:bg-accent transition-colors">
                        <Dumbbell className="h-3.5 w-3.5 text-muted-foreground" /> Admin Panel
                      </Link>
                    )}
                    <button onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors">
                      <LogOut className="h-3.5 w-3.5" /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <Link to="/auth/sign-in"
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-all hover:border-primary/40 hover:text-primary">
                Sign In
              </Link>
              <Link to="/auth/sign-up"
                className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-all hover:brightness-110">
                Join Now
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setOpen(!open)} className="text-foreground md:hidden">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="border-b border-border bg-background md:hidden overflow-hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-4">
              {navLinks.map((link) => (
                <Link key={link.path} to={link.path} onClick={() => setOpen(false)}
                  className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-primary ${
                    location.pathname === link.path ? "text-primary bg-primary/5" : "text-muted-foreground"
                  }`}>
                  {link.label}
                </Link>
              ))}
              <div className="pt-3 border-t border-border mt-2 space-y-2">
                {isSignedIn ? (
                  <>
                    <Link to="/dashboard" onClick={() => setOpen(false)}
                      className="flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/20 px-4 py-2.5 text-sm font-medium text-primary">
                      <LayoutDashboard className="h-4 w-4" /> My Dashboard
                    </Link>
                    <button onClick={() => { handleSignOut(); setOpen(false); }}
                      className="w-full rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-destructive transition-colors text-left">
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/sign-in" onClick={() => setOpen(false)}
                      className="block rounded-lg border border-border px-4 py-2.5 text-center text-sm font-medium text-foreground hover:border-primary/40 transition-colors">
                      Sign In
                    </Link>
                    <Link to="/sign-up" onClick={() => setOpen(false)}
                      className="block rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-semibold text-primary-foreground">
                      Join Now
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
