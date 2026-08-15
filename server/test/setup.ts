import { vi, beforeAll, afterAll } from 'vitest';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Mock Socket.io
vi.mock('../src/utils/socket', () => ({
  initSocket: vi.fn(),
  getIO: vi.fn(),
  broadcastToMember: vi.fn(),
  broadcastToAll: vi.fn(),
}));

// Mock Neon Auth utility
vi.mock('../src/utils/neon', () => ({
  verifyNeonWebhookSignature: vi.fn().mockResolvedValue(undefined),
  verifyNeonToken: vi.fn().mockResolvedValue({
    sub: 'user_test_sync',
    email: 'test@example.com',
    email_verified: true,
    name: 'Test User',
    iss: 'https://auth.example.com',
  }),
}));

// Mock DB utility
vi.mock('../src/utils/db', () => {
  const mockQuery = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    onConflictDoUpdate: vi.fn().mockReturnThis(),
    onConflictDoNothing: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    for: vi.fn().mockReturnThis(),
    transaction: vi.fn().mockImplementation((cb) => cb(mockQuery)),
    execute: vi.fn().mockResolvedValue([]),
    // Make it awaitable by default returning an empty array
    then: vi.fn().mockImplementation((onFulfilled) => Promise.resolve([]).then(onFulfilled)),
  };

  return {
    db: mockQuery,
    sql: vi.fn().mockResolvedValue([]),
  };
});
