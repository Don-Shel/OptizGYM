import * as jose from 'jose';
import dotenv from 'dotenv';

dotenv.config();

export const neonAuthUrl = process.env.NEON_AUTH_URL;
export const neonJwksUrl = process.env.NEON_JWKS_URL;

if (!neonAuthUrl || !neonJwksUrl) {
  throw new Error(
    '[AUTH] NEON_AUTH_URL and NEON_JWKS_URL are required before Neon Auth can be initialized.'
  );
}

const JWKS = jose.createRemoteJWKSet(new URL(neonJwksUrl));
const webhookMaxAgeMs = Number(process.env.NEON_WEBHOOK_MAX_AGE_MS ?? 5 * 60 * 1000);

if (!Number.isFinite(webhookMaxAgeMs) || webhookMaxAgeMs <= 0) {
  throw new Error('[AUTH] NEON_WEBHOOK_MAX_AGE_MS must be a positive number of milliseconds.');
}

export const verifyNeonToken = async (token: string) => {
  try {
    const decoded = jose.decodeJwt(token);
    console.log(`[AUTH] Verifying token. Configured Iss: "${neonAuthUrl}" | Token Iss: "${decoded.iss}"`);

    const { payload } = await jose.jwtVerify(token, JWKS, {
      clockTolerance: '5s',
    });

    return {
      ...payload,
      sub: payload.sub,
      email: (payload as any).email ?? (payload as any).user_email ?? '',
      email_verified: (payload as any).email_verified ?? (payload as any).emailVerified ?? false,
      name: (payload as any).name ?? (payload as any).displayName ?? '',
    };
  } catch (error) {
    console.error(
      '[AUTH] ✗ Token verification failed:',
      error instanceof jose.errors.JWTClaimValidationFailed ? `Claim validation failed: ${error.claim} ${error.reason}` :
      error instanceof Error ? error.message : String(error)
    );
    if (error instanceof Error && error.stack) {
      console.error('[AUTH] Error stack:', error.stack);
    }
    throw error;
  }
};

/**
 * Verify Neon Managed Better Auth's detached JWS webhook signature.
 * Neon signs the timestamp and base64url-encoded raw body using Ed25519.
 */
export const verifyNeonWebhookSignature = async (
  rawBody: Buffer,
  headers: {
    signature?: string;
    signatureKid?: string;
    timestamp?: string;
  },
) => {
  const { signature, signatureKid, timestamp } = headers;

  if (!signature || !signatureKid || !timestamp) {
    throw new Error('Missing Neon webhook signature headers');
  }

  const timestampMs = Number(timestamp);
  if (!Number.isSafeInteger(timestampMs)) {
    throw new Error('Invalid Neon webhook timestamp');
  }

  if (Math.abs(Date.now() - timestampMs) > webhookMaxAgeMs) {
    throw new Error('Neon webhook timestamp is outside the permitted replay window');
  }

  const [headerB64, emptyPayload, signatureB64] = signature.split('.');
  if (!headerB64 || emptyPayload !== '' || !signatureB64) {
    throw new Error('Neon webhook signature must be a detached JWS');
  }

  const protectedHeader = jose.decodeProtectedHeader(signature);
  if (protectedHeader.alg !== 'EdDSA') {
    throw new Error('Unsupported Neon webhook signature algorithm');
  }
  if (protectedHeader.kid !== signatureKid) {
    throw new Error('Neon webhook signature key ID mismatch');
  }

  const payloadB64 = rawBody.toString('base64url');
  const signaturePayloadB64 = Buffer
    .from(`${timestamp}.${payloadB64}`, 'utf8')
    .toString('base64url');
  const detachedJws = `${headerB64}.${signaturePayloadB64}.${signatureB64}`;

  await jose.compactVerify(detachedJws, JWKS, {
    algorithms: ['EdDSA'],
  });
};
