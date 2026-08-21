import { Request, Response } from 'express';
import { db } from '../utils/db';
import { workouts } from '../db/schema';
import { workoutSchema } from '../types/schemas';
import { successResponse, errorResponse } from '../utils/responses';
import { eq, desc } from 'drizzle-orm';
import { logActivity } from '../utils/activity';

export const getWorkoutsByMemberId = async (req: Request, res: Response) => {
  const { memberId } = req.params;
  try {
    const memberWorkouts = await db.select()
      .from(workouts)
      .where(eq(workouts.memberId, memberId))
      .orderBy(desc(workouts.date));

    return successResponse(res, memberWorkouts);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch workouts', 500, error);
  }
};

export const createWorkout = async (req: any, res: Response) => {
  const { date, exercises, duration_minutes: durationMinutes, calories_burned: caloriesBurned, notes } = req.body;
  const memberId = req.member?.id;

  if (!memberId) {
    return errorResponse(res, 'Member profile not found', 404);
  }

  try {
    const [newWorkout] = await db.insert(workouts).values({
      memberId,
      date,
      exercises,
      durationMinutes,
      caloriesBurned,
      notes
    }).returning();

    await logActivity({
      authUserId: req.auth.userId,
      action: 'workout_recorded',
      entityType: 'workout',
      entityId: newWorkout.id,
      metadata: { date, durationMinutes, caloriesBurned },
      req
    });

    return successResponse(res, newWorkout, 201);
  } catch (error) {
    return errorResponse(res, 'Failed to create workout', 500, error);
  }
};
