import { Request, Response, NextFunction } from 'express';
import { db } from '../utils/db';
import { bookings, classes, members } from '../db/schema';
import { successResponse, errorResponse } from '../utils/responses';
import { eq, and, sql } from 'drizzle-orm';
import { logActivity } from '../utils/activity';
import { broadcastResourceChange, broadcastToAll, broadcastToMember } from '../utils/socket';
import { createNotification } from './notificationController';
import { BookingError } from '../utils/errors';
import logger from '../utils/logger';

export const getBookingsByMemberId = async (req: Request, res: Response, next: NextFunction) => {
  const { memberId } = req.params;
  try {
    const memberBookings = await db.select({
      id: bookings.id,
      memberId: bookings.memberId,
      classId: bookings.classId,
      status: bookings.status,
      bookedAt: bookings.bookedAt,
      className: classes.name,
      instructor: classes.instructorLegacy,
      schedule: classes.schedule,
      durationMinutes: classes.durationMinutes,
      location: classes.location
    })
    .from(bookings)
    .innerJoin(classes, eq(bookings.classId, classes.id))
    .where(eq(bookings.memberId, memberId));

    return successResponse(res, memberBookings);
  } catch (error) {
    next(error);
  }
};

/**
 * Atomic Class Booking with Integrated Eligibility & Availability Checks
 */
export const createBooking = async (req: any, res: Response, next: NextFunction) => {
  const { member_id: memberId, class_id: classId } = req.body;

  // RBAC: Ensure member is booking for themselves
  if (req.member?.id !== memberId) {
    return errorResponse(res, 'Forbidden: You can only book for yourself', 403);
  }

  const correlationId = Math.random().toString(36).substring(7);
  logger.info(`[BOOKING][${correlationId}] Starting booking process`, { memberId, classId });

  try {
    const [member] = await db.select().from(members).where(eq(members.id, memberId));
    if (!member) {
      throw new BookingError('Member not found', 'eligibility_failed');
    }

    // Eligibility Validation
    if (member.plan === 'free' || member.membershipStatus !== 'active') {
      logger.warn(`[BOOKING][${correlationId}] Eligibility check failed: Inactive or Free plan`, { plan: member.plan, status: member.membershipStatus });
      throw new BookingError('Membership upgrade required to book classes', 'eligibility_failed');
    }

    // Atomic Transaction for Class Booking
    const result = await db.transaction(async (tx) => {
      // 1. Fetch class details with row-level locking
      logger.info(`[BOOKING][${correlationId}] DB Transaction: Fetching class with lock`, { classId });

      const [gymClass] = await tx.select().from(classes).where(eq(classes.id, classId)).for('update');

      if (!gymClass) {
        logger.error(`[BOOKING][${correlationId}] DB Transaction: Class not found`, { classId });
        throw new BookingError('Class not found', 'class_not_found');
      }

      // 2. Availability Check
      if (gymClass.enrolled! >= gymClass.capacity!) {
        logger.warn(`[BOOKING][${correlationId}] Availability check failed: Class full`, { enrolled: gymClass.enrolled, capacity: gymClass.capacity });
        throw new BookingError('Class is full', 'class_full');
      }

      // 3. Duplicate Booking Check
      const [existing] = await tx.select().from(bookings).where(
        and(eq(bookings.memberId, memberId), eq(bookings.classId, classId))
      ).limit(1);

      if (existing) {
        throw new BookingError('Already booked for this class', 'already_booked');
      }

      // 4. Create Booking
      logger.info(`[BOOKING][${correlationId}] DB Transaction: Creating booking record`);
      const [newBooking] = await tx.insert(bookings).values({
        memberId,
        classId,
        status: 'confirmed'
      }).returning();

      // 5. Update Class Enrollment
      logger.info(`[BOOKING][${correlationId}] DB Transaction: Updating class enrollment`);
      await tx.update(classes)
        .set({ enrolled: (gymClass.enrolled || 0) + 1 })
        .where(eq(classes.id, classId));

      return { booking: newBooking, gymClass };
    });

    const { booking, gymClass } = result;
    logger.info(`[BOOKING][${correlationId}] Booking successful`, { bookingId: booking.id });

    // Background tasks: logging, notifications, real-time updates
    Promise.all([
      logActivity({
        authUserId: req.auth.userId,
        action: 'class_booked',
        entityType: 'booking',
        entityId: booking.id,
        metadata: { classId, className: gymClass.name },
        req
      }),
      createNotification(
        memberId,
        'Booking Confirmed',
        `You have successfully booked a slot for ${gymClass.name}.`,
        'success'
      )
    ]).catch(err => logger.error(`[BOOKING][${correlationId}] Background task error`, err));

    // Real-time updates
    broadcastToAll('class-updated', { classId, enrolled: (gymClass.enrolled || 0) + 1 });
    broadcastResourceChange('bookings', 'created', booking.id);
    broadcastToMember(memberId, 'booking-confirmed', { booking, className: gymClass.name });

    return successResponse(res, {
      ...booking,
      message: `Confirmed booking for ${gymClass.name}`
    }, 201);

  } catch (error) {
    if (error instanceof BookingError) {
      return errorResponse(res, error.message, error.status, { reason: error.reason });
    }
    logger.error(`[BOOKING][${correlationId}] Unexpected booking error`, error);
    next(error);
  }
};


export const cancelBooking = async (req: any, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const correlationId = Math.random().toString(36).substring(7);

  try {
    const result = await db.transaction(async (tx) => {
      const [booking] = await tx.select({
        id: bookings.id,
        memberId: bookings.memberId,
        classId: bookings.classId,
        status: bookings.status,
        className: classes.name,
        enrolled: classes.enrolled,
      })
        .from(bookings)
        .innerJoin(classes, eq(bookings.classId, classes.id))
        .where(eq(bookings.id, id))
        .for('update');

      if (!booking) throw new BookingError('Booking not found', 'booking_not_found');
      if (req.member?.role !== 'admin' && booking.memberId !== req.member?.id) {
        return { forbidden: true as const };
      }
      if (booking.status !== 'confirmed') {
        throw new BookingError('Booking is no longer active', 'booking_not_active');
      }

      const [updatedBooking] = await tx.update(bookings)
        .set({ status: 'cancelled' })
        .where(eq(bookings.id, id))
        .returning();

      await tx.update(classes)
        .set({ enrolled: sql`GREATEST(COALESCE(${classes.enrolled}, 0) - 1, 0)` })
        .where(eq(classes.id, booking.classId!));

      return { booking: updatedBooking, classId: booking.classId!, className: booking.className, enrolled: Math.max((booking.enrolled ?? 0) - 1, 0) };
    });

    if ('forbidden' in result && result.forbidden) {
      return errorResponse(res, 'Forbidden', 403);
    }

    await logActivity({
      authUserId: req.auth.userId,
      action: 'class_booking_cancelled',
      entityType: 'booking',
      entityId: result.booking.id,
      metadata: { classId: result.classId, className: result.className, correlationId },
      req,
    });

    broadcastToAll('class-updated', { classId: result.classId, enrolled: result.enrolled });
    broadcastResourceChange('bookings', 'cancelled', result.booking.id);
    if (result.booking.memberId) {
      broadcastToMember(result.booking.memberId, 'booking-cancelled', {
        bookingId: result.booking.id,
        classId: result.classId,
        className: result.className,
      });
    }

    return successResponse(res, result.booking);
  } catch (error) {
    if (error instanceof BookingError) {
      return errorResponse(res, error.message, error.status, { reason: error.reason });
    }
    logger.error(`[BOOKING][${correlationId}] Cancellation error`, error);
    next(error);
  }
};
