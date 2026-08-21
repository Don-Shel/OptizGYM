import * as jose from 'jose';
import dotenv from 'dotenv';
import logger from './logger';

dotenv.config();

export const neonAuthUrl = process.env.NEON_AUTH_URL;
export const neonJwksUrl = process.env.NEON_JWKS_URL;
const neonAuthIssuerConfig = process.env.NEON_AUTH_ISSUER?.trim();
const neonAuthAudienceConfig = process.env.NEON_AUTH_AUDIENCE?.trim();

if (!neonAuthUrl || !neonJwksUrl) {
  throw new Error(
    '[AUTH] NEON_AUTH_URL and NEON_JWKS_URL are required before Neon Auth can be initialized.'
  );
}

if (process.env.NODE_ENV === 'production' && (!neonAuthIssuerConfig || !neonAuthAudienceConfig)) {
  throw new Error('[AUTH] NEON_AUTH_ISSUER and NEON_AUTH_AUDIENCE are required in production.');
}

const normalizeAuthOrigin = (value: string, variableName: string) => {
  try {
    const parsed = new URL(value);
    if (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:') {
      throw new Error(`${variableName} must use HTTPS in production.`);
    }
    return parsed.origin;
  } catch (error) {
    if (error instanceof Error && error.message.includes('must use HTTPS')) throw error;
    throw new Error(`${variableName} must be a valid Auth URL.`);
  }
};

// Neon Auth JWT `iss` and `aud` claims use the Auth URL origin. Normalize
// operator-provided values so a copied `/neondb/auth` path cannot cause 401s.
const neonAuthIssuer = neonAuthIssuerConfig ? normalizeAuthOrigin(neonAuthIssuerConfig, 'NEON_AUTH_ISSUER') : undefined;
const neonAuthAudience = neonAuthAudienceConfig ? normalizeAuthOrigin(neonAuthAudienceConfig, 'NEON_AUTH_AUDIENCE') : undefined;

const JWKS = jose.createRemoteJWKSet(new URL(neonJwksUrl));
const webhookMaxAgeMs = Number(process.env.NEON_WEBHOOK_MAX_AGE_MS ?? 5 * 60 * 1000);

if (!Number.isFinite(webhookMaxAgeMs) || webhookMaxAgeMs <= 0) {
  throw new Error('[AUTH] NEON_WEBHOOK_MAX_AGE_MS must be a positive number of milliseconds.');
}

const MAX_TOKEN_LIFETIME_SECONDS = 24 * 60 * 60;
const CLOCK_TOLERANCE_SECONDS = 5;

export const verifyNeonToken = async (token: string) => {
  try {
    const verifyOptions: jose.JWTVerifyOptions = {
      algorithms: ['EdDSA'],
      requiredClaims: ['sub', 'iat', 'exp'],
      clockTolerance: CLOCK_TOLERANCE_SECONDS,
      ...(neonAuthIssuer ? { issuer: neonAuthIssuer } : {}),
      ...(neonAuthAudience ? { audience: neonAuthAudience } : {}),
    };
    const { payload } = await jose.jwtVerify(token, JWKS, verifyOptions);
    const now = Math.floor(Date.now() / 1000);

    if (
      typeof payload.iat !== 'number' ||
      typeof payload.exp !== 'number' ||
      payload.iat > now + CLOCK_TOLERANCE_SECONDS ||
      payload.exp <= payload.iat ||
      payload.exp - payload.iat > MAX_TOKEN_LIFETIME_SECONDS
    ) {
      throw new Error('JWT lifetime or issue time violates the authentication policy');
    }

    return {
      ...payload,
      sub: payload.sub,
      email: (payload as any).email ?? (payload as any).user_email ?? '',
      email_verified: (payload as any).email_verified ?? (payload as any).emailVerified ?? false,
      name: (payload as any).name ?? (payload as any).displayName ?? '',
    };
  } catch (error) {
    logger.warn('[AUTH] Token verification failed', {
      reason: error instanceof jose.errors.JWTClaimValidationFailed
        ? `${error.claim}:${error.reason}`
        : error instanceof Error ? error.message : String(error),
    });
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
  }
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
