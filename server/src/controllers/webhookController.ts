import { Request, Response } from 'express';
import { db } from '../utils/db';
import { members, payments } from '../db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { logActivity } from '../utils/activity';
import { errorResponse, successResponse } from '../utils/responses';
import { broadcastResourceChange, broadcastToMember } from '../utils/socket';
import { PLAN_PRICES } from './paymentController';
import { createNotification } from './notificationController';
import { calculateExpiryDate, getBaseDateForMembership } from '../services/membershipService';
import logger from '../utils/logger';
import { verifyNeonWebhookSignature } from '../utils/neon';

dotenv.config();

// ── Paystack ──────────────────────────────────────────────────────────────────

export const handlePaystackWebhook = async (req: Request, res: Response) => {
  const correlationId = crypto.randomUUID().slice(0, 8);
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const signatureHeader = req.headers['x-paystack-signature'];
  const signature = Array.isArray(signatureHeader) ? signatureHeader[0] : signatureHeader;
  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body ?? '');

  if (!secret) {
    logger.error('[PAYSTACK-WEBHOOK] Secret is not configured', { correlationId });
    return errorResponse(res, 'Webhook service unavailable', 503);
  }
  if (typeof signature !== 'string' || !signature) {
    logger.warn('[PAYSTACK-WEBHOOK] Missing signature', { correlationId });
    return errorResponse(res, 'Webhook request rejected', 400);
  }

  const expectedSignature = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');
  const receivedBuffer = Buffer.from(signature, 'hex');
  if (expectedBuffer.length !== receivedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)) {
    logger.warn('[PAYSTACK-WEBHOOK] Invalid signature', { correlationId });
    return errorResponse(res, 'Webhook request rejected', 400);
  }

  let event: any;
  try {
    event = JSON.parse(rawBody.toString('utf8'));
  } catch (error) {
    logger.warn('[PAYSTACK-WEBHOOK] Invalid JSON payload', { correlationId, error });
    return errorResponse(res, 'Webhook request rejected', 400);
  }

  if (event?.event !== 'charge.success') {
    return successResponse(res, { received: true });
  }

  const providerData = event.data;
  const reference = typeof providerData?.reference === 'string' ? providerData.reference.trim() : '';
  const amountInMinorUnits = Number(providerData?.amount);
  const currency = providerData?.currency;
  const providerStatus = providerData?.status;
  if (!reference || !Number.isSafeInteger(amountInMinorUnits) || amountInMinorUnits <= 0 || providerStatus !== 'success' || currency !== 'KES') {
    logger.warn('[PAYSTACK-WEBHOOK] Invalid successful-charge payload', { correlationId, reference, currency, providerStatus });
    return errorResponse(res, 'Webhook request rejected', 400);
  }

  try {
    const result = await db.transaction(async (tx) => {
      const [pending] = await tx.select().from(payments)
        .where(eq(payments.paystackReference, reference))
        .for('update')
        .limit(1);

      if (!pending) throw new Error('Payment reference is not associated with a pending payment');
      if (pending.status === 'paid') return { alreadyProcessed: true as const };
      if (pending.status !== 'pending' || !pending.memberId) throw new Error('Payment is not eligible for settlement');

      const billing = pending.billing === 'yearly' ? 'yearly' : 'monthly';
      const expectedAmount = PLAN_PRICES[pending.plan]?.[billing];
      if (!expectedAmount || amountInMinorUnits !== Math.round(expectedAmount * 100)) {
        throw new Error('Provider amount does not match the server-side plan');
      }

      const [member] = await tx.select().from(members)
        .where(and(eq(members.id, pending.memberId), isNull(members.deletedAt)))
        .for('update')
        .limit(1);
      if (!member) throw new Error('Member profile is unavailable');

      const paidAt = providerData.paid_at ? new Date(providerData.paid_at) : new Date();
      const baseDate = getBaseDateForMembership(member.expiresAt, 'subscription', member.membershipStatus || 'pending');
      const expiresAt = calculateExpiryDate(baseDate, billing);
      const [payment] = await tx.update(payments)
        .set({ status: 'paid', paidAt, amount: expectedAmount.toFixed(2), currency: 'KES' })
        .where(and(eq(payments.id, pending.id), eq(payments.status, 'pending')))
        .returning();
      if (!payment) throw new Error('Payment has already been processed');

      const [updatedMember] = await tx.update(members)
        .set({
          plan: pending.plan as 'basic' | 'pro' | 'elite',
          planBilling: billing,
          membershipStatus: 'active',
          expiresAt,
          updatedAt: new Date(),
        })
        .where(eq(members.id, member.id))
        .returning();
      if (!updatedMember) throw new Error('Member profile is unavailable');

      return { alreadyProcessed: false as const, payment, member: updatedMember, expiresAt, billing };
    });

    if (!result.alreadyProcessed) {
      await Promise.all([
        createNotification(
          result.member.id,
          'Payment Successful',
          `Your payment for the ${result.payment.plan} plan has been processed. Your membership is now active.`,
          'success',
        ),
        logActivity({
          authUserId: result.member.authUserId,
          action: 'membership_upgraded',
          metadata: { plan: result.payment.plan, amount: Number(result.payment.amount), reference, correlationId },
          req,
        }),
      ]).catch((error) => logger.error('[PAYSTACK-WEBHOOK] Background task failed', { correlationId, error }));

      broadcastToMember(result.member.id, 'payment-success', {
        plan: result.payment.plan,
        status: 'active',
        expiresAt: result.expiresAt.toISOString(),
      });
      broadcastResourceChange('payments', 'updated', result.payment.id);
      broadcastResourceChange('members', 'activated', result.member.id);
    }

    return successResponse(res, { received: true });
  } catch (error) {
    logger.error('[PAYSTACK-WEBHOOK] Transaction failed', { correlationId, error });
    return errorResponse(res, 'Webhook processing failed', 500);
  }
};

// ── Neon Auth Webhook ─────────────────────────────────────────────────────────
// Neon Auth sends `user.created` and `user.updated` events to this endpoint.
// Configure this URL in your Neon Auth dashboard → Webhooks:
//   POST  /api/webhooks/neon-auth
// This guarantees a member DB record exists as soon as someone signs up,
// independently of whether the frontend AuthContext sync has run yet.

export const handleNeonAuthWebhook = async (req: Request, res: Response) => {
  const correlationId = crypto.randomUUID().substring(0, 8);
  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body ?? '');

  try {
    await verifyNeonWebhookSignature(rawBody, {
      signature: req.header('x-neon-signature') ?? undefined,
      signatureKid: req.header('x-neon-signature-kid') ?? undefined,
      timestamp: req.header('x-neon-timestamp') ?? undefined,
    });
  } catch (error) {
    logger.warn(`[NEON-WEBHOOK][${correlationId}] Rejected unverified request`, {
      reason: error instanceof Error ? error.message : String(error),
    });
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  try {
    const body = JSON.parse(rawBody.toString('utf8')) as {
      event_type?: string;
      event_id?: string;
      user?: {
        id?: string;
        email?: string;
        name?: string;
        email_verified?: boolean;
      };
      // Backward-compatible shape for previously configured test/development senders.
      type?: string;
      data?: {
        id?: string;
        email?: string;
        name?: string;
        email_verified?: boolean;
      };
    };
    const type = body.event_type ?? body.type;
    const user = body.user ?? body.data;
    const headerEventType = req.header('x-neon-event-type');
    const headerEventId = req.header('x-neon-event-id');

    if (headerEventType && type && headerEventType !== type) {
      logger.warn(`[NEON-WEBHOOK][${correlationId}] Event type header does not match payload`);
      return res.status(401).json({ error: 'Webhook event mismatch' });
    }
    if (headerEventId && body.event_id && headerEventId !== body.event_id) {
      logger.warn(`[NEON-WEBHOOK][${correlationId}] Event ID header does not match payload`);
      return res.status(401).json({ error: 'Webhook event mismatch' });
    }

    logger.info(`[NEON-WEBHOOK][${correlationId}] Received event: ${type ?? 'unknown'}`);

    if (!['user.created', 'user.updated'].includes(type ?? '')) {
      return res.status(200).json({ received: true });
    }

    const authUserId = user?.id;
    const email = user?.email;
    const name = user?.name;
    const isEmailVerified = user?.email_verified === true ? 1 : 0;
    let realtimeMemberId: string | undefined;
    let realtimeAction: 'created' | 'updated' = 'updated';

    if (!authUserId || !email) {
      logger.warn(`[NEON-WEBHOOK][${correlationId}] Missing required user fields`);
      return res.status(400).json({ error: 'Missing required user fields' });
    }

    await db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(members)
        .where(and(eq(members.authUserId, authUserId), isNull(members.deletedAt)))
        .limit(1);

      if (existing) {
        realtimeMemberId = existing.id;
        await tx
          .update(members)
          .set({
            email,
            isEmailVerified,
            fullName: name || existing.fullName,
            updatedAt: new Date(),
          })
          .where(eq(members.id, existing.id));

        logger.info(`[NEON-WEBHOOK][${correlationId}] Updated member ${existing.id}`, {
          verified: isEmailVerified,
        });
        await logActivity({
          authUserId,
          action: 'profile_sync_webhook',
          metadata: { type, memberId: existing.id, isEmailVerified },
          req,
        });
      } else {
        realtimeAction = 'created';
        const [newMember] = await tx
          .insert(members)
          .values({
            authUserId,
            email,
            isEmailVerified,
            fullName: name || null,
            role: 'member',
            plan: 'free',
            planBilling: 'monthly',
            membershipStatus: 'pending',
          })
          .returning();

        logger.info(`[NEON-WEBHOOK][${correlationId}] Created member ${newMember.id}`);
        await logActivity({
          authUserId,
          action: 'profile_created_webhook',
          metadata: { type, memberId: newMember.id, isEmailVerified },
          req,
        });
      }
    });

    if (realtimeMemberId) broadcastResourceChange('members', realtimeAction, realtimeMemberId);
    return res.status(200).json({ received: true });
  } catch (error) {
    logger.error(`[NEON-WEBHOOK][${correlationId}] Error processing webhook`, error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
};
