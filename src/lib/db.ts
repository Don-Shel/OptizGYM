/**
 * API service layer for the Express backend.
 *
 * The frontend and API are deployed separately in production. `VITE_API_URL`
 * therefore points at the API origin, while local development can continue to
 * use the relative `/api` fallback.
 */

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
export const API_BASE = configuredApiUrl
  ? `${configuredApiUrl.replace(/\/+$/, '')}${configuredApiUrl.replace(/\/+$/, '').endsWith('/api') ? '' : '/api'}`
  : '/api';

const getHeaders = (token?: string | null): HeadersInit => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

const unwrap = async (res: Response, fallbackMsg = 'Request failed'): Promise<any> => {
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as Record<string, string>;
    throw new Error(body.error ?? body.message ?? `${fallbackMsg} (${res.status})`);
  }
  const body = await res.json();
  return body.data !== undefined ? body.data : body;
};

const request = async (path: string, init: RequestInit = {}, fallbackMsg?: string) => {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...init,
  });
  return unwrap(res, fallbackMsg);
};

export const api = {
  sync: async (token: string) => request('/members/sync', {
    method: 'POST',
    headers: getHeaders(token),
  }, 'Sync failed'),

  members: {
    getAll: async (token?: string | null) => request('/members', { headers: getHeaders(token) }, 'Failed to fetch members'),
    getMe: async (token: string) => request('/members/me', { headers: getHeaders(token) }, 'Failed to fetch profile'),
    updateProfile: async (data: { phone: string }, token: string | null) => request('/members/me/profile', {
      method: 'PATCH', headers: getHeaders(token), body: JSON.stringify(data),
    }, 'Failed to update profile'),
    updateMembership: async (data: any, token?: string | null) => request('/members/me/membership', {
      method: 'PATCH', headers: getHeaders(token), body: JSON.stringify(data),
    }, 'Failed to update membership'),
    create: async (data: any, token?: string | null) => request('/members', {
      method: 'POST', headers: getHeaders(token), body: JSON.stringify(data),
    }, 'Failed to create member'),
    createAdmin: async (data: any, token?: string | null) => request('/members/admin', {
      method: 'POST', headers: getHeaders(token), body: JSON.stringify(data),
    }, 'Failed to create member profile'),
    update: async (id: string, data: any, token?: string | null) => request(`/members/${id}`, {
      method: 'PATCH', headers: getHeaders(token), body: JSON.stringify(data),
    }, 'Failed to update member'),
    activate: async (id: string, data: any = {}, token?: string | null) => request(`/members/${id}/activate`, {
      method: 'POST', headers: getHeaders(token), body: JSON.stringify(data),
    }, 'Failed to activate member profile'),
    suspend: async (id: string, token?: string | null) => request(`/members/${id}/suspend`, {
      method: 'POST', headers: getHeaders(token),
    }, 'Failed to suspend member'),
    remove: async (id: string, token?: string | null) => request(`/members/${id}`, {
      method: 'DELETE', headers: getHeaders(token),
    }, 'Failed to remove member'),
  },

  classes: {
    getAll: async () => request('/classes', {}, 'Failed to fetch classes'),
    getInstructors: async (token?: string | null) => request('/classes/instructors', { headers: getHeaders(token) }, 'Failed to fetch instructors'),
    create: async (data: any, token: string) => request('/classes', {
      method: 'POST', headers: getHeaders(token), body: JSON.stringify(data),
    }, 'Failed to create class'),
    update: async (id: string, data: any, token: string) => request(`/classes/${id}`, {
      method: 'PUT', headers: getHeaders(token), body: JSON.stringify(data),
    }, 'Failed to update class'),
    delete: async (id: string, token: string) => request(`/classes/${id}`, {
      method: 'DELETE', headers: getHeaders(token),
    }, 'Failed to delete class'),
  },

  bookings: {
    getByMemberId: async (memberId: string, token: string | null) => request(`/bookings/${memberId}`, {
      headers: getHeaders(token),
    }, 'Failed to fetch bookings'),
    create: async (data: any, token: string | null) => request('/bookings', {
      method: 'POST', headers: getHeaders(token), body: JSON.stringify(data),
    }, 'Failed to create booking'),
    cancel: async (bookingId: string, token: string | null) => request(`/bookings/${bookingId}`, {
      method: 'DELETE', headers: getHeaders(token),
    }, 'Failed to cancel booking'),
  },

  payments: {
    getByMemberId: async (memberId: string, token: string | null) => request(`/payments/${memberId}`, {
      headers: getHeaders(token),
    }, 'Failed to fetch payments'),
    getReceipt: async (paymentId: string, token: string | null) => request(`/payments/${paymentId}/receipt`, {
      headers: getHeaders(token),
    }, 'Failed to fetch receipt'),
    create: async (data: any, token: string | null) => request('/payments', {
      method: 'POST', headers: getHeaders(token), body: JSON.stringify(data),
    }, 'Failed to create payment'),
    verify: async (data: any, token: string | null) => request('/payments/verify', {
      method: 'POST', headers: getHeaders(token), body: JSON.stringify(data),
    }, 'Failed to verify payment'),
    getAdmin: async (token: string | null) => request('/payments/admin', {
      headers: getHeaders(token),
    }, 'Failed to fetch admin payments'),
    retry: async (paymentId: string, token: string | null) => request(`/payments/${paymentId}/retry`, {
      method: 'POST', headers: getHeaders(token),
    }, 'Failed to retry payment'),
    remind: async (paymentId: string, token: string | null) => request(`/payments/${paymentId}/remind`, {
      method: 'POST', headers: getHeaders(token),
    }, 'Failed to send payment reminder'),
  },

  workouts: {
    getByMemberId: async (memberId: string, token: string | null) => request(`/workouts/${memberId}`, {
      headers: getHeaders(token),
    }, 'Failed to fetch workouts'),
    create: async (data: any, token: string | null) => request('/workouts', {
      method: 'POST', headers: getHeaders(token), body: JSON.stringify(data),
    }, 'Failed to create workout'),
  },

  notifications: {
    getMine: async (token: string | null) => request('/notifications', { headers: getHeaders(token) }, 'Failed to fetch notifications'),
    markRead: async (id: string, token: string | null) => request(`/notifications/${id}/read`, {
      method: 'PATCH', headers: getHeaders(token),
    }, 'Failed to mark notification as read'),
  },

  trainers: {
    getAll: async (token: string | null) => request('/trainers', { headers: getHeaders(token) }, 'Failed to fetch trainers'),
    create: async (data: any, token: string | null) => request('/trainers', {
      method: 'POST', headers: getHeaders(token), body: JSON.stringify(data),
    }, 'Failed to create trainer'),
    update: async (id: string, data: any, token: string | null) => request(`/trainers/${id}`, {
      method: 'PUT', headers: getHeaders(token), body: JSON.stringify(data),
    }, 'Failed to update trainer'),
    delete: async (id: string, token: string | null) => request(`/trainers/${id}`, {
      method: 'DELETE', headers: getHeaders(token),
    }, 'Failed to delete trainer'),
  },

  admin: {
    getStats: async (token: string | null) => request('/stats', { headers: getHeaders(token) }, 'Failed to fetch admin stats'),
    getAnalytics: async (token: string | null) => request('/analytics', { headers: getHeaders(token) }, 'Failed to fetch admin analytics'),
  },
};
