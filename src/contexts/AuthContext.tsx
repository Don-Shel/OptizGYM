import {
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { authClient, getAuthToken } from '@/lib/neon';
import { API_BASE } from '@/lib/db';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  authId: string;
  email: string;
  isEmailVerified: boolean;
  fullName: string;
  role: 'member' | 'admin';
  plan: 'free' | 'basic' | 'pro' | 'elite';
  planBilling: 'monthly' | 'yearly';
  memberSince: string;
  avatar?: string;
  membershipStatus: 'active' | 'expired' | 'pending';
  expiresAt?: string;
}

interface AuthContextType {
  user: User | null;
  isSignedIn: boolean;
  isLoaded: boolean;
  isSyncing: boolean;
  syncError: string | null;
  signIn: () => void;
  signUp: () => void;
  signOut: () => void;
  getToken: () => Promise<string | null>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mapMember(data: any): User {
  return {
    id: data.id,
    authId: data.authUserId,
    email: data.email,
    isEmailVerified: data.isEmailVerified === 1 || data.isEmailVerified === true,
    fullName: data.fullName || 'User',
    role: data.role || 'member',
    plan: data.plan,
    planBilling: data.planBilling,
    memberSince: data.joinedAt,
    membershipStatus: data.membershipStatus,
    expiresAt: data.expiresAt,
  };
}

function extractSessionUser(sessionResponse: any): any {
  return (
    sessionResponse?.data?.user ||           // Neon Auth / better-auth convention
    sessionResponse?.data?.session?.user ||  // fallback
    null
  );
}

// ─── Provider ────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  /**
   * useSession() from BetterAuthReactAdapter fires whenever the Neon Auth
   * session changes (sign-in, sign-up, sign-out, verification).
   *
   * IMPORTANT: useSession() returns { data: { session, user }, isPending }.
   * The JWT token is NOT in this response — its structure differs from
   * getSession(). We use useSession() only as a reactive change trigger,
   * then call getSession() to obtain the actual JWT.
   */
  const sessionHook = (authClient as any).useSession?.() as
    | { data: { session: any; user?: any } | null; isPending: boolean }
    | undefined;

  const [user, setUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Prevent double-fetching for the same session
  const resolvedSessionId = useRef<string | null>(null);
  // Monotonically increasing request id prevents an older unauthenticated
  // profile request from overwriting a newer authenticated session.
  const profileRequestId = useRef(0);

  // ── Reliable token getter ─────────────────────────────────────────────────
  // Neon Auth issues short-lived JWTs through authClient.token().
  const getToken = useCallback(async (): Promise<string | null> => getAuthToken(), []);

  // ── Core profile fetch/sync ───────────────────────────────────────────────
  const fetchUserProfile = useCallback(async () => {
    const requestId = ++profileRequestId.current;
    setIsLoaded(false);

    try {
      const sessionResponse = await authClient.getSession();
      const token = await getAuthToken();
      const sessionUser = extractSessionUser(sessionResponse);

      if (requestId !== profileRequestId.current) return;

      if (!token) {
        console.warn('[AUTH] getSession() returned no token — waiting for token refresh');
        // Allow the same session to be resolved again when Neon Auth finishes
        // issuing the short-lived API JWT after sign-in/sign-up.
        resolvedSessionId.current = null;
        setUser(null);
        setIsLoaded(true);
        return;
      }

      if (requestId !== profileRequestId.current) return;

      setIsSyncing(true);
      setSyncError(null);

      console.log('[AUTH] Calling /api/members/me with token:', token.slice(0, 20) + '…');

      // 1. Try to load existing DB profile
      const meRes = await fetch(`${API_BASE}/members/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (meRes.ok) {
        const { data } = await meRes.json();
        if (requestId !== profileRequestId.current) return;
        setUser(mapMember(data));
        if (!data.isEmailVerified && data.email) {
          sessionStorage.setItem('pendingVerifyEmail', data.email);
        }
        return;
      }

      // 2. No DB record yet (first sign-up) — create it via /sync
      if (meRes.status === 404) {
        console.log('[AUTH] Member not in DB yet — running first-time sync…');
        const syncRes = await fetch(`${API_BASE}/members/sync`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: sessionUser?.email || '',
            fullName: sessionUser?.name || sessionUser?.displayName || '',
          }),
        });

        if (syncRes.ok) {
          const { data } = await syncRes.json();
          if (requestId !== profileRequestId.current) return;
          setUser(mapMember(data));
          if (!data.isEmailVerified && data.email) {
            sessionStorage.setItem('pendingVerifyEmail', data.email);
          }
          return;
        }

        console.error('[AUTH] /sync also failed — status:', syncRes.status);
        setUser(null);
        return;
      }

      // 3. Genuine auth error
      if (meRes.status === 401) {
        console.warn('[AUTH] /me returned 401 — token invalid or expired');
      } else {
        console.error('[AUTH] /me returned unexpected status:', meRes.status);
        setSyncError('Failed to load profile. Please refresh.');
      }
      setUser(null);
    } catch (err) {
      if (requestId !== profileRequestId.current) return;
      console.error('[AUTH] fetchUserProfile error:', err);
      setSyncError('Network error. Please refresh.');
      setUser(null);
    } finally {
      if (requestId === profileRequestId.current) {
        setIsSyncing(false);
        setIsLoaded(true);
      }
    }
  }, []);

  // ── React to session changes from useSession() hook ───────────────────────
  useEffect(() => {
    if (sessionHook === undefined) return; // hook not available — handled by fallback below

    if (sessionHook.isPending) {
      // Session still loading — keep spinner up
      setIsLoaded(false);
      return;
    }

    const sessionId = sessionHook.data?.session?.id as string | undefined;

    if (!sessionHook.data?.session) {
      // No session — signed out
      setUser(null);
      setIsLoaded(true);
      resolvedSessionId.current = null;
      return;
    }

    // Skip if we already resolved this exact session
    if (sessionId && sessionId === resolvedSessionId.current) return;
    resolvedSessionId.current = sessionId ?? null;

    // Reset loaded state while we fetch the profile for the new session
    setIsLoaded(false);
    fetchUserProfile();
  }, [
    sessionHook?.isPending,
    sessionHook?.data?.session?.id,
    fetchUserProfile,
  ]);

  // ── Fallback: one-time fetch if useSession() isn't available ──────────────
  useEffect(() => {
    if (sessionHook !== undefined) return; // useSession() is available — handled above

    fetchUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Public API ────────────────────────────────────────────────────────────

  const refreshUser = useCallback(async () => {
    resolvedSessionId.current = null;
    await fetchUserProfile();
  }, [fetchUserProfile]);

  const signIn = () => navigate('/auth/sign-in');
  const signUp = () => navigate('/auth/sign-up');

  const signOut = async () => {
    try {
      await authClient.signOut();
    } catch (err) {
      console.error('[AUTH] signOut error:', err);
    } finally {
      setUser(null);
      resolvedSessionId.current = null;
      sessionStorage.removeItem('pendingVerifyEmail');
      toast.success('Signed out successfully');
      navigate('/');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isSignedIn: !!user,
        isLoaded,
        isSyncing,
        syncError,
        signIn,
        signUp,
        signOut,
        getToken,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ─── Hook ────────────────────────────────────────────────────────────────────

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
