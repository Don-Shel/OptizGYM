import { Router } from 'express';
import { requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { trainerSchema } from '../types/schemas';
import {
  createTrainer,
  deleteTrainer,
  getAllTrainers,
  updateTrainer,
} from '../controllers/trainerController';

const router = Router();

router.use(requireAdmin);
router.get('/', getAllTrainers);
router.post('/', validate(trainerSchema), createTrainer);
router.put('/:id', validate(trainerSchema), updateTrainer);
router.delete('/:id', deleteTrainer);

export default router;
