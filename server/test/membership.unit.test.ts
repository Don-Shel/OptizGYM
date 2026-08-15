import { describe, it, expect } from 'vitest';
import { calculateExpiryDate, getBaseDateForMembership } from '../src/services/membershipService';

describe('Membership Service', () => {
  describe('calculateExpiryDate', () => {
    it('adds 1 month for monthly billing', () => {
      const baseDate = new Date('2024-01-01');
      const expiry = calculateExpiryDate(baseDate, 'monthly');
      expect(expiry.toISOString()).toBe(new Date('2024-02-01').toISOString());
    });

    it('adds 1 year for yearly billing', () => {
      const baseDate = new Date('2024-01-01');
      const expiry = calculateExpiryDate(baseDate, 'yearly');
      expect(expiry.toISOString()).toBe(new Date('2025-01-01').toISOString());
    });
  });

  describe('getBaseDateForMembership', () => {
    it('returns current date if not renewal or inactive', () => {
      const currentExpiry = new Date('2024-01-01');
      const baseDate = getBaseDateForMembership(currentExpiry, 'initial', 'pending');
      // Should be roughly now
      expect(baseDate.getTime()).toBeGreaterThan(new Date('2024-01-01').getTime());
    });

    it('returns current expiry if renewal and active and in the future', () => {
      const futureExpiry = new Date(Date.now() + 10000000);
      const baseDate = getBaseDateForMembership(futureExpiry, 'renewal', 'active');
      expect(baseDate.getTime()).toBe(futureExpiry.getTime());
    });

    it('returns now if current expiry is in the past', () => {
      const pastExpiry = new Date('2020-01-01');
      const baseDate = getBaseDateForMembership(pastExpiry, 'renewal', 'active');
      expect(baseDate.getTime()).toBeGreaterThan(pastExpiry.getTime());
    });
  });
});
