import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../index';
import { db } from '../src/utils/db';

describe('Member API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/members/me', () => {
    it('returns member profile if authenticated', async () => {
      const mockMember = {
        id: '1e5e7836-8c4d-4444-a957-3f9f9b9e9c9d',
        authUserId: 'test-user-id',
        email: 'test@example.com',
        fullName: 'Test User',
        membershipStatus: 'active',
        deletedAt: null
      };

      // Mock the terminal 'then' of the query chain
      (db.then as any).mockImplementation((onFulfilled: any) =>
        Promise.resolve([mockMember]).then(onFulfilled)
      );

      const response = await request(app)
        .get('/api/members/me')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockMember);
    });

    it('returns 404 if member profile does not exist', async () => {
      // Mock both calls (requireAuth and getMe) to return empty
      (db.then as any)
        .mockImplementationOnce((onFulfilled: any) => Promise.resolve([]).then(onFulfilled)) // requireAuth
        .mockImplementationOnce((onFulfilled: any) => Promise.resolve([]).then(onFulfilled)); // getMe

      const response = await request(app)
        .get('/api/members/me')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('returns 401 if not authenticated', async () => {
      const response = await request(app).get('/api/members/me');
      expect(response.status).toBe(401);
    });
  });
});
