import { createAuthClient } from '@neondatabase/auth';
import { BetterAuthReactAdapter } from '@neondatabase/auth/react';

// The Neon Auth base URL is public configuration, not a secret. The Vercel
// environment should still define VITE_NEON_AUTH_URL, but this known production
// endpoint fallback prevents a missing dashboard variable from crashing the
// compiled frontend at module load.
const productionAuthUrl = 'https://ep-autumn-resonance-ancbtuoc.neonauth.c-6.us-east-1.aws.neon.tech/neondb/auth';
const authUrl = import.meta.env.VITE_NEON_AUTH_URL?.trim() || productionAuthUrl;

if (!import.meta.env.VITE_NEON_AUTH_URL) {
  console.warn('[AUTH] VITE_NEON_AUTH_URL is missing; using the production Neon Auth endpoint fallback. Configure the Vercel variable for future environment portability.');
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
