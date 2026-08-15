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
