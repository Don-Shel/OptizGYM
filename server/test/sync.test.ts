import { beforeEach, describe, expect, it, vi } from 'vitest';
import { syncMember } from '../src/controllers/memberController';
import { db } from '../src/utils/db';

const makeResponse = () => {
  const response = {
    status: vi.fn(),
    json: vi.fn(),
  } as any;
  response.status.mockReturnValue(response);
  response.json.mockReturnValue(response);
  return response;
};

const makeMember = (overrides: Record<string, unknown> = {}) => ({
  id: 'uuid-sync-001',
  authUserId: 'user_test_sync',
  email: 'sync@example.com',
  isEmailVerified: 1,
  fullName: 'Sync User',
  phone: null,
  role: 'member',
  plan: 'free',
  planBilling: 'monthly',
  membershipStatus: 'pending',
  joinedAt: new Date(),
  expiresAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  ...overrides,
});

describe('syncMember with Neon Auth claims', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a new member from verified Neon Auth claims', async () => {
    const member = makeMember();
    (db.returning as any).mockResolvedValueOnce([member]);
    const req = {
      auth: {
        userId: 'user_test_sync',
        email: 'sync@example.com',
        email_verified: true,
        name: 'Sync User',
      },
      body: {},
    };
    const res = makeResponse();

    await syncMember(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: member });
    expect(db.values).toHaveBeenCalledWith(expect.objectContaining({
      authUserId: 'user_test_sync',
      email: 'sync@example.com',
      isEmailVerified: 1,
      membershipStatus: 'pending',
      plan: 'free',
    }));
  });

  it('rejects an email supplied in the request body when the token has none', async () => {
    const req = {
      auth: {
        userId: 'user_test_sync',
        email: '',
        email_verified: false,
        name: '',
      },
      body: { email: 'body@example.com', fullName: 'Body User' },
    };
    const res = makeResponse();

    await syncMember(req, res);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'VALIDATION_FAILED',
        message: 'User has no email address',
      },
    });
    expect(db.values).not.toHaveBeenCalled();
  });

  it('returns 422 when neither the token nor body contains an email', async () => {
    const req = {
      auth: { userId: 'user_test_sync', email: '', email_verified: false, name: '' },
      body: {},
    };
    const res = makeResponse();

    await syncMember(req, res);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'VALIDATION_FAILED',
        message: 'User has no email address',
      },
    });
  });

  it('retries a transient database failure and succeeds', async () => {
    const member = makeMember();
    (db.select as any).mockImplementationOnce(() => {
      throw new Error('Connection reset');
    });
    (db.returning as any).mockResolvedValueOnce([member]);
    const req = {
      auth: {
        userId: 'user_test_sync',
        email: 'sync@example.com',
        email_verified: true,
        name: 'Sync User',
      },
      body: {},
    };
    const res = makeResponse();

    await syncMember(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(db.select).toHaveBeenCalledTimes(2);
    expect(db.returning).toHaveBeenCalledTimes(1);
  });
});
