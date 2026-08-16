import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Calendar, CreditCard, Dumbbell, Users,
  Settings, LogOut, ChevronLeft, ChevronRight, Shield,
  BarChart3, BookOpen, Activity, X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

const memberNav: NavItem[] = [
  { label: "Overview", path: "/dashboard", icon: LayoutDashboard },
  { label: "Book Classes", path: "/dashboard/classes", icon: Calendar },
  { label: "My Membership", path: "/dashboard/membership", icon: CreditCard },
  { label: "Payments", path: "/dashboard/payments", icon: BarChart3 },
  { label: "Workout Log", path: "/dashboard/progress", icon: Activity },
];

const adminNav: NavItem[] = [
  { label: "Admin Overview", path: "/admin", icon: Shield },
  { label: "Members", path: "/admin/members", icon: Users },
  { label: "Classes", path: "/admin/classes", icon: BookOpen },
  { label: "Trainers", path: "/admin/trainers", icon: Dumbbell },
  { label: "Payments", path: "/admin/payments", icon: CreditCard },
  { label: "Analytics", path: "/admin/analytics", icon: BarChart3 },
];

interface DashboardSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const DashboardSidebar = ({ collapsed, onToggle, mobileOpen, onMobileClose }: DashboardSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const isAdmin = user?.role === "admin";

  const handleSignOut = () => {
    signOut();
    navigate("/");
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={cn("flex h-16 items-center border-b border-border/50 px-4", collapsed ? "justify-center" : "justify-between")}>
        {!collapsed && (
          <Link to="/" className="flex items-center gap-2">
            <Dumbbell className="h-6 w-6 text-primary flex-shrink-0" />
            <span className="text-sm font-bold text-foreground">OptizGYM</span>
          </Link>
        )}
        {collapsed && <Dumbbell className="h-6 w-6 text-primary" />}
        <button
          onClick={onToggle}
          className="hidden lg:flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
        {onMobileClose && (
          <button onClick={onMobileClose} className="lg:hidden text-muted-foreground">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* User info */}
      {!collapsed && (
        <div className="px-4 py-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-primary">{user?.fullName?.charAt(0) || "U"}</span>
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-foreground truncate">{user?.fullName}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.plan} Plan</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {!collapsed && isAdmin && (
          <p className="px-3 mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Member</p>
        )}
        {memberNav.map((item) => (
          <NavLink key={item.path} item={item} collapsed={collapsed} active={location.pathname === item.path} />
        ))}
        {isAdmin && (
          <>
            {!collapsed && (
              <p className="px-3 mt-4 mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Admin</p>
            )}
            {adminNav.map((item) => (
              <NavLink key={item.path} item={item} collapsed={collapsed} active={location.pathname === item.path} />
            ))}
          </>
        )}
      </nav>

      {/* Bottom actions */}
      <div className="border-t border-border/50 p-2 space-y-1">
        <button
          onClick={handleSignOut}
          className={cn(
            "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && "Sign Out"}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="hidden lg:flex flex-col h-screen bg-card border-r border-border/50 overflow-hidden flex-shrink-0"
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={onMobileClose}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border/50 z-50 lg:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

const NavLink = ({ item, collapsed, active }: { item: NavItem; collapsed: boolean; active: boolean }) => (
  <Link
    to={item.path}
    className={cn(
      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150",
      collapsed && "justify-center",
      active
        ? "bg-primary/15 text-primary font-medium"
        : "text-muted-foreground hover:bg-accent hover:text-foreground"
    )}
  >
    <item.icon className="h-4 w-4 flex-shrink-0" />
    {!collapsed && <span>{item.label}</span>}
    {active && !collapsed && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
  </Link>
);

export default DashboardSidebar;
