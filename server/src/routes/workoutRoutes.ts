import { Router } from 'express';
import { requireAuth, requireSelf } from '../middleware/auth';
import { getWorkoutsByMemberId, createWorkout } from '../controllers/workoutController';
import { validate } from '../middleware/validate';
import { workoutSchema } from '../types/schemas';

const router = Router();

router.get('/:memberId', requireSelf('memberId'), getWorkoutsByMemberId);
router.post('/', requireAuth, validate(workoutSchema), createWorkout);

export default router;
