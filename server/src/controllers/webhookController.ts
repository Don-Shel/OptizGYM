import { Request, Response } from 'express';
import { db } from '../utils/db';
import { members, payments } from '../db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { logActivity } from '../utils/activity';
import { broadcastToMember } from '../utils/socket';
import { createNotification } from './notificationController';
import { calculateExpiryDate, getBaseDateForMembership } from '../services/membershipService';
import logger from '../utils/logger';
import { verifyNeonWebhookSignature } from '../utils/neon';

dotenv.config();

// ── Paystack ──────────────────────────────────────────────────────────────────

export const handlePaystackWebhook = async (req: Request, res: Response) => {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const signature = req.headers['x-paystack-signature'];

  if (!signature) {
    logger.warn('[PAYSTACK-WEBHOOK] Missing signature');
    return res.status(400).send('Missing signature');
  }

  const hash = crypto.createHmac('sha512', secret!).update(req.body).digest('hex');
  if (hash !== signature) {
    logger.error('[PAYSTACK-WEBHOOK] Invalid signature');
    return res.status(400).send('Invalid signature');
  }

  const event = JSON.parse(req.body.toString());
  const correlationId = Math.random().toString(36).substring(7);
  logger.info(`[PAYSTACK-WEBHOOK][${correlationId}] Received event: ${event.event}`);

  if (event.event === 'charge.success') {
    const { reference, amount, currency, metadata, status: paymentStatus } = event.data;
    const { auth_user_id, plan, billing, type } = metadata || {};

    if (!auth_user_id) {
      logger.error(`[PAYSTACK-WEBHOOK][${correlationId}] Missing auth_user_id in metadata`);
      return res.status(400).send('Missing auth_user_id');
    }

    try {
      await db.transaction(async (tx) => {
        // 1. Fetch member with lock for update (and ensure not deleted)
        const [member] = await tx
          .select()
          .from(members)
          .where(and(eq(members.authUserId, auth_user_id), isNull(members.deletedAt)))
          .for('update');

        if (!member) {
          logger.error(`[PAYSTACK-WEBHOOK][${correlationId}] Member not found for authUserId: ${auth_user_id}`);
          throw new Error('Member not found');
        }

        // 2. Calculate new expiry
        const baseDate = getBaseDateForMembership(member.expiresAt, type, member.membershipStatus || 'pending');
        const expiresAt = calculateExpiryDate(baseDate, billing || 'monthly');

        // 3. Update member status & privileges (Membership management)
        await tx.update(members)
          .set({
            plan: plan || 'basic',
            planBilling: billing || 'monthly',
            membershipStatus: 'active',
            expiresAt: expiresAt,
            updatedAt: new Date()
          })
          .where(eq(members.id, member.id));

        // 4. Record payment with audit log (PCI compliance: unique IDs, timestamps)
        await tx.insert(payments)
          .values({
            memberId: member.id,
            amount: (amount / 100).toString(),
            currency: currency || 'USD',
            plan: plan || 'basic',
            paystackReference: reference,
            status: 'paid',
            paidAt: new Date(),
            createdAt: new Date()
          })
          .onConflictDoUpdate({
            target: payments.paystackReference,
            set: {
              status: 'paid',
              paidAt: new Date(),
              amount: (amount / 100).toString()
            }
          });

        logger.info(`[PAYSTACK-WEBHOOK][${correlationId}] Membership upgraded for member ${member.id}`, { plan, expiresAt });

        // Background tasks (outside transaction for performance)
        Promise.all([
          createNotification(
            member.id,
            'Payment Successful',
            `Your payment for the ${plan} plan has been processed. Your membership is now active.`,
            'success'
          ),
          logActivity({
            authUserId: auth_user_id,
            action: 'membership_upgraded',
            metadata: { plan, amount: amount / 100, reference, correlationId },
            req,
          })
        ]).catch(err => logger.error(`[PAYSTACK-WEBHOOK][${correlationId}] Background task error`, err));

        // Real-time notification for instant visual confirmation
        broadcastToMember(member.id, 'payment-success', {
          plan,
          status: 'active',
          expiresAt: expiresAt.toISOString(),
        });
      });
    } catch (error) {
      logger.error(`[PAYSTACK-WEBHOOK][${correlationId}] Transaction failed`, error);
      return res.status(500).send('Webhook Processing Error');
    }
  }

  return res.send('Webhook processed');
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

    return res.status(200).json({ received: true });
  } catch (error) {
    logger.error(`[NEON-WEBHOOK][${correlationId}] Error processing webhook`, error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
};
