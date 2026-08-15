import { Router } from 'express';
import { requireAdmin } from '../middleware/auth';
import { getAllEquipment, createEquipment } from '../controllers/equipmentController';

const router = Router();

router.get('/', requireAdmin, getAllEquipment);
router.post('/', requireAdmin, createEquipment);

export default router;
