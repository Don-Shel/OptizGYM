import { Router } from 'express';
import { requireAdmin } from '../middleware/auth';
import { getHealth, initDb, seedDb, getStats, getAnalytics } from '../controllers/systemController';

const router = Router();

router.get('/health', getHealth);
router.post('/init-db', requireAdmin, initDb);
router.post('/seed-db', requireAdmin, seedDb);
router.get('/stats', requireAdmin, getStats);
router.get('/analytics', requireAdmin, getAnalytics);

export default router;
