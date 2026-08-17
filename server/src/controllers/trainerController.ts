import { Request, Response } from 'express';
import { and, eq, isNull } from 'drizzle-orm';
import { instructors } from '../db/schema';
import { db } from '../utils/db';
import { errorResponse, successResponse } from '../utils/responses';
import { removeFromCache } from '../utils/cache';
import { broadcastResourceChange, broadcastToAll } from '../utils/socket';

const TRAINER_CACHE_KEY = 'all_instructors';
const CLASS_CACHE_KEY = 'all_classes';

const cleanOptional = (value: unknown) => {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  return normalized || null;
};

const normalizeTrainerPayload = (body: any) => ({
  fullName: String(body.fullName ?? '').trim(),
  email: String(body.email ?? '').trim().toLowerCase(),
  specialty: cleanOptional(body.specialty),
  bio: cleanOptional(body.bio),
  avatarUrl: cleanOptional(body.avatarUrl),
  updatedAt: new Date(),
});

const isDuplicateEmailError = (error: unknown) => (
  typeof error === 'object'
  && error !== null
  && 'code' in error
  && (error as { code?: string }).code === '23505'
);

export const getAllTrainers = async (_req: Request, res: Response) => {
  try {
    const trainers = await db.select()
      .from(instructors)
      .where(isNull(instructors.deletedAt))
      .orderBy(instructors.fullName);
    return successResponse(res, trainers);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch trainers', 500, error);
  }
};

export const createTrainer = async (req: Request, res: Response) => {
  try {
    const [trainer] = await db.insert(instructors)
      .values(normalizeTrainerPayload(req.body))
      .returning();
    removeFromCache(TRAINER_CACHE_KEY);
    removeFromCache(CLASS_CACHE_KEY);
    broadcastResourceChange('trainers', 'created', trainer.id);
    broadcastToAll('trainer-created', { id: trainer.id });
    return successResponse(res, trainer, 201);
  } catch (error) {
    if (isDuplicateEmailError(error)) return errorResponse(res, 'A trainer with this email already exists', 409);
    return errorResponse(res, 'Failed to create trainer', 500, error);
  }
};

export const updateTrainer = async (req: Request, res: Response) => {
  try {
    const [trainer] = await db.update(instructors)
      .set(normalizeTrainerPayload(req.body))
      .where(and(eq(instructors.id, req.params.id), isNull(instructors.deletedAt)))
      .returning();
    if (!trainer) return errorResponse(res, 'Trainer not found', 404);
    removeFromCache(TRAINER_CACHE_KEY);
    removeFromCache(CLASS_CACHE_KEY);
    broadcastResourceChange('trainers', 'updated', trainer.id);
    broadcastToAll('trainer-updated', { id: trainer.id });
    return successResponse(res, trainer);
  } catch (error) {
    if (isDuplicateEmailError(error)) return errorResponse(res, 'A trainer with this email already exists', 409);
    return errorResponse(res, 'Failed to update trainer', 500, error);
  }
};

export const deleteTrainer = async (req: Request, res: Response) => {
  try {
    const [trainer] = await db.update(instructors)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(instructors.id, req.params.id), isNull(instructors.deletedAt)))
      .returning({ id: instructors.id });
    if (!trainer) return errorResponse(res, 'Trainer not found', 404);
    removeFromCache(TRAINER_CACHE_KEY);
    removeFromCache(CLASS_CACHE_KEY);
    broadcastResourceChange('trainers', 'deleted', trainer.id);
    broadcastToAll('trainer-deleted', { id: trainer.id });
    return successResponse(res, { id: trainer.id, removed: true });
  } catch (error) {
    return errorResponse(res, 'Failed to delete trainer', 500, error);
  }
};
