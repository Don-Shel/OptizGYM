import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { db } from './db';
import { members } from '../db/schema';
import { eq, isNull } from 'drizzle-orm';
import { verifyNeonToken } from './neon';
import { getAllowedFrontendOrigins } from '../config/cors';

let io: Server;

export type RealtimeResource = 'members' | 'classes' | 'trainers' | 'bookings' | 'payments' | 'notifications' | 'stats';
export type RealtimeAction = 'created' | 'updated' | 'deleted' | 'activated' | 'suspended' | 'cancelled';

export interface RealtimeChangeEvent {
  resource: RealtimeResource;
  action: RealtimeAction;
  id?: string;
  timestamp: string;
}

export const broadcastResourceChange = (
  resource: RealtimeResource,
  action: RealtimeAction,
  id?: string,
) => {
  const event: RealtimeChangeEvent = {
    resource,
    action,
    ...(id ? { id } : {}),
    timestamp: new Date().toISOString(),
  };
  broadcastToAll('resource-changed', event);
  return event;
};

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: getAllowedFrontendOrigins(),
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next();
    if (typeof token !== 'string') return next(new Error('Invalid socket authentication'));
    try {
      const claims = await verifyNeonToken(token);
      socket.data.authUserId = claims.sub;
      next();
    } catch {
      next(new Error('Socket authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[SOCKET] User connected: ${socket.id}`);

    socket.on('join-member-room', async (memberId: string) => {
      if (!memberId || typeof socket.data.authUserId !== 'string') return;
      const [member] = await db.select({ id: members.id })
        .from(members)
        .where(eq(members.authUserId, socket.data.authUserId))
        .limit(1);
      if (!member || member.id !== memberId) {
        socket.emit('socket-error', { message: 'Member room authorization failed' });
        return;
      }
      socket.data.memberId = member.id;
      socket.join(`member-${member.id}`);
    });

    socket.on('disconnect', () => {
      console.log(`[SOCKET] User disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

export const broadcastToMember = (memberId: string, event: string, data: any) => {
  if (io) io.to(`member-${memberId}`).emit(event, data);
};

export const broadcastToAll = (event: string, data: any) => {
  if (io) io.emit(event, data);
};
