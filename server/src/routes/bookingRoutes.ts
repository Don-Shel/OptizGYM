import { Router } from 'express';
import { requireAuth, requireSelf } from '../middleware/auth';
import { getBookingsByMemberId, createBooking, cancelBooking } from '../controllers/bookingController';
import { validate } from '../middleware/validate';
import { bookingSchema } from '../types/schemas';

const router = Router();

router.get('/:memberId', requireSelf('memberId'), getBookingsByMemberId);
router.post('/', requireAuth, validate(bookingSchema), createBooking);
router.delete('/:id', requireAuth, cancelBooking);

export default router;
