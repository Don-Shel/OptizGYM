import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables before importing modules that initialize clients.
dotenv.config({ path: path.resolve(__dirname, '../.env') });

type Origin = string;

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { createServer } from 'http';
import { initSocket } from './src/utils/socket';
import { errorHandler } from './src/middleware/errorHandler';

import authRoutes from './src/routes/authRoutes';
import memberRoutes from './src/routes/memberRoutes';
import classRoutes from './src/routes/classRoutes';
import bookingRoutes from './src/routes/bookingRoutes';
import paymentRoutes from './src/routes/paymentRoutes';
import workoutRoutes from './src/routes/workoutRoutes';
import systemRoutes from './src/routes/systemRoutes';
import webhookRoutes from './src/routes/webhookRoutes';
import equipmentRoutes from './src/routes/equipmentRoutes';
import notificationRoutes from './src/routes/notificationRoutes';

const app = express();
const httpServer = createServer(app);
const port = Number(process.env.PORT || 3001);
const frontendOrigins: Origin[] = (process.env.FRONTEND_URL || 'http://localhost:8080')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const apiPublicUrl = process.env.API_PUBLIC_URL || `http://localhost:${port}`;
const neonAuthOrigin = process.env.NEON_AUTH_URL
  ? new URL(process.env.NEON_AUTH_URL).origin
  : undefined;
const socketPublicUrl = apiPublicUrl.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

const publicReadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many sensitive requests, please try again later.' },
});

initSocket(httpServer);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", ...(neonAuthOrigin ? [neonAuthOrigin] : [])],
      connectSrc: [
        "'self'",
        ...(neonAuthOrigin ? [neonAuthOrigin] : []),
        apiPublicUrl,
        socketPublicUrl,
      ],
      imgSrc: ["'self'", 'data:'],
      workerSrc: ["'self'", 'blob:'],
    },
  },
}));

app.use(cors({
  origin: frontendOrigins,
  credentials: true,
}));
console.log(`[SERVER] → CORS allowed origins: ${frontendOrigins.join(', ')}`);

// Public class listings are read-heavy, so they receive a looser limiter.
app.use((req, res, next) => {
  if (req.method === 'GET' && req.path.startsWith('/api/classes')) {
    return publicReadLimiter(req, res, next);
  }
  return apiLimiter(req, res, next);
});

// Webhook routes must run before express.json so their raw request bodies remain available.
app.use('/api/webhooks', authLimiter, webhookRoutes);

app.use(express.json());

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', authLimiter, paymentRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', systemRoutes);

// The frontend is deployed separately in the split topology; this process is API-only.
app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(port, () => {
    console.log(`[SERVER] API listening at http://localhost:${port}`);
  });
}

export { app, httpServer };
