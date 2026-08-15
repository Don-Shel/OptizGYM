import { useState, ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Bell, Check, ExternalLink } from "lucide-react";
import DashboardSidebar from "./DashboardSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/api/useNotifications";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

const DashboardLayout = ({ children, title, subtitle }: DashboardLayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { user, isLoaded, isSignedIn, syncError, refreshUser } = useAuth();
  const { notifications, unreadCount, markRead, isLoading: notificationsLoading } = useNotifications();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoaded && !isSignedIn) navigate("/sign-in");
  }, [isSignedIn, isLoaded, navigate]);

  if (!isLoaded) {
    return <div className="flex h-screen items-center justify-center bg-background"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  if (syncError || !user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background p-4 text-center">
        <div className="mb-4 rounded-full bg-destructive/10 p-3"><Bell className="h-6 w-6 text-destructive" /></div>
        <h2 className="text-xl font-bold text-foreground">Failed to load profile</h2>
        <p className="mt-2 max-w-md text-muted-foreground">{syncError || "We couldn't sync your profile data. This might be a temporary connection issue."}</p>
        <div className="mt-6 flex gap-3"><button onClick={() => refreshUser()} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Try Again</button><button onClick={() => navigate("/")} className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent">Go Home</button></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <DashboardSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-border/50 bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
          <div className="flex items-center gap-4"><button onClick={() => setMobileOpen(true)} className="lg:hidden text-muted-foreground hover:text-foreground"><Menu className="h-5 w-5" /></button>{title && <div><h1 className="text-base font-semibold text-foreground">{title}</h1>{subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}</div>}</div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button aria-label="Open notifications" onClick={() => setNotificationsOpen((open) => !open)} className="relative h-9 w-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"><Bell className="h-4 w-4" />{unreadCount > 0 && <span className="absolute -right-0.5 -top-0.5 min-w-4 h-4 rounded-full bg-primary px-1 text-[9px] font-bold leading-4 text-primary-foreground">{unreadCount > 9 ? '9+' : unreadCount}</span>}</button>
              {notificationsOpen && <>
                <button aria-label="Close notifications" className="fixed inset-0 z-30 cursor-default" onClick={() => setNotificationsOpen(false)} />
                <motion.div initial={{ opacity: 0, y: -6, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="absolute right-0 top-11 z-40 w-[min(90vw,360px)] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
                  <div className="flex items-center justify-between border-b border-border px-4 py-3"><div><p className="text-sm font-semibold text-foreground">Notifications</p><p className="text-[11px] text-muted-foreground">Live updates from OptizGYM</p></div>{unreadCount > 0 && <span className="text-[11px] font-semibold text-primary">{unreadCount} unread</span>}</div>
                  <div className="max-h-80 overflow-y-auto">{notificationsLoading ? <div className="p-6 text-center text-xs text-muted-foreground">Loading notifications…</div> : notifications.length === 0 ? <div className="p-6 text-center text-xs text-muted-foreground">You’re all caught up.</div> : notifications.slice(0, 12).map((notification: any) => <button key={notification.id} onClick={() => { if (!notification.isRead) markRead.mutate(notification.id); }} className={cn("w-full border-b border-border/50 px-4 py-3 text-left transition-colors hover:bg-accent/40", !notification.isRead && "bg-primary/5")}><div className="flex gap-3"><div className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", notification.isRead ? "bg-muted" : "bg-primary")} /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className="text-xs font-semibold text-foreground">{notification.title}</p>{notification.isRead ? <Check className="h-3 w-3 text-muted-foreground" /> : <span className="text-[10px] text-muted-foreground">New</span>}</div><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{notification.message}</p><p className="mt-2 text-[10px] text-muted-foreground/70">{notification.createdAt ? new Date(notification.createdAt).toLocaleString() : ''}</p></div></div></button>)}</div>
                  <button onClick={() => navigate('/dashboard/classes')} className="flex w-full items-center justify-center gap-1 border-t border-border px-4 py-3 text-xs font-semibold text-primary hover:bg-primary/5">Explore classes <ExternalLink className="h-3 w-3" /></button>
                </motion.div>
              </>}
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-accent/50 px-3 py-1.5"><div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center"><span className="text-xs font-bold text-primary">{user.fullName?.charAt(0)}</span></div><span className="hidden text-xs font-medium text-foreground sm:block">{user.fullName}</span></div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6"><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>{children}</motion.div></main>
      </div>
    </div>
  );
};

export default DashboardLayout;
