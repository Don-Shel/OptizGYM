# Optibizgym Deployment & Monitoring Guide

## Environment Variables

Ensure the following variables are set in your production environment:

### Backend (.env)
- `PORT`: Server port (default: 3001)
- `DATABASE_URL`: Neon PostgreSQL connection string
- `CLERK_SECRET_KEY`: Clerk backend API key
- `CLERK_WEBHOOK_SECRET`: Secret for verifying Clerk webhooks
- `FRONTEND_URL`: URL of your deployed frontend (e.g., https://optibizgym.com)
- `LOG_LEVEL`: Logging level (info, error, debug)

### Frontend (.env.production)
- `VITE_API_URL`: Backend API URL
- `VITE_CLERK_PUBLISHABLE_KEY`: Clerk public key
- `VITE_PAYSTACK_PUBLIC_KEY`: Paystack public key for payments

## Build & Deployment

### Manual Build
```bash
npm install
npm run build
```
This will build the frontend into `dist/` and the backend into `dist-server/`.

### Production Start
```bash
npm run start
```

## Monitoring

### Logging (Winston)
Logs are written to:
- `server/logs/error.log`: Error-level logs only.
- `server/logs/combined.log`: All logs (info, warn, error).

### Health Checks
- **Basic**: `GET /api/health`
- **Advanced**: `GET /api/health` (includes CPU, Memory, and DB status)

## Database Backups
Neon PostgreSQL automatically performs:
- **Daily Backups**: Retained for 30 days.
- **Point-in-Time Recovery (PITR)**: Allows restoring to any second within the retention period.
- **Manual Backups**: Can be triggered via the Neon console before major migrations.

## Scaling
- **Backend**: Stateless and can be horizontally scaled with a load balancer.
- **Frontend**: Static assets served via CDN (Vercel/Netlify).
- **Database**: Neon's autoscaling automatically adjusts compute resources based on load.
