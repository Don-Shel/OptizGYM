/**
 * auth.ts — Authentication & Authorization Middleware
 * Uses Neon Auth JWT verification via JWKS.
 */

import { verifyNeonToken } from '../utils/neon';
import { db } from '../utils/db';
import { members } from '../db/schema';
import { eq, and, isNull } from 'drizzle-orm';

// ── requireAuth ───────────────────────────────────────────────────────────────

export const requireAuth = async (req: any, res: any, next: any) => {
  const correlationId = Math.random().toString(36).substring(7);

  try {
    // ── 1. Extract Bearer token ───────────────────────────────────────────
    const authHeader: string | undefined =
      req.headers.authorization || req.headers.Authorization;

    let token: string | null = null;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      const candidate = authHeader.slice(7).trim();
      if (candidate && candidate !== 'undefined' && candidate !== 'null') {
        token = candidate;
      }
    }

    if (!token) {
      console.warn(`[AUTH][${correlationId}] ✗ No Bearer token in request to ${req.method} ${req.path}`);
      return res.status(401).json({
        error: 'Unauthorized',
        reason: 'no-token',
        message: 'No authentication token provided.',
      });
    }

    console.log(`[AUTH][${correlationId}] → Verifying token for ${req.method} ${req.path}`);

    // ── 2. Verify JWT via Neon Auth JWKS ─────────────────────────────────
    let decoded: any;
    try {
      decoded = await verifyNeonToken(token);
    } catch (verifyError) {
      console.warn(
        `[AUTH][${correlationId}] ✗ JWT verification failed:`,
        verifyError instanceof Error ? verifyError.message : String(verifyError),
      );
      return res.status(401).json({
        error: 'Unauthorized',
        reason: 'invalid-token',
        message: 'Token could not be verified. Please sign in again.',
      });
    }

    if (!decoded?.sub) {
      console.warn(`[AUTH][${correlationId}] ✗ Token has no sub claim`);
      return res.status(401).json({
        error: 'Unauthorized',
        reason: 'invalid-token',
        message: 'Token is missing required claims.',
      });
    }

    // ── 3. Attach auth info to request ────────────────────────────────────
    req.auth = {
      userId: decoded.sub,
      email: decoded.email || '',
      email_verified: decoded.email_verified ?? false,
      name: decoded.name || '',
    };

    console.log(`[AUTH][${correlationId}] ✓ Token valid — userId: ${decoded.sub}`);

    // ── 4. Optionally attach DB member record for RBAC ────────────────────
    const [member] = await db
      .select()
      .from(members)
      .where(and(eq(members.authUserId, decoded.sub), isNull(members.deletedAt)))
      .limit(1);

    if (member) {
      req.member = member;
      console.log(`[AUTH][${correlationId}] ✓ DB member attached: ${member.id}`);
    }

    return next();
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[AUTH][${correlationId}] ✗ Unexpected middleware error:`, msg);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication middleware encountered an unexpected error.',
    });
  }
};

/**
 * Strict middleware that ensures a member profile exists in the database.
 * Use this for all dashboard and member-specific routes.
 */
export const requireMemberProfile = async (req: any, res: any, next: any) => {
  await requireAuth(req, res, () => {
    if (!req.member) {
      console.warn(`[AUTH] ✗ Missing member profile for auth user ${req.auth.userId}`);
      return res.status(403).json({
        error: 'Forbidden',
        reason: 'no-member-profile',
        message: 'A complete member profile is required to access this resource.',
      });
    }
    return next();
  });
};

// ── requireAdmin ──────────────────────────────────────────────────────────────

export const requireAdmin = async (req: any, res: any, next: any) => {
  await requireAuth(req, res, async () => {
    if (req.member?.role === 'admin') return next();
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  });
};

// ── requireSelf ───────────────────────────────────────────────────────────────

export const requireSelf = (paramName = 'memberId') => {
  return async (req: any, res: any, next: any) => {
    await requireAuth(req, res, async () => {
      const paramValue = req.params[paramName];

      if (!req.member) {
        return res.status(404).json({ error: 'Member profile not found' });
      }
      if (paramValue === req.auth.userId) return next();
      if (paramValue === req.member.id) return next();
      if (req.member.role === 'admin') return next();

      return res.status(403).json({ error: 'Forbidden: You can only access your own data' });
    });
  };
};

// ── requireRole ───────────────────────────────────────────────────────────────

export const requireRole = (roles: string | string[]) => {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return async (req: any, res: any, next: any) => {
    await requireAuth(req, res, async () => {
      if (req.member && allowed.includes(req.member.role ?? 'member')) return next();
      return res.status(403).json({
        error: `Forbidden: One of [${allowed.join(', ')}] roles required`,
      });
    });
  };
};
