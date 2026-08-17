import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getMyNotifications, markAsRead, markAllAsRead } from '../controllers/notificationController';

const router = Router();

router.get('/', requireAuth, getMyNotifications);
router.patch('/read-all', requireAuth, markAllAsRead);
router.patch('/:id/read', requireAuth, markAsRead);

export default router;
