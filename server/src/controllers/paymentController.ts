import { Request, Response, NextFunction } from 'express';
import { db } from '../utils/db';
import { payments, members } from '../db/schema';
import { successResponse, errorResponse } from '../utils/responses';
import { eq, desc, and, isNull } from 'drizzle-orm';
import { logActivity } from '../utils/activity';
import { PaymentError } from '../utils/errors';
import { createNotification } from './notificationController';
import { broadcastResourceChange, broadcastToMember } from '../utils/socket';
import logger from '../utils/logger';

const PAYSTACK_API = 'https://api.paystack.co';
const PRODUCTION_PLAN_PRICES: Record<string, Record<string, number>> = {
  free: { monthly: 0, yearly: 0 },
  basic: { monthly: 1500, yearly: 15000 },
  pro: { monthly: 3500, yearly: 35000 },
  elite: { monthly: 7500, yearly: 75000 },
};

// Keep server-side verification aligned with the frontend test deployment.
// Set PAYMENT_TEST_MODE=true only on an isolated Paystack test environment.
const TEST_PLAN_PRICES: Record<string, Record<string, number>> = {
  free: { monthly: 0, yearly: 0 },
  basic: { monthly: 1500, yearly: 15000 },
  pro: { monthly: 3500, yearly: 35000 },
  elite: { monthly: 7500, yearly: 75000 },
};

export const PLAN_PRICES = process.env.PAYMENT_TEST_MODE === 'true' || process.env.NODE_ENV === 'test'
  ? TEST_PLAN_PRICES
  : PRODUCTION_PLAN_PRICES;

const getPaystackSecret = () => {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new PaymentError('Payment provider is not configured', 'provider_unavailable', undefined, 503);
  return secret;
};

const paystackRequest = async (path: string, init: RequestInit) => {
  const response = await fetch(`${PAYSTACK_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getPaystackSecret()}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.status !== true) {
    logger.warn('[PAYMENT] Paystack request failed', {
      path,
      status: response.status,
      providerMessage: typeof body?.message === 'string' ? body.message : undefined,
    });
    throw new PaymentError('Payment provider request failed', 'provider_error', undefined, 502);
  }
  return body.data;
};

const addBillingPeriod = (billing: 'monthly' | 'yearly') => {
  const date = new Date();
  date.setMonth(date.getMonth() + (billing === 'yearly' ? 12 : 1));
  return date;
};

export const getPaymentsByMemberId = async (req: Request, res: Response, next: NextFunction) => {
  const { memberId } = req.params;
  try {
    const memberPayments = await db.select()
      .from(payments)
      .where(eq(payments.memberId, memberId))
      .orderBy(desc(payments.createdAt));
    return successResponse(res, memberPayments);
  } catch (error) {
    next(error);
  }
};

export const getAdminPayments = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const rows = await db.select({
      id: payments.id,
      memberId: payments.memberId,
      memberName: members.fullName,
      memberEmail: members.email,
      amount: payments.amount,
      currency: payments.currency,
      plan: payments.plan,
      reference: payments.paystackReference,
      status: payments.status,
      paidAt: payments.paidAt,
      createdAt: payments.createdAt,
    })
      .from(payments)
      .leftJoin(members, eq(payments.memberId, members.id))
      .orderBy(desc(payments.createdAt))
      .limit(5000);

    const paid = rows.filter((payment) => payment.status === 'paid');
    const pending = rows.filter((payment) => payment.status === 'pending');
    const failed = rows.filter((payment) => payment.status === 'failed' || payment.status === 'abandoned');
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyRevenue = paid
      .filter((payment) => payment.paidAt && new Date(payment.paidAt) >= monthStart)
      .reduce((total, payment) => total + Number(payment.amount || 0), 0);

    const revenueByMonth = new Map<string, number>();
    for (let offset = 5; offset >= 0; offset -= 1) {
      const month = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      revenueByMonth.set(month.toISOString().slice(0, 7), 0);
    }
    paid.forEach((payment) => {
      const key = payment.paidAt
        ? new Date(payment.paidAt).toISOString().slice(0, 7)
        : payment.createdAt
          ? new Date(payment.createdAt).toISOString().slice(0, 7)
          : null;
      if (key && revenueByMonth.has(key)) revenueByMonth.set(key, (revenueByMonth.get(key) || 0) + Number(payment.amount || 0));
    });

    const revenueByPlan = new Map<string, number>();
    paid.forEach((payment) => revenueByPlan.set(payment.plan, (revenueByPlan.get(payment.plan) || 0) + Number(payment.amount || 0)));

    return successResponse(res, {
      payments: rows,
      summary: {
        totalRevenue: paid.reduce((total, payment) => total + Number(payment.amount || 0), 0),
        monthlyRevenue,
        pendingRevenue: pending.reduce((total, payment) => total + Number(payment.amount || 0), 0),
        pendingCount: pending.length,
        failedCount: failed.length,
      },
      revenueTrend: Array.from(revenueByMonth.entries()).map(([month, revenue]) => ({ month, revenue })),
      revenueByPlan: Array.from(revenueByPlan.entries()).map(([plan, revenue]) => ({ plan, revenue })),
    });
  } catch (error) {
    next(error);
  }
};

export const getPaymentReceipt = async (req: any, res: Response, next: NextFunction) => {
  const { paymentId } = req.params;
  try {
    const [paymentWithMember] = await db.select({
      id: payments.id,
      amount: payments.amount,
      currency: payments.currency,
      plan: payments.plan,
      status: payments.status,
      paidAt: payments.paidAt,
      createdAt: payments.createdAt,
      paystackReference: payments.paystackReference,
      memberFullName: members.fullName,
      memberEmail: members.email,
      memberPhone: members.phone,
      authUserId: members.authUserId,
      memberRole: members.role,
    })
      .from(payments)
      .innerJoin(members, eq(payments.memberId, members.id))
      .where(eq(payments.id, paymentId));

    if (!paymentWithMember) throw new PaymentError('Payment not found', 'transaction_failed');
    const isOwner = paymentWithMember.authUserId === req.auth.userId;
    const isAdmin = req.member?.role === 'admin';
    if (!isOwner && !isAdmin) return errorResponse(res, 'Forbidden', 403);

    return successResponse(res, {
      ...paymentWithMember,
      fullName: paymentWithMember.memberFullName,
      email: paymentWithMember.memberEmail,
      paid_at: paymentWithMember.paidAt,
      paystack_reference: paymentWithMember.paystackReference,
    });
  } catch (error) {
    next(error);
  }
};

/** Create a pending payment record. The record becomes paid only after webhook or provider verification. */
export const createPayment = async (req: any, res: Response, next: NextFunction) => {
  const { plan, billing = 'monthly', paystack_reference: paystackReference } = req.body;
  const memberId = req.member?.id;
  const expectedAmount = PLAN_PRICES[plan]?.[billing];
  if (!memberId) return errorResponse(res, 'Member profile not found', 404);
  if (!['monthly', 'yearly'].includes(billing) || !expectedAmount || plan === 'free') {
    return errorResponse(res, 'Invalid payment plan', 422);
  }

  const correlationId = Math.random().toString(36).substring(7);
  try {
    const [member] = await db.select().from(members).where(eq(members.id, memberId));
    if (!member) throw new PaymentError('Member not found', 'transaction_failed');

    const [newPayment] = await db.insert(payments).values({
      memberId,
      amount: expectedAmount.toFixed(2),
      currency: 'KES',
      plan,
      paystackReference: paystackReference || null,
      status: 'pending',
      createdAt: new Date(),
    }).returning();

    await logActivity({
      authUserId: req.auth.userId,
      action: 'payment_initiated',
      entityType: 'payment',
      entityId: newPayment.id,
      metadata: { amount: expectedAmount, plan, billing, reference: paystackReference, correlationId },
      req,
    });

    return successResponse(res, { paymentId: newPayment.id, status: newPayment.status }, 201);
  } catch (error) {
    if (error instanceof PaymentError) return errorResponse(res, error.message, error.status, { reason: error.reason });
    next(error);
  }
};

export const verifyPayment = async (req: any, res: Response, next: NextFunction) => {
  const { reference } = req.body;
  if (!req.member) return errorResponse(res, 'Member profile not found', 404);
  if (typeof reference !== 'string' || reference.trim().length < 3 || reference.length > 200) {
    return errorResponse(res, 'Invalid payment verification payload', 422);
  }

  try {
    const providerPayment = await paystackRequest(`/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
    });
    if (providerPayment.status !== 'success') return errorResponse(res, 'Payment has not completed', 402);
    if (providerPayment.currency !== 'KES') return errorResponse(res, 'Payment currency is not supported', 400);
    if (!providerPayment.customer?.email || providerPayment.customer.email.toLowerCase() !== req.member.email.toLowerCase()) {
      return errorResponse(res, 'Payment customer does not match the signed-in account', 403);
    }

    const paidAmount = Number(providerPayment.amount) / 100;
    const result = await db.transaction(async (tx) => {
      const [pending] = await tx.select()
        .from(payments)
        .where(and(
          eq(payments.paystackReference, reference),
          eq(payments.memberId, req.member.id),
        ))
        .for('update')
        .limit(1);

      if (!pending) throw new PaymentError('Payment reference is not associated with this account', 'invalid_reference', undefined, 403);
      if (pending.status === 'paid') return { payment: pending, member: req.member, alreadyPaid: true as const };
      if (pending.status !== 'pending') throw new PaymentError('Payment is not pending', 'transaction_failed', undefined, 409);

      const billing = pending.billing === 'yearly' ? 'yearly' : 'monthly';
      const expectedAmount = PLAN_PRICES[pending.plan]?.[billing];
      if (!expectedAmount || Math.abs(paidAmount - expectedAmount) > 0.01) {
        throw new PaymentError('Payment amount does not match the selected plan', 'amount_mismatch', undefined, 400);
      }

      const paidAt = providerPayment.paid_at ? new Date(providerPayment.paid_at) : new Date();
      const [payment] = await tx.update(payments)
        .set({ status: 'paid', paidAt, amount: paidAmount.toFixed(2), currency: 'KES' })
        .where(and(eq(payments.id, pending.id), eq(payments.status, 'pending')))
        .returning();
      if (!payment) throw new PaymentError('Payment has already been processed', 'transaction_failed', undefined, 409);

      const [member] = await tx.update(members)
        .set({ plan: pending.plan as 'basic' | 'pro' | 'elite', planBilling: billing, membershipStatus: 'active', expiresAt: addBillingPeriod(billing), updatedAt: new Date() })
        .where(eq(members.id, req.member.id))
        .returning();
      if (!member) throw new PaymentError('Member profile not found', 'transaction_failed', undefined, 404);
      return { payment, member, billing, alreadyPaid: false as const };
    });

    if (!result.alreadyPaid) {
      await logActivity({
        authUserId: req.auth.userId,
        action: 'payment_verified',
        entityType: 'payment',
        entityId: result.payment.id,
        metadata: { plan: result.payment.plan, billing: result.billing, reference: providerPayment.reference },
        req,
      });
      broadcastToMember(req.member.id, 'payment-success', { plan: result.payment.plan, status: 'paid' });
      broadcastResourceChange('payments', 'updated', result.payment.id);
      broadcastResourceChange('members', 'activated', req.member.id);
    }

    return successResponse(res, { payment: result.payment, member: result.member });
  } catch (error) {
    if (error instanceof PaymentError) return errorResponse(res, error.message, error.status, { reason: error.reason });
    logger.error('[PAYMENT] Verification error', error);
    next(error);
  }
};

export const retryPayment = async (req: any, res: Response, next: NextFunction) => {
  try {
    const [payment] = await db.select({
      id: payments.id,
      amount: payments.amount,
      currency: payments.currency,
      plan: payments.plan,
      billing: payments.billing,
      status: payments.status,
      memberId: payments.memberId,
      memberEmail: members.email,
    }).from(payments).leftJoin(members, eq(payments.memberId, members.id)).where(eq(payments.id, req.params.paymentId));

    if (!payment || !payment.memberEmail) return errorResponse(res, 'Payment or member not found', 404);
    if (payment.status === 'paid') return errorResponse(res, 'Paid payments cannot be retried', 409);
    const billing = payment.billing === 'yearly' ? 'yearly' : 'monthly';
    const expectedAmount = PLAN_PRICES[payment.plan]?.[billing];
    if (!expectedAmount) return errorResponse(res, 'Payment plan is not supported', 422);

    const reference = `optizgym-${payment.id}-${Date.now()}`;
    const providerPayment = await paystackRequest('/transaction/initialize', {
      method: 'POST',
      body: JSON.stringify({
        email: payment.memberEmail,
        amount: String(Math.round(expectedAmount * 100)),
        currency: 'KES',
        reference,
        metadata: JSON.stringify({ paymentId: payment.id, memberId: payment.memberId, plan: payment.plan, billing, retry: true }),
        channels: ['card', 'mobile_money', 'bank_transfer', 'bank', 'ussd', 'qr'],
      }),
    });

    await db.update(payments).set({ paystackReference: providerPayment.reference, status: 'pending' }).where(eq(payments.id, payment.id));
    return successResponse(res, {
      paymentId: payment.id,
      authorizationUrl: providerPayment.authorization_url,
      reference: providerPayment.reference,
    });
  } catch (error) {
    if (error instanceof PaymentError) return errorResponse(res, error.message, error.status, { reason: error.reason });
    next(error);
  }
};

export const remindPayment = async (req: any, res: Response, next: NextFunction) => {
  try {
    const [payment] = await db.select({
      id: payments.id,
      amount: payments.amount,
      plan: payments.plan,
      status: payments.status,
      memberId: payments.memberId,
    }).from(payments).where(eq(payments.id, req.params.paymentId));
    if (!payment?.memberId) return errorResponse(res, 'Payment or member not found', 404);
    if (payment.status === 'paid') return errorResponse(res, 'Paid payments do not need a reminder', 409);

    await createNotification(
      payment.memberId,
      'Payment reminder',
      `Your ${payment.plan} payment of ${payment.amount} is still ${payment.status || 'pending'}. Please complete payment to keep your membership active.`,
      'warning',
    );
    return successResponse(res, { paymentId: payment.id, notified: true });
  } catch (error) {
    next(error);
  }
};
