import { createAuthClient } from '@neondatabase/auth';
import { BetterAuthReactAdapter } from '@neondatabase/auth/react';

const authUrl = import.meta.env.VITE_NEON_AUTH_URL;

if (!authUrl) {
  throw new Error('[AUTH] VITE_NEON_AUTH_URL must be set for the frontend Neon Auth client.');
}

export const neonConfig = {
  authUrl,
  signInUrl: '/auth/sign-in',
  signUpUrl: '/auth/sign-up',
  afterSignInUrl: '/dashboard',
  afterSignUpUrl: '/auth/verify-email',
  afterSignOutUrl: '/',
};

export const authClient = createAuthClient(neonConfig.authUrl, {
  adapter: BetterAuthReactAdapter(),
  fetchOptions: {
    credentials: 'include',
  },
  socialProviders: ['google', 'github'],
  twoFactor: {
    enabled: true,
  },
});

/**
 * Return a short-lived Neon Auth JWT for forwarding to the API.
 * The SDK refreshes the token when necessary; callers must not cache it.
 */
export const getAuthToken = async (): Promise<string | null> => {
  const { data, error } = await authClient.token();
  if (error) {
    console.warn('[AUTH] Unable to obtain API token:', error);
    return null;
  }
  return data?.token ?? null;
};
