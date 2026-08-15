import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../index';
import { db } from '../src/utils/db';

describe('Booking API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/bookings', () => {
    const validBooking = {
      member_id: '1e5e7836-8c4d-4444-a957-3f9f9b9e9c9d',
      class_id: '2e5e7836-8c4d-4444-a957-3f9f9b9e9c9d'
    };

    it('successfully creates a booking for an active member', async () => {
      const mockMember = {
        id: '1e5e7836-8c4d-4444-a957-3f9f9b9e9c9d',
        authUserId: 'user_test_sync',
        plan: 'pro',
        membershipStatus: 'active'
      };
      const mockClass = {
        id: '2e5e7836-8c4d-4444-a957-3f9f9b9e9c9d',
        name: 'Yoga',
        enrolled: 5,
        capacity: 10
      };
      const mockNewBooking = {
        id: '3e5e7836-8c4d-4444-a957-3f9f9b9e9c9d',
        memberId: '1e5e7836-8c4d-4444-a957-3f9f9b9e9c9d',
        classId: '2e5e7836-8c4d-4444-a957-3f9f9b9e9c9d'
      };

      // Mock requireAuth and member check
      vi.mocked(db.then)
        .mockImplementationOnce((onFulfilled: any) => Promise.resolve([mockMember]).then(onFulfilled)) // requireAuth
        .mockImplementationOnce((onFulfilled: any) => Promise.resolve([mockMember]).then(onFulfilled)) // member select
        .mockImplementationOnce((onFulfilled: any) => Promise.resolve([mockClass]).then(onFulfilled))  // class select (with lock)
        .mockImplementationOnce((onFulfilled: any) => Promise.resolve([]).then(onFulfilled))           // booked check
        .mockImplementationOnce((onFulfilled: any) => Promise.resolve([mockNewBooking]).then(onFulfilled)) // insert returning
        .mockImplementationOnce((onFulfilled: any) => Promise.resolve([]).then(onFulfilled));          // update enrollment

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', 'Bearer valid-token')
        .send({
          member_id: mockMember.id,
          class_id: mockClass.id
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(mockNewBooking.id);
    });

    it('returns 400 if member is on free plan', async () => {
      const mockMember = {
        id: '1e5e7836-8c4d-4444-a957-3f9f9b9e9c9d',
        authUserId: 'user_test_sync',
        plan: 'free',
        membershipStatus: 'active'
      };

      vi.mocked(db.then)
        .mockImplementationOnce((onFulfilled: any) => Promise.resolve([mockMember]).then(onFulfilled)) // requireAuth
        .mockImplementationOnce((onFulfilled: any) => Promise.resolve([mockMember]).then(onFulfilled)); // member check in controller

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', 'Bearer valid-token')
        .send({
          member_id: mockMember.id,
          class_id: '1e5e7836-8c4d-4444-a957-3f9f9b9e9c9d'
        });

      expect(response.status).toBe(400); // Now 400 with BookingError
      expect(response.body.error).toContain('Membership upgrade required');
    });

    it('returns 400 if class is full', async () => {
      const mockMember = {
        id: '1e5e7836-8c4d-4444-a957-3f9f9b9e9c9d',
        authUserId: 'user_test_sync',
        plan: 'pro',
        membershipStatus: 'active'
      };
      const mockClass = {
        id: '2e5e7836-8c4d-4444-a957-3f9f9b9e9c9d',
        enrolled: 10,
        capacity: 10
      };

      vi.mocked(db.then)
        .mockImplementationOnce((onFulfilled: any) => Promise.resolve([mockMember]).then(onFulfilled)) // requireAuth
        .mockImplementationOnce((onFulfilled: any) => Promise.resolve([mockMember]).then(onFulfilled)) // member select
        .mockImplementationOnce((onFulfilled: any) => Promise.resolve([mockClass]).then(onFulfilled));  // class select

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', 'Bearer valid-token')
        .send({
          member_id: mockMember.id,
          class_id: mockClass.id
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Class is full');
    });


  });
});
