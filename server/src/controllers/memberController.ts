import { Request, Response } from 'express';
import { db } from '../utils/db';
import { members } from '../db/schema';
import { successResponse, errorResponse } from '../utils/responses';
import { eq, and, isNull } from 'drizzle-orm';

export const syncMember = async (req: any, res: Response) => {
  const authUserId = req.auth.userId;
  const MAX_RETRIES = 3;

  // Extract verification status from Neon Auth token claims
  const isEmailVerified = req.auth.email_verified === true ? 1 : 0;

  console.log(`[SYNC] → Authentication flow started for auth_user_id: ${authUserId}, verified: ${isEmailVerified}`);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // 1. Extract info from the decoded token
      const email = String(req.auth.email || '').trim().toLowerCase();
      const fullName = String(req.auth.name || '').trim() || null;

      const effectiveEmail = email || req.body.email;

      if (!effectiveEmail) {
        console.error(`[SYNC] ✗ Auth user ${authUserId} has no email address`);
        return errorResponse(res, 'User has no email address', 422);
      }

      // 2. Check for existing member in database
      const [existingMember] = await db
        .select()
        .from(members)
        .where(and(eq(members.authUserId, authUserId), isNull(members.deletedAt)))
        .limit(1);

      let member;
      if (existingMember) {
        console.log(`[SYNC] → Existing member found: ${existingMember.id}. Resolving conflicts...`);

        const [updatedMember] = await db
          .update(members)
          .set({
            email: effectiveEmail.trim().toLowerCase(),
            fullName: fullName || existingMember.fullName,
            isEmailVerified,
            updatedAt: new Date()
          })
          .where(eq(members.id, existingMember.id))
          .returning();

        member = updatedMember;
        console.log(`[SYNC] ✓ Member profile resolved from database: ${member.id}`);
      } else {
        console.log(`[SYNC] → No existing member. Creating new record for ${authUserId}`);

        const [newMember] = await db.insert(members).values({
          authUserId,
          email: effectiveEmail,
          isEmailVerified: isEmailVerified,
          fullName: fullName || req.body.fullName || null,
          phone: req.body.phone || null,
          role: 'member',
          plan: 'free',
          planBilling: 'monthly',
          membershipStatus: 'pending'
        }).returning();

        member = newMember;
        console.log(`[SYNC] ✓ New member created and saved to database: ${member.id}`);
      }

      const isNew = !existingMember;
      return successResponse(res, member, isNew ? 201 : 200);
    } catch (error) {
      console.error(`[SYNC] ✗ Sync attempt ${attempt} failed:`, error);
      if (attempt === MAX_RETRIES) {
        return errorResponse(res, 'Failed to sync user after multiple attempts', 500, error);
      }
      await new Promise(r => setTimeout(r, 200 * attempt));
    }
  }
};

export const getAllMembers = async (req: Request, res: Response) => {
  try {
    const allMembers = await db.select().from(members).where(isNull(members.deletedAt));
    return successResponse(res, allMembers);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch members', 500, error);
  }
};

export const getMe = async (req: any, res: Response) => {
  try {
    const authId = req.auth.userId;
    const [member] = await db.select().from(members).where(
      and(eq(members.authUserId, authId), isNull(members.deletedAt))
    );

    if (!member) {
      return errorResponse(res, 'Member not found', 404, { reason: 'Profile not yet created' });
    }

    // Refresh identity fields from the verified Neon token on every profile read.
    // This repairs stale names/emails after a user edits their Neon Auth profile,
    // and also updates the verification flag after the email link is consumed.
    const isEmailVerified = req.auth.email_verified === true ? 1 : 0;
    const nextEmail = String(req.auth.email || member.email || '').trim().toLowerCase();
    const nextFullName = String(req.auth.name || member.fullName || '').trim() || null;
    const identityChanged = member.email !== nextEmail
      || member.fullName !== nextFullName
      || member.isEmailVerified !== isEmailVerified;

    if (identityChanged) {
      const [updated] = await db.update(members)
        .set({
          email: nextEmail,
          fullName: nextFullName,
          isEmailVerified,
          updatedAt: new Date(),
        })
        .where(eq(members.id, member.id))
        .returning();
      return successResponse(res, updated);
    }

    return successResponse(res, member);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch profile', 500, error);
  }
};

export const updateMyProfile = async (req: any, res: Response) => {
  try {
    if (!req.member) return errorResponse(res, 'Member profile not found', 404);

    const [updated] = await db.update(members)
      .set({
        phone: String(req.body.phone ?? '').trim() || null,
        updatedAt: new Date(),
      })
      .where(and(eq(members.id, req.member.id), isNull(members.deletedAt)))
      .returning();

    if (!updated) return errorResponse(res, 'Member profile not found', 404);
    return successResponse(res, updated);
  } catch (error) {
    return errorResponse(res, 'Failed to update profile', 500, error);
  }
};

export const createMember = async (req: any, res: Response) => {
  try {
    const authId = req.auth.userId;
    const isEmailVerified = req.auth.email_verified === true ? 1 : 0;

    // Check if already exists
    const [existing] = await db.select().from(members).where(
      and(eq(members.authUserId, authId), isNull(members.deletedAt))
    );

    if (existing) {
      return successResponse(res, existing, 200);
    }

    const [newMember] = await db.insert(members).values({
      authUserId: authId,
      email: req.body.email,
      isEmailVerified,
      fullName: req.body.fullName,
      phone: req.body.phone,
      role: 'member',
      plan: 'free',
      planBilling: 'monthly',
      membershipStatus: 'pending'
    }).returning();

    return successResponse(res, newMember, 201);
  } catch (error) {
    return errorResponse(res, 'Failed to create member', 500, error);
  }
};

const isDuplicateMemberError = (error: unknown) => (
  typeof error === 'object'
  && error !== null
  && 'code' in error
  && (error as { code?: string }).code === '23505'
);

export const createMemberAdmin = async (req: any, res: Response) => {
  try {
    const [existing] = await db.select().from(members).where(
      and(eq(members.authUserId, req.body.authUserId), isNull(members.deletedAt))
    ).limit(1);
    if (existing) return errorResponse(res, 'A member profile already exists for this Neon Auth user', 409);

    const [created] = await db.insert(members).values({
      authUserId: req.body.authUserId.trim(),
      email: req.body.email.trim().toLowerCase(),
      fullName: req.body.fullName.trim(),
      phone: req.body.phone?.trim() || null,
      plan: req.body.plan,
      planBilling: req.body.planBilling,
      membershipStatus: req.body.membershipStatus,
      isEmailVerified: req.body.isEmailVerified ? 1 : 0,
      role: 'member',
    }).returning();
    return successResponse(res, created, 201);
  } catch (error) {
    if (isDuplicateMemberError(error)) return errorResponse(res, 'A member with this Auth ID or email already exists', 409);
    return errorResponse(res, 'Failed to create member profile', 500, error);
  }
};

const allowedPlans = new Set(['free', 'basic', 'pro', 'elite']);
const allowedStatuses = new Set(['active', 'pending', 'expired', 'cancelled']);

export const updateMemberAdmin = async (req: any, res: Response) => {
  try {
    const { fullName, phone, plan, planBilling, membershipStatus, role, isEmailVerified } = req.body;
    if (plan !== undefined && !allowedPlans.has(plan)) return errorResponse(res, 'Invalid plan', 422);
    if (membershipStatus !== undefined && !allowedStatuses.has(membershipStatus)) return errorResponse(res, 'Invalid membership status', 422);
    if (planBilling !== undefined && !['monthly', 'yearly'].includes(planBilling)) return errorResponse(res, 'Invalid billing cycle', 422);
    if (role !== undefined && !['member', 'admin'].includes(role)) return errorResponse(res, 'Invalid role', 422);

    const [updated] = await db.update(members).set({
      ...(fullName !== undefined ? { fullName: String(fullName).trim() || null } : {}),
      ...(phone !== undefined ? { phone: String(phone).trim() || null } : {}),
      ...(plan !== undefined ? { plan } : {}),
      ...(planBilling !== undefined ? { planBilling } : {}),
      ...(membershipStatus !== undefined ? { membershipStatus } : {}),
      ...(role !== undefined ? { role } : {}),
      ...(isEmailVerified !== undefined ? { isEmailVerified: isEmailVerified ? 1 : 0 } : {}),
      updatedAt: new Date(),
    }).where(and(eq(members.id, req.params.id), isNull(members.deletedAt))).returning();

    if (!updated) return errorResponse(res, 'Member not found', 404);
    return successResponse(res, updated);
  } catch (error) {
    return errorResponse(res, 'Failed to update member', 500, error);
  }
};

export const suspendMember = async (req: any, res: Response) => {
  try {
    const [updated] = await db.update(members).set({
      membershipStatus: 'expired',
      expiresAt: new Date(),
      updatedAt: new Date(),
    }).where(and(eq(members.id, req.params.id), isNull(members.deletedAt))).returning();
    if (!updated) return errorResponse(res, 'Member not found', 404);
    return successResponse(res, updated);
  } catch (error) {
    return errorResponse(res, 'Failed to suspend member', 500, error);
  }
};

export const activateMember = async (req: any, res: Response) => {
  try {
    const [updated] = await db.update(members).set({
      membershipStatus: 'active',
      ...(req.body?.plan && allowedPlans.has(req.body.plan) ? { plan: req.body.plan } : {}),
      ...(req.body?.planBilling && ['monthly', 'yearly'].includes(req.body.planBilling) ? { planBilling: req.body.planBilling } : {}),
      updatedAt: new Date(),
    }).where(and(eq(members.id, req.params.id), isNull(members.deletedAt))).returning();
    if (!updated) return errorResponse(res, 'Member not found', 404);
    return successResponse(res, updated);
  } catch (error) {
    return errorResponse(res, 'Failed to activate member profile', 500, error);
  }
};

export const removeMember = async (req: any, res: Response) => {
  try {
    const [updated] = await db.update(members).set({
      membershipStatus: 'cancelled',
      deletedAt: new Date(),
      updatedAt: new Date(),
    }).where(and(eq(members.id, req.params.id), isNull(members.deletedAt))).returning();
    if (!updated) return errorResponse(res, 'Member not found', 404);
    return successResponse(res, { id: updated.id, removed: true });
  } catch (error) {
    return errorResponse(res, 'Failed to remove member', 500, error);
  }
};

export const updateMyMembership = async (req: any, res: Response) => {
  try {
    if (!req.member) return errorResponse(res, 'Member profile not found', 404);
    const { action, months } = req.body;

    if (action === 'cancel') {
      const [updated] = await db.update(members)
        .set({ cancelAtPeriodEnd: 1, updatedAt: new Date() })
        .where(eq(members.id, req.member.id))
        .returning();
      return successResponse(res, updated);
    }

    if (action === 'resume') {
      const [updated] = await db.update(members)
        .set({ cancelAtPeriodEnd: 0, updatedAt: new Date() })
        .where(eq(members.id, req.member.id))
        .returning();
      return successResponse(res, updated);
    }

    if (action === 'freeze') {
      const freezeMonths = Number(months);
      if (!Number.isInteger(freezeMonths) || freezeMonths < 1 || freezeMonths > 3) {
        return errorResponse(res, 'Freeze duration must be between one and three months', 422);
      }
      const freezeUntil = new Date();
      freezeUntil.setMonth(freezeUntil.getMonth() + freezeMonths);
      const [updated] = await db.update(members)
        .set({ freezeUntil, updatedAt: new Date() })
        .where(eq(members.id, req.member.id))
        .returning();
      return successResponse(res, updated);
    }

    if (action === 'unfreeze') {
      const [updated] = await db.update(members)
        .set({ freezeUntil: null, updatedAt: new Date() })
        .where(eq(members.id, req.member.id))
        .returning();
      return successResponse(res, updated);
    }

    return errorResponse(res, 'Unsupported membership action', 422);
  } catch (error) {
    return errorResponse(res, 'Failed to update membership', 500, error);
  }
};
