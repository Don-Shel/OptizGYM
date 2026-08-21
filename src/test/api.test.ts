import { describe, it, expect, vi } from 'vitest';
import { api, API_BASE } from '../lib/db';

// Mock global fetch
global.fetch = vi.fn();

describe('API Service Layer', () => {
  it('fetches members for admin', async () => {
    const mockMembers = [{ id: '1', email: 'test@test.com' }];
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockMembers,
    });

    const members = await api.members.getAll('fake-token');
    expect(members).toEqual(mockMembers);
    expect(fetch).toHaveBeenCalledWith(`${API_BASE}/members`, expect.objectContaining({
      headers: expect.objectContaining({
        'Authorization': 'Bearer fake-token'
      })
    }));
  });

  it('handles API errors gracefully', async () => {
    (fetch as any).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    await expect(api.members.getAll()).rejects.toThrow('Something went wrong. Please try again.');
  });

  it('fetches current member profile', async () => {
    const mockMe = { id: 'me-123', email: 'me@test.com' };
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockMe,
    });

    const me = await api.members.getMe('my-token');
    expect(me).toEqual(mockMe);
    expect(fetch).toHaveBeenCalledWith(`${API_BASE}/members/me`, expect.objectContaining({
      headers: expect.objectContaining({
        'Authorization': 'Bearer my-token'
      })
    }));
  });
});
