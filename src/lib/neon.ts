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

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

/**
 * Return a short-lived Neon Auth JWT for forwarding to the API.
 *
 * Neon can expose the JWT in either the Better Auth session object or the
 * dedicated `/token` response. Immediately after email/password sign-in,
 * the session cookie and the JWT header can become available on adjacent
 * requests, so both sources are checked and retried briefly.
 */
export const getAuthToken = async (): Promise<string | null> => {
  const client = authClient as any;
  const maxAttempts = 5;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const sessionResponse = await client.getSession({
        fetchOptions: { credentials: 'include' },
      });
      const sessionToken = sessionResponse?.data?.session?.token;
      if (typeof sessionToken === 'string' && sessionToken.length > 0) {
        return sessionToken;
      }
    } catch (error) {
      if (attempt === maxAttempts - 1) {
        console.warn('[AUTH] Unable to read the Neon Auth session:', error);
      }
    }

    try {
      const tokenResponse = await client.token({
        fetchOptions: {
          credentials: 'include',
          throw: false,
        },
      });
      const token = tokenResponse?.data?.token ?? tokenResponse?.token;
      if (typeof token === 'string' && token.length > 0) {
        return token;
      }
    } catch (error) {
      if (attempt === maxAttempts - 1) {
        console.warn('[AUTH] Unable to obtain the Neon Auth API token:', error);
      }
    }

    if (attempt < maxAttempts - 1) {
      await wait(250 * (attempt + 1));
    }
  }

  console.warn('[AUTH] No Neon Auth JWT was available after retries. The user may still be signed out or the Auth origin/session cookie may be misconfigured.');
  return null;
};
