import { Router } from 'express';
import { requireAdmin } from '../middleware/auth';
import { getAllClasses, createClass, updateClass, deleteClass, getAllInstructors } from '../controllers/classController';
import { validate } from '../middleware/validate';
import { classSchema } from '../types/schemas';

const router = Router();

router.get('/', getAllClasses);
router.get('/instructors', getAllInstructors);
router.post('/', requireAdmin, validate(classSchema), createClass);
router.put('/:id', requireAdmin, validate(classSchema), updateClass);
router.delete('/:id', requireAdmin, deleteClass);

export default router;
