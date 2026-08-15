import { Router } from 'express';
import { requireAuth, requireSelf, requireAdmin } from '../middleware/auth';
import {
  getPaymentsByMemberId,
  getPaymentReceipt,
  createPayment,
  verifyPayment,
  getAdminPayments,
  retryPayment,
  remindPayment,
} from '../controllers/paymentController';
import { validate } from '../middleware/validate';
import { paymentSchema } from '../types/schemas';

const router = Router();

router.get('/admin', requireAdmin, getAdminPayments);
router.get('/:memberId', requireSelf('memberId'), getPaymentsByMemberId);
router.get('/:paymentId/receipt', requireAuth, getPaymentReceipt);
router.post('/', requireAuth, validate(paymentSchema), createPayment);
router.post('/verify', requireAuth, verifyPayment);
router.post('/:paymentId/retry', requireAdmin, retryPayment);
router.post('/:paymentId/remind', requireAdmin, remindPayment);

export default router;
