# OptizGYM Remediation Report

## Executive Summary

The OptizGYM repository has been repaired in place as a production hardening change. The live Neon Auth `AuthView` flow remains the only registration system, the unused custom registration implementation has been removed, and the Docker image now contains only the Express/Socket.IO API for the selected split deployment topology.

The Neon Auth webhook implementation now verifies Neon’s documented detached JWS Ed25519 signature before parsing or processing member data. Neon’s webhook documentation specifies `X-Neon-Signature`, `X-Neon-Signature-Kid`, and `X-Neon-Timestamp` headers, JWKS key lookup, timestamp binding, and raw-body verification [1]. The implementation follows that scheme rather than introducing an HMAC scheme intended for a different provider.

## Implemented Changes

| Area | Changes |
|---|---|
| Webhook security | Added detached JWS Ed25519 verification against Neon JWKS, key-ID matching, timestamp freshness validation, event header/payload consistency checks, and `401` responses for unverified requests. Preserved raw webhook bytes before JSON parsing. |
| Secret handling | Removed `VITE_PAYSTACK_SECRET_KEY` and obsolete custom-registration environment variables from `.env.example`; removed the supplied `.env` from the deliverable; added `.dockerignore` protections. |
| Auth configuration | Replaced the hardcoded frontend Neon Auth endpoint with required `VITE_NEON_AUTH_URL`; missing server Neon Auth variables now fail immediately with clear errors. |
| Database | Added `server/src/db/migrate.ts`; repaired the Drizzle journal and added valid `0002_snapshot.json`; added `0003_remove_legacy_registration.sql` and its snapshot to remove `password_hash`, `email_verification_token`, `email_verification_expires_at`, and the verification-token index. Enabled TLS certificate verification for Neon connections. |
| Registration cleanup | Removed the legacy registration controller, service, middleware, frontend components, registration schemas, routes, registration-health endpoint, legacy tests, and unused serverless database helper. Replaced stale sync coverage with Neon Auth-shaped tests. |
| Deployment | Converted `Dockerfile` to an API-only image. Added `FRONTEND_DEPLOYMENT.md` for separate static frontend hosting, API configuration, rewrites, CORS, Socket.IO, Neon Auth, and Paystack setup. |
| Production configuration | Made CSP origins derive from `NEON_AUTH_URL` and `API_PUBLIC_URL`; added `VITE_API_URL`; aligned Vite, Playwright, and README to port 8080; added comma-separated CORS origins; scoped the rate limiter with a looser public class-read limit; made Winston file logging opt-in. |
| Documentation | Updated `README.md`, clarified `AUTH_MIGRATION_GUIDE.md`, added an archive index, and moved stale Clerk and custom-registration documents under `docs/archive/`. |
| Test maintenance | Removed Clerk mocks from `server/test/setup.ts`, added Neon webhook tests, corrected stale landing-page assertions, and preserved the live member-sync test path with Neon Auth claims. |

## Verification Results

| Check | Result |
|---|---|
| `npm install --legacy-peer-deps` | Passed. npm reported 30 dependency vulnerabilities in the existing dependency graph: 1 low, 13 moderate, 12 high, and 4 critical. |
| `npm run build` | Passed for both Vite frontend and tsup API bundle. |
| `npm run test` | Passed: 3 test files, 8 tests. |
| `npm run test:backend` | Passed: 5 test files, 17 tests. |
| `npm run test:e2e` | Passed: 2 Playwright tests. The Playwright configuration now uses port 8080 and non-secret test-only placeholder environment values. |
| `npx tsc --noEmit` | Passed. |
| `drizzle-kit check` | Passed after repairing the migration snapshots and journal. |
| `npm run lint` | Not clean because the repository contains a pre-existing broad lint backlog: 178 errors and 10 warnings, primarily explicit `any` usage across unrelated application files. |

## Split Deployment Requirements

Deploy the frontend’s generated `dist/` directory to a static host and configure its SPA fallback to `index.html`. Set `VITE_NEON_AUTH_URL`, `VITE_API_URL`, and `VITE_PAYSTACK_PUBLIC_KEY` on the frontend host. Run the API image with server-only values including `NODE_ENV=production`, `API_PUBLIC_URL`, `FRONTEND_URL`, `DATABASE_URL`, `NEON_AUTH_URL`, `NEON_JWKS_URL`, and `PAYSTACK_SECRET_KEY`. The details are in [`FRONTEND_DEPLOYMENT.md`](./FRONTEND_DEPLOYMENT.md).

Configure Neon Auth to deliver webhooks to the final public HTTPS API URL at `/api/webhooks/neon-auth`. Configure Paystack to use the deployed API’s Paystack webhook endpoint. Do not use HTTP redirects for the Neon Auth webhook URL.

## Required Operator Actions

> **Rotate the Neon Auth API key and the `DATABASE_URL` credentials in the Neon Console before using this repository in any environment.**

Those credentials were present in the supplied archive and must be treated as exposed. I did not rotate, inspect, or modify them in the Neon Console. If the supplied Paystack secret was active rather than a test value, rotate that secret in Paystack as well.

After rotation, create a fresh local `.env` from `.env.example`, set `NODE_ENV=production` in deployment, verify the Neon Auth webhook configuration and signing headers, and confirm that the API’s `FRONTEND_URL` matches the deployed frontend origin or comma-separated origin allow-list.

## References

[1]: https://neon.com/docs/auth/guides/webhooks "Neon Auth Webhooks — Neon Documentation"
