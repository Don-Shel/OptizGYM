# OptizGYM — Gym Management Platform

OptizGYM is a full-stack gym management platform built with React, Vite, TypeScript, Tailwind CSS, Express, Drizzle ORM, and Neon PostgreSQL.

## Features

- Neon Auth sign-up, email verification, sign-in, password recovery, social providers, and two-factor authentication.
- Paystack payment integration for membership subscriptions and webhook-driven membership activation.
- Member dashboard for class booking, payments, workout tracking, and membership status.
- Admin dashboard for member management, class administration, payments, and reporting.
- Socket.IO updates for real-time member notifications.

## Architecture

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui, React Router |
| API | Express 5, TypeScript, Zod, Helmet, CORS, rate limiting |
| Authentication | Neon Auth with server-side JWT/JWKS verification and signed Neon Auth webhooks |
| Database | Neon PostgreSQL through `pg` and Drizzle ORM |
| Payments | Paystack, with server-side webhook signature verification |
| Realtime | Socket.IO |
| Deployment | Split topology: frontend deployed separately from the API Docker image |

The frontend uses Neon’s prebuilt `AuthView` components. The API does not expose a parallel password-registration or email-token system.

## Local Development

1. Install dependencies:

   ```bash
   npm install --legacy-peer-deps
   ```

2. Copy the environment template and provide real values:

   ```bash
   cp .env.example .env
   ```

   Keep `DATABASE_URL`, `NEON_AUTH_URL`, `NEON_JWKS_URL`, and `PAYSTACK_SECRET_KEY` server-side. The frontend only receives variables prefixed with `VITE_`.

3. Start the frontend and API together:

   ```bash
   npm run fullstack
   ```

   The Vite frontend is available at `http://localhost:8080`, and the API is available at `http://localhost:3001`.

4. Apply versioned database migrations when required:

   ```bash
   npm run db:migrate
   ```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite frontend on port 8080 |
| `npm run server` | Start the Express API |
| `npm run fullstack` | Start the frontend and API concurrently |
| `npm run build` | Build the frontend and API bundle |
| `npm run lint` | Run ESLint |
| `npm run test` | Run frontend Vitest tests |
| `npm run test:backend` | Run backend Vitest tests |
| `npm run test:e2e` | Run Playwright end-to-end tests |
| `npm run db:generate` | Generate a Drizzle migration from schema changes |
| `npm run db:migrate` | Apply the versioned Drizzle migrations |

## Split Deployment

The Docker image is API-only. Build and run it with a server-side `.env` containing the API variables, `DATABASE_URL`, Neon Auth settings, and Paystack’s secret key. The image listens on port 3001 and does not serve the Vite build.

Deploy the frontend separately using the instructions in [`FRONTEND_DEPLOYMENT.md`](./FRONTEND_DEPLOYMENT.md). Set `VITE_API_URL` to the public API origin, `VITE_NEON_AUTH_URL` to the Neon Auth URL, and configure the API’s `FRONTEND_URL` as a comma-separated allow-list of permitted frontend origins.

## Security Notes

Neon Auth webhook requests are verified using Neon’s signed detached JWS Ed25519 scheme before their payloads are processed. Paystack webhooks continue to use their HMAC signature verification. Database TLS certificate verification is enabled for Neon connections, and file logging is opt-in through `LOG_TO_FILE=true`.

Do not commit `.env` files or include them in Docker build contexts. The credentials that were present in the supplied archive must be rotated in the Neon Console before deployment; see the final remediation summary for the required operator actions.

## Historical Documentation

Clerk-era deployment and registration documents are preserved under `docs/archive/` for reference only. They are not instructions for the current Neon Auth architecture. `AUTH_MIGRATION_GUIDE.md` remains current.
