import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { app } from '../index';
import { verifyNeonWebhookSignature } from '../src/utils/neon';

describe('Neon Auth webhooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when the Neon signature verifier rejects the request', async () => {
    vi.mocked(verifyNeonWebhookSignature).mockRejectedValueOnce(new Error('invalid signature'));

    const response = await request(app)
      .post('/api/webhooks/neon-auth')
      .send({
        event_type: 'user.created',
        user: { id: 'auth-user-1', email: 'user@example.com' },
      });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Invalid webhook signature' });
  });

  it('acknowledges signed event types that are not member-sync events', async () => {
    const response = await request(app)
      .post('/api/webhooks/neon-auth')
      .set('X-Neon-Signature', 'detached-jws')
      .set('X-Neon-Signature-Kid', 'test-key')
      .set('X-Neon-Timestamp', String(Date.now()))
      .send({ event_type: 'send.otp', user: { id: 'auth-user-1' } });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ received: true });
    expect(verifyNeonWebhookSignature).toHaveBeenCalledTimes(1);
  });
});
