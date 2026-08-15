import { Router, raw } from 'express';
import { handlePaystackWebhook } from '../controllers/webhookController';
import { handleNeonAuthWebhook } from '../controllers/webhookController';

const router = Router();

router.post('/paystack', raw({ type: 'application/json' }), handlePaystackWebhook);

// Neon Auth webhook — fires on user.created / user.updated events
// This creates/updates the member record in our DB immediately at sign-up time
router.post('/neon-auth', raw({ type: 'application/json' }), handleNeonAuthWebhook);

export default router;
