/**
 * auth.ts — Authentication & Authorization Middleware
 * Uses Neon Auth JWT verification via JWKS.
 */

import { verifyNeonToken } from '../utils/neon';
import { db } from '../utils/db';
import { members } from '../db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { failResponse } from '../utils/responses';

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
      return failResponse(res, 401, 'AUTH_REQUIRED', 'Please sign in again.');
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
      return failResponse(res, 401, 'AUTH_INVALID', 'Your session is no longer valid. Please sign in again.');
    }

    if (!decoded?.sub) {
      console.warn(`[AUTH][${correlationId}] ✗ Token has no sub claim`);
      return failResponse(res, 401, 'AUTH_INVALID', 'Your session is no longer valid. Please sign in again.');
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
    return failResponse(res, 500, 'INTERNAL_ERROR', 'An unexpected server error occurred.');
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
      return failResponse(res, 403, 'MEMBER_PROFILE_REQUIRED', 'A complete member profile is required to access this resource.');
    }
    return next();
  });
};

// ── requireAdmin ──────────────────────────────────────────────────────────────

export const requireAdmin = async (req: any, res: any, next: any) => {
  await requireAuth(req, res, async () => {
    if (req.member?.role === 'admin') return next();
    return failResponse(res, 403, 'ADMIN_REQUIRED', 'Administrator access is required for this action.');
  });
};

// ── requireSelf ───────────────────────────────────────────────────────────────

export const requireSelf = (paramName = 'memberId') => {
  return async (req: any, res: any, next: any) => {
    await requireAuth(req, res, async () => {
      const paramValue = req.params[paramName];

      if (!req.member) {
        return failResponse(res, 404, 'NOT_FOUND', 'The requested member profile was not found.');
      }
      if (paramValue === req.auth.userId) return next();
      if (paramValue === req.member.id) return next();
      if (req.member.role === 'admin') return next();

      return failResponse(res, 403, 'FORBIDDEN', 'You do not have permission to access this resource.');
    });
  };
};

// ── requireRole ───────────────────────────────────────────────────────────────

export const requireRole = (roles: string | string[]) => {
  const allowed = Array.isArray(roles) ? roles : [roles];
  return async (req: any, res: any, next: any) => {
    await requireAuth(req, res, async () => {
      if (req.member && allowed.includes(req.member.role ?? 'member')) return next();
      return failResponse(res, 403, 'FORBIDDEN', 'You do not have permission to access this resource.');
    });
  };
};
