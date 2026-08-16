# Frontend Deployment Guide

OptizGYM uses a split deployment topology. The Vite frontend is deployed to a static hosting provider, while the Express and Socket.IO API runs from the API-only Docker image.

## Required frontend variables

Configure these variables in the frontend host’s build environment:

| Variable | Value |
|---|---|
| `VITE_NEON_AUTH_URL` | The Neon Auth URL for the target branch, such as `https://<neon-auth-host>/neondb/auth` |
| `VITE_API_URL` | The public HTTPS origin of the deployed API, with no trailing path required. This is intentionally browser-visible configuration, not a secret. |
| `VITE_PAYSTACK_PUBLIC_KEY` | Paystack’s public key for the target environment |

Do not rename `VITE_API_URL` to `API_URL`: Vite only exposes variables prefixed with `VITE_` to browser code, and the API origin is not a secret. Do not configure `PAYSTACK_SECRET_KEY`, `DATABASE_URL`, `NEON_AUTH_API_KEY`, or any other server-only secret in the frontend host.

## API configuration

Configure the API container with the following server-side variables:

```dotenv
NODE_ENV=production
PORT=3001
API_PUBLIC_URL=https://api.example.com
FRONTEND_URL=https://optibizgym.vercel.app,https://optizgym.vercel.app,https://staging-gym.example.com
DATABASE_URL=postgresql://...
NEON_AUTH_URL=https://<neon-auth-host>/neondb/auth
NEON_JWKS_URL=https://<neon-auth-host>/neondb/auth/.well-known/jwks.json
PAYSTACK_SECRET_KEY=sk_live_...
NEON_WEBHOOK_MAX_AGE_MS=300000
LOG_TO_FILE=false
```

`FRONTEND_URL` is a comma-separated allow-list. For the current OptizGYM deployment, include both `https://optibizgym.vercel.app` (the hostname currently shown by the failing browser request) and `https://optizgym.vercel.app` (the previously configured Vercel hostname). The API also includes these two owned production aliases defensively at runtime, but they should remain in Render’s `FRONTEND_URL` value for clear deployment configuration. `API_PUBLIC_URL` is used by the API’s Content Security Policy and should be the same public origin used in `VITE_API_URL`. Use HTTPS in deployed environments so the Socket.IO client can use `wss:`.

## Build and publish the frontend

Run the following from the repository root in the frontend build environment:

```bash
npm install --legacy-peer-deps
npm run build
```

Publish the generated `dist/` directory as a static site. Configure the host to rewrite unknown paths to `index.html`, because the application uses client-side React Router routes such as `/auth/sign-in` and `/dashboard`.

## Deploy the API image

Build and run the API image from the repository root:

```bash
docker build -t optizgym-api .
docker run --env-file .env -p 3001:3001 optizgym-api
```

The image does not contain or serve the frontend build. Confirm the API health endpoint at `https://api.example.com/api/health` and configure the Neon Auth webhook URL as:

```text
https://api.example.com/api/webhooks/neon-auth
```

Neon Auth webhook requests must be delivered to the final HTTPS endpoint without a redirect. The API verifies the `X-Neon-Signature`, `X-Neon-Signature-Kid`, and `X-Neon-Timestamp` headers before processing `user.created` and `user.updated` events.

## Paystack and CORS checklist

Configure the Paystack webhook URL to the deployed API’s Paystack endpoint, for example `https://api.example.com/api/webhooks/paystack`. Keep the Paystack secret only in the API environment. After deployment, verify that the frontend origin appears in `FRONTEND_URL`, the frontend has `VITE_API_URL` set to the API origin, and Socket.IO connects through the same API host.
