import React, { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, Link as RouterLink } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SocketProvider } from "@/contexts/SocketContext";
import { NeonAuthUIProvider } from "@neondatabase/auth-ui";
import { authClient } from "@/lib/neon";
import "@neondatabase/auth-ui/css";

// Lazy-loaded pages
const Index = lazy(() => import("./pages/Index"));
const Classes = lazy(() => import("./pages/Classes"));
const Trainers = lazy(() => import("./pages/Trainers"));
const Pricing = lazy(() => import("./pages/Pricing"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Auth pages
const SignIn = lazy(() => import("./pages/auth/SignIn"));
const SignUp = lazy(() => import("./pages/auth/SignUp"));
const VerifyEmail = lazy(() => import("./pages/auth/VerifyEmail"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));

// Member dashboard
const MemberDashboard = lazy(() => import("./pages/dashboard/MemberDashboard"));
const ClassBooking = lazy(() => import("./pages/dashboard/ClassBooking"));
const Membership = lazy(() => import("./pages/dashboard/Membership"));
const Payments = lazy(() => import("./pages/dashboard/Payments"));
const Progress = lazy(() => import("./pages/dashboard/Progress"));

// Admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminMembers = lazy(() => import("./pages/admin/AdminMembers"));
const AdminClasses = lazy(() => import("./pages/admin/AdminClasses"));
const AdminPayments = lazy(() => import("./pages/admin/AdminPayments"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// ── Loading Fallback ─────────────────────────────────────────────────────────

const LoadingFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
  </div>
);

// ── Protected Route ──────────────────────────────────────────────────────────
// Shows a spinner until auth state is fully resolved, then either renders
// children or redirects. This prevents a flash-redirect during session
// transitions (e.g. right after sign-in).

const ProtectedRoute = ({
  children,
  adminOnly = false,
  requiresMembership = false,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
  requiresMembership?: boolean;
}) => {
  const { isSignedIn, isLoaded, user } = useAuth();

  // Auth state still resolving — keep showing the spinner
  if (!isLoaded) return <LoadingFallback />;

  // Not signed in at all
  if (!isSignedIn) return <Navigate to="/auth/sign-in" replace />;

  // Signed in but email not yet verified
  if (!user!.isEmailVerified) return <Navigate to="/auth/verify-email" replace />;

  // Role check for admin-only routes
  if (adminOnly && user?.role !== "admin") return <Navigate to="/dashboard" replace />;

  // Training content requires a paid active membership. Keep the membership
  // page available so free/pending users have a clear upgrade path.
  const hasActiveMembership = user?.role === "admin"
    || (user?.membershipStatus === "active" && user?.plan !== "free");
  if (requiresMembership && !hasActiveMembership) {
    return <Navigate to="/dashboard/membership?required=active" replace />;
  }

  return <>{children}</>;
};

// ── Auth Route ───────────────────────────────────────────────────────────────
// Redirects already-authenticated users away from sign-in / sign-up pages.

const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { isSignedIn, isLoaded, user } = useAuth();

  if (!isLoaded) return <LoadingFallback />;

  if (isSignedIn) {
    // Fully verified → go straight to dashboard
    if (user?.isEmailVerified) return <Navigate to="/dashboard" replace />;
    // Signed in but unverified → must verify first
    return <Navigate to="/auth/verify-email" replace />;
  }

  return <>{children}</>;
};

// ── Routes ───────────────────────────────────────────────────────────────────

const AppRoutes = () => (
  <Suspense fallback={<LoadingFallback />}>
    <Routes>
      {/* ── Public ── */}
      <Route path="/" element={<Index />} />
      <Route path="/classes" element={<Classes />} />
      <Route path="/trainers" element={<Trainers />} />
      <Route path="/pricing" element={<Pricing />} />

      <Route path="/auth/sign-in/*" element={<AuthRoute><SignIn /></AuthRoute>} />
      <Route path="/auth/sign-up/*" element={<AuthRoute><SignUp /></AuthRoute>} />
      <Route path="/auth/verify-email/*" element={<VerifyEmail />} />
      <Route path="/auth/forgot-password/*" element={<ResetPassword />} />

      {/* Legacy redirects */}
      <Route path="/sign-in" element={<Navigate to="/auth/sign-in" replace />} />
      <Route path="/sign-up" element={<Navigate to="/auth/sign-up" replace />} />
      <Route path="/verify-email" element={<Navigate to="/auth/verify-email" replace />} />

      {/* ── Member Dashboard ── */}
      <Route path="/dashboard" element={<ProtectedRoute requiresMembership><MemberDashboard /></ProtectedRoute>} />
      <Route path="/dashboard/classes" element={<ProtectedRoute requiresMembership><ClassBooking /></ProtectedRoute>} />
      <Route path="/dashboard/membership" element={<ProtectedRoute><Membership /></ProtectedRoute>} />
      <Route path="/dashboard/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
      <Route path="/dashboard/progress" element={<ProtectedRoute requiresMembership><Progress /></ProtectedRoute>} />

      {/* ── Admin ── */}
      <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/members" element={<ProtectedRoute adminOnly><AdminMembers /></ProtectedRoute>} />
      <Route path="/admin/classes" element={<ProtectedRoute adminOnly><AdminClasses /></ProtectedRoute>} />
      <Route path="/admin/payments" element={<ProtectedRoute adminOnly><AdminPayments /></ProtectedRoute>} />
      <Route path="/admin/analytics" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />

      {/* ── Fallback ── */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
);

// ── App ──────────────────────────────────────────────────────────────────────

const AuthUIProviderWithRouter = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();

  return (
    <NeonAuthUIProvider
      authClient={authClient}
      navigate={navigate}
      Link={RouterLink}
      afterSignUpUrl="/auth/verify-email"
      afterSignInUrl="/dashboard"
      afterSignOutUrl="/"
    >
      {children}
    </NeonAuthUIProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      {/*
        Pass afterSignUpUrl and afterSignInUrl to NeonAuthUIProvider so the
        AuthView components know where to redirect after completing their flow.
        - sign-up  → /auth/verify-email  (user must verify before accessing the app)
        - sign-in  → /dashboard          (land directly on the dashboard)
      */}
      <AuthUIProviderWithRouter>
        <AuthProvider>
          <SocketProvider>
            <TooltipProvider>
              <div className="min-h-screen bg-background text-foreground font-sans antialiased">
                <AppRoutes />
                <Toaster />
                <Sonner position="top-right" closeButton richColors />
              </div>
            </TooltipProvider>
          </SocketProvider>
        </AuthProvider>
      </AuthUIProviderWithRouter>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
