import { Request, Response } from 'express';
import { db } from '../utils/db';
import { classes, instructors } from '../db/schema';
import { successResponse, errorResponse } from '../utils/responses';
import { and, eq, isNull } from 'drizzle-orm';
import { getFromCache, setToCache, removeFromCache } from '../utils/cache';
import { broadcastToAll } from '../utils/socket';
import { notifyAllActiveMembers } from './notificationController';

const CACHE_KEYS = {
  ALL_CLASSES: 'all_classes',
  ALL_INSTRUCTORS: 'all_instructors',
};

const normalizeClassPayload = (body: any) => ({
  name: body.name,
  instructorId: body.instructorId || body.instructor_id || null,
  instructorLegacy: body.instructor || body.instructorLegacy || null,
  schedule: new Date(body.schedule),
  durationMinutes: body.durationMinutes ?? body.duration_minutes,
  capacity: body.capacity,
  category: body.category,
  location: body.location,
  description: body.description,
  difficulty: body.difficulty as any,
  intensity: body.intensity || 'medium',
  requirements: body.requirements || null,
});

const enrichClass = (row: { classes: typeof classes.$inferSelect; instructors: typeof instructors.$inferSelect | null }) => ({
  ...row.classes,
  instructor: row.instructors?.fullName || row.classes.instructorLegacy || 'Staff',
  instructorBio: row.instructors?.bio || null,
  instructorSpecialty: row.instructors?.specialty || null,
  instructorAvatarUrl: row.instructors?.avatarUrl || null,
});

const getPublicClass = async (id: string) => {
  const [row] = await db.select()
    .from(classes)
    .leftJoin(instructors, and(eq(classes.instructorId, instructors.id), isNull(instructors.deletedAt)))
    .where(eq(classes.id, id))
    .limit(1);
  return row ? enrichClass(row) : null;
};

export const getAllClasses = async (_req: Request, res: Response) => {
  try {
    const cached = getFromCache(CACHE_KEYS.ALL_CLASSES);
    if (cached) return successResponse(res, cached);

    const rows = await db.select()
      .from(classes)
      .leftJoin(instructors, and(eq(classes.instructorId, instructors.id), isNull(instructors.deletedAt)))
      .where(isNull(classes.deletedAt))
      .orderBy(classes.schedule);
    const allClasses = rows.map(enrichClass);
    setToCache(CACHE_KEYS.ALL_CLASSES, allClasses);
    return successResponse(res, allClasses);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch classes', 500, error);
  }
};

export const createClass = async (req: Request, res: Response) => {
  try {
    const [newClass] = await db.insert(classes).values(normalizeClassPayload(req.body)).returning();
    removeFromCache(CACHE_KEYS.ALL_CLASSES);
    const publicClass = await getPublicClass(newClass.id);
    if (publicClass) {
      broadcastToAll('class-created', publicClass);
      await notifyAllActiveMembers(
        'New class just dropped',
        `${publicClass.name} with ${publicClass.instructor} is now available to book.`,
        'info',
      );
    }
    return successResponse(res, publicClass || newClass, 201);
  } catch (error) {
    return errorResponse(res, 'Failed to create class', 500, error);
  }
};

export const updateClass = async (req: Request, res: Response) => {
  try {
    const [updatedClass] = await db.update(classes)
      .set(normalizeClassPayload(req.body))
      .where(eq(classes.id, req.params.id))
      .returning();
    if (!updatedClass) return errorResponse(res, 'Class not found', 404);
    removeFromCache(CACHE_KEYS.ALL_CLASSES);
    const publicClass = await getPublicClass(updatedClass.id);
    if (publicClass) {
      broadcastToAll('class-updated', publicClass);
      await notifyAllActiveMembers(
        'Class schedule updated',
        `${publicClass.name} has new details. Check the schedule before booking.`,
        'info',
      );
    }
    return successResponse(res, publicClass || updatedClass);
  } catch (error) {
    return errorResponse(res, 'Failed to update class', 500, error);
  }
};

export const deleteClass = async (req: Request, res: Response) => {
  try {
    const existingClass = await getPublicClass(req.params.id);
    const [deletedClass] = await db.update(classes)
      .set({ deletedAt: new Date() })
      .where(eq(classes.id, req.params.id))
      .returning();
    if (!deletedClass) return errorResponse(res, 'Class not found', 404);
    removeFromCache(CACHE_KEYS.ALL_CLASSES);
    broadcastToAll('class-deleted', { id: deletedClass.id });
    if (existingClass) {
      await notifyAllActiveMembers('Class removed from schedule', `${existingClass.name} is no longer available to book.`, 'warning');
    }
    return successResponse(res, { message: 'Class deleted successfully' });
  } catch (error) {
    return errorResponse(res, 'Failed to delete class', 500, error);
  }
};

export const getAllInstructors = async (_req: Request, res: Response) => {
  try {
    const cached = getFromCache(CACHE_KEYS.ALL_INSTRUCTORS);
    if (cached) return successResponse(res, cached);
    const allInstructors = await db.select().from(instructors).where(isNull(instructors.deletedAt));
    setToCache(CACHE_KEYS.ALL_INSTRUCTORS, allInstructors);
    return successResponse(res, allInstructors);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch instructors', 500, error);
  }
};
