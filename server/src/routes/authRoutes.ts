import { Router } from 'express';

// Neon Auth owns sign-up, email verification, sign-in, and password recovery.
// This router remains available for future server-side auth utilities, but the
// deleted custom registration endpoints are intentionally no longer exposed.
const router = Router();

export default router;
