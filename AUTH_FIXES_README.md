# OptizGYM Authentication Fixes

This archive contains the latest OptizGYM source code after the Neon Auth authentication remediation.

## Included fixes

The Neon Auth production branch is configured for email-password sign-up with mandatory six-digit OTP verification through Neon’s shared email provider. The frontend now uses a controlled sign-up form that stores the pending email and routes to `/auth/verify-email`. The verification screen uses Neon Auth’s supported `emailOtp.sendVerificationOtp()` and `emailOtp.verifyEmail()` methods.

The member API now refreshes the application member’s email, name, and email-verification status from verified Neon JWT claims. The AuthContext retries profile resolution if a short-lived API token is not immediately available after sign-in or sign-up. The PostgreSQL raw SQL compatibility helper was repaired so the API health endpoint and legacy system queries work correctly.

## Local setup

1. Copy `.env.example` to `.env` and fill in the Neon Auth, database, API, and Paystack test values.
2. Install dependencies with `npm install --legacy-peer-deps`.
3. Apply migrations with `npm run db:migrate` when the target database requires them.
4. Start the API and Vite frontend with `npm run fullstack`.
5. Open `http://localhost:8080/auth/sign-up`.
6. Register with a test email, retrieve the six-digit OTP from the email inbox, and enter it on the verification screen.

## Verification commands

```bash
npx tsc --noEmit
npm run test:backend
npm run test
npm run test:e2e
npm run build
```

The archive intentionally excludes `.env`, `.env.local`, `node_modules`, `dist`, `dist-server`, logs, Playwright reports, and other generated or secret-bearing files.


## E2E and staging authentication

Production and staging Neon Auth environments require email verification. The application intentionally does not include a production verification bypass because bypassing email verification would weaken account security.

For browser end-to-end testing, provision one dedicated test account in the Neon Auth environment used by the test deployment:

1. Register a dedicated address such as `optizgym-e2e-<environment>@your-test-domain.example` through `/auth/sign-up`.
2. Retrieve the six-digit OTP from the controlled test inbox and complete `/auth/verify-email` once.
3. Sign in with that verified account and confirm the dashboard and sign-out controls are reachable.
4. Promote the corresponding member profile to administrator only in the non-production test database when admin flow coverage is required. Do not reuse a production owner account for automated tests.
5. Store the test email and password in the test runner’s secret store or local `.env.test` file. Never place them in `VITE_*` variables, source code, screenshots, or committed files.

When a controlled test inbox is unavailable, the auth-blocked browser flows cannot be completed honestly from the sandbox. The correct resolution is to provide a verified test account or test inbox; the application should not add a production-only OTP bypass.

Recommended non-production test variables are server/test-runner variables only:

```env
E2E_AUTH_EMAIL=verified-test-account@example.com
E2E_AUTH_PASSWORD=use-the-secret-store
E2E_ADMIN_EMAIL=verified-admin-test-account@example.com
E2E_ADMIN_PASSWORD=use-the-secret-store
```

These variables are documentation placeholders and must not be added to Vercel frontend environment variables.
